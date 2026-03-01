use rss_reader::db;
use rss_reader::db::{get_legacy_db_path, init_database_at_path};
use sha2::{Digest, Sha256};
use std::process::Command;
use std::sync::Mutex;
use tauri::Manager;

/// Parse HTTP Range header (e.g. "bytes=0-1024") into (start, end) tuple
fn parse_range_header(range: &str, total_size: u64) -> Option<(u64, u64)> {
    let range = range.trim();
    if !range.starts_with("bytes=") {
        return None;
    }
    let range_spec = &range[6..];
    let parts: Vec<&str> = range_spec.splitn(2, '-').collect();
    if parts.len() != 2 {
        return None;
    }

    let start = if parts[0].is_empty() {
        let suffix_len: u64 = parts[1].parse().ok()?;
        if suffix_len > total_size {
            0
        } else {
            total_size - suffix_len
        }
    } else {
        parts[0].parse().ok()?
    };

    let end = if parts[1].is_empty() || parts[0].is_empty() {
        total_size - 1
    } else {
        let end_val: u64 = parts[1].parse().ok()?;
        std::cmp::min(end_val, total_size - 1)
    };

    if start >= total_size || start > end {
        return None;
    }

    Some((start, end))
}

/// Guess MIME type from URL, stripping query params and fragments first
fn guess_mime_type(url: &str) -> String {
    let clean_path = if let Some(q) = url.find('?') {
        &url[..q]
    } else if let Some(f) = url.find('#') {
        &url[..f]
    } else {
        url
    };
    let mut mime_type = mime_guess::from_path(clean_path)
        .first_or_octet_stream()
        .as_ref()
        .to_string();

    if mime_type == "application/octet-stream" {
        let lower_url = url.to_lowercase();
        if lower_url.contains(".mp4") {
            mime_type = "video/mp4".to_string();
        } else if lower_url.contains(".webm") {
            mime_type = "video/webm".to_string();
        } else if lower_url.contains(".m3u8") {
            mime_type = "application/vnd.apple.mpegurl".to_string();
        } else if lower_url.contains(".ogg") || lower_url.contains(".ogv") {
            mime_type = "video/ogg".to_string();
        }
    }
    mime_type
}

/// Build an HTTP client with appropriate headers
fn build_http_client() -> Result<reqwest::blocking::Client, reqwest::Error> {
    reqwest::blocking::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .timeout(std::time::Duration::from_secs(120))
        .build()
}

/// Cache a remote media file locally and return its file path.
/// Uses SHA256 hash of the URL as the cache filename.
#[tauri::command]
fn cache_media(url: String, app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut hasher = Sha256::new();
    hasher.update(url.as_bytes());
    let hash = hex::encode(hasher.finalize());

    let cache_dir = app_handle
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("media_cache");

    if !cache_dir.exists() {
        std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }

    let file_path = cache_dir.join(&hash);

    if file_path.exists() {
        return Ok(file_path.to_string_lossy().to_string());
    }

    let client = build_http_client().map_err(|e| e.to_string())?;
    let response = client.get(&url).send().map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Failed to download: HTTP {}", response.status()));
    }
    let bytes = response.bytes().map_err(|e| e.to_string())?.to_vec();
    std::fs::write(&file_path, &bytes).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    match parsed.scheme() {
        "http" | "https" => {}
        _ => return Err("Only http/https links are supported".to_string()),
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(parsed.as_str())
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("rundll32")
            .args(["url.dll,FileProtocolHandler", parsed.as_str()])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        Command::new("xdg-open")
            .arg(parsed.as_str())
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .register_asynchronous_uri_scheme_protocol("rss-media", move |ctx, request, responder| {
            let app = ctx.app_handle().clone();

            let path = request.uri().path().to_string();
            let encoded_url_from_path = if path.starts_with('/') {
                path[1..].to_string()
            } else {
                path.clone()
            };

            let encoded_url = if encoded_url_from_path.is_empty() {
                let uri_string = request.uri().to_string();
                uri_string
                    .strip_prefix("rss-media://localhost/")
                    .or_else(|| uri_string.strip_prefix("rss-media://localhost"))
                    .or_else(|| uri_string.strip_prefix("rss-media://"))
                    .unwrap_or(&uri_string)
                    .to_string()
            } else {
                encoded_url_from_path
            };

            let range_header = request
                .headers()
                .get("Range")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string());

            std::thread::spawn(move || {
                let result: Result<tauri::http::Response<Vec<u8>>, Box<dyn std::error::Error>> =
                    (|| {
                        let decoded_url = urlencoding::decode(&encoded_url)?.into_owned();
                        let mime_type = guess_mime_type(&decoded_url);

                        let mut hasher = Sha256::new();
                        hasher.update(decoded_url.as_bytes());
                        let hash = hex::encode(hasher.finalize());

                        let cache_dir = app.path().app_cache_dir()?.join("media_cache");
                        if !cache_dir.exists() {
                            let _ = std::fs::create_dir_all(&cache_dir);
                        }
                        let file_path = cache_dir.join(&hash);

                        // Serve from cache or download
                        let content = if file_path.exists() {
                            std::fs::read(&file_path)?
                        } else {
                            let client = build_http_client()?;
                            let response = client.get(&decoded_url).send()?;
                            if !response.status().is_success() {
                                return Ok(tauri::http::Response::builder()
                                    .status(404)
                                    .body(Vec::new())?);
                            }
                            let bytes = response.bytes()?.to_vec();
                            let _ = std::fs::write(&file_path, &bytes);
                            bytes
                        };

                        let total_size = content.len() as u64;

                        if let Some(range_str) = &range_header {
                            if let Some((start, end)) = parse_range_header(range_str, total_size) {
                                let chunk = content[start as usize..=end as usize].to_vec();
                                let content_range =
                                    format!("bytes {}-{}/{}", start, end, total_size);
                                return Ok(tauri::http::Response::builder()
                                    .status(206)
                                    .header("Content-Type", &mime_type)
                                    .header("Content-Length", chunk.len().to_string())
                                    .header("Content-Range", content_range)
                                    .header("Accept-Ranges", "bytes")
                                    .header("Access-Control-Allow-Origin", "*")
                                    .body(chunk)?);
                            }
                        }

                        Ok(tauri::http::Response::builder()
                            .header("Content-Type", &mime_type)
                            .header("Content-Length", total_size.to_string())
                            .header("Accept-Ranges", "bytes")
                            .header("Access-Control-Allow-Origin", "*")
                            .body(content)?)
                    })();

                let response = result.unwrap_or_else(|e| {
                    eprintln!("[rss-media] ERROR: {}", e);
                    tauri::http::Response::builder()
                        .status(500)
                        .body(Vec::new())
                        .expect("building HTTP 500 response should never fail")
                });
                responder.respond(response);
            });
        })
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;
            std::fs::create_dir_all(&data_dir)
                .map_err(|e| format!("Cannot create data dir: {e}"))?;

            let db_path = data_dir.join("rss.db");

            // One-time migration: copy from old dev location if new path doesn't exist yet
            if !db_path.exists() {
                if let Some(legacy) = get_legacy_db_path() {
                    if legacy.exists() {
                        eprintln!("Migrating database from {:?} to {:?}", legacy, db_path);
                        if let Err(e) = std::fs::copy(&legacy, &db_path) {
                            eprintln!("Warning: Migration copy failed: {e}");
                        }
                    }
                }
            }

            let conn = init_database_at_path(&db_path)
                .map_err(|e| format!("Failed to initialize database: {e}"))?;
            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cache_media,
            open_external_url,
            db::feeds::get_feeds,
            db::feeds::add_feed,
            db::feeds::edit_feed,
            db::feeds::delete_feed,
            db::get_articles,
            db::get_unread_articles,
            db::get_article,
            db::get_article_ai_summary,
            db::get_article_navigation,
            db::update_feed,
            db::update_all_feeds,
            db::mark_article_read,
            db::toggle_article_star,
            db::get_starred_articles,
            db::toggle_article_favorite,
            db::get_favorite_articles,
            db::update_article_summary,
            db::upsert_article_ai_summary,
            db::search_articles,
            db::fetch_and_add_feed,
            db::opml::import_opml,
            db::opml::export_opml,
            db::export_data,
            db::tags::add_tag,
            db::tags::remove_tag,
            db::tags::get_article_tags,
            db::tags::get_articles_by_tag,
            db::tags::get_all_tags,
            db::groups::create_group,
            db::groups::delete_group,
            db::groups::rename_group,
            db::groups::add_article_to_group,
            db::groups::remove_article_from_group,
            db::delete_article,
            db::groups::get_groups,
            db::groups::get_group_articles,
            db::cache::clean_media_cache,
            db::cache::clean_articles,
            db::cache::clean_all_articles,
            db::cache::get_storage_info,
            db::rules::get_rules,
            db::rules::create_rule,
            db::rules::update_rule,
            db::rules::delete_rule,
            db::rules::reorder_rules,
            db::rules::get_pending_ai_tasks,
            db::rules::update_ai_task_status,
            db::rules::execute_rule_actions,
            db::rules::save_article_score,
            db::rules::get_article_scores,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
