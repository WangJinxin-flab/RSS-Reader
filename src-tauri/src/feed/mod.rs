use feed_rs::parser;
use regex::Regex;
use reqwest::Client;
use std::time::Duration;

use crate::models::{NewArticle, NewFeed};

pub struct FeedFetcher {
    client: Client,
}

/// Decode common HTML entities in URLs extracted from HTML attributes
fn decode_html_entities(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
}

/// Normalize non-standard date formats in RSS XML so that feed-rs can parse them.
/// Some feeds (e.g. chinanews.com) use formats like "2026-02-22 12:49:00" instead
/// of RFC 822/2822. We convert these to RFC 3339 (ISO 8601) before parsing.
fn normalize_rss_dates(content: &str) -> String {
    // Match <pubDate>YYYY-MM-DD HH:MM:SS</pubDate> (space separator, no timezone)
    let re = Regex::new(r"<pubDate>(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})</pubDate>")
        .unwrap();
    let result = re.replace_all(content, "<pubDate>${1}T${2}Z</pubDate>");

    // Match <pubDate>YYYY/MM/DD HH:MM:SS</pubDate> (slash separator)
    let re2 = Regex::new(r"<pubDate>(\d{4})/(\d{2})/(\d{2})\s+(\d{2}:\d{2}:\d{2})</pubDate>")
        .unwrap();
    re2.replace_all(&result, "<pubDate>${1}-${2}-${3}T${4}Z</pubDate>").into_owned()
}

fn extract_thumbnail(entry: &feed_rs::model::Entry) -> Option<String> {
    // 1. From media thumbnails
    for media in &entry.media {
        if let Some(thumb) = media.thumbnails.first() {
            let uri = &thumb.image.uri;
            if !uri.is_empty() {
                return Some(uri.clone());
            }
        }
    }
    // 2. From media content (image type)
    for media in &entry.media {
        for content in &media.content {
            if let Some(ref ct) = content.content_type {
                if ct.to_string().starts_with("image/") {
                    if let Some(ref url) = content.url {
                        return Some(url.to_string());
                    }
                }
            }
        }
    }
    // 3. From content/summary HTML: try data-src first (lazy-loaded), then src
    let data_src_re = Regex::new(r#"<img[^>]+data-src\s*=\s*["']([^"']+)["']"#).ok()?;
    let src_re = Regex::new(r#"<img[^>]+src\s*=\s*["']([^"']+)["']"#).ok()?;

    let bodies: Vec<&str> = [
        entry.content.as_ref().and_then(|c| c.body.as_deref()),
        entry.summary.as_ref().map(|s| s.content.as_str()),
    ]
    .into_iter()
    .flatten()
    .collect();

    for body in &bodies {
        if let Some(caps) = data_src_re.captures(body) {
            let url = decode_html_entities(&caps.get(1).map(|m| m.as_str()).unwrap_or_default());
            if url.starts_with("http") {
                return Some(url);
            } else if url.starts_with("//") {
                return Some(format!("https:{}", url));
            }
        }
    }
    for body in &bodies {
        if let Some(caps) = src_re.captures(body) {
            let url = decode_html_entities(&caps.get(1).map(|m| m.as_str()).unwrap_or_default());
            if url.starts_with("http") {
                return Some(url);
            } else if url.starts_with("//") {
                return Some(format!("https:{}", url));
            }
        }
    }
    None
}

impl FeedFetcher {
    pub fn new() -> Result<Self, String> {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .user_agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
            .map_err(|e| format!("Failed to build HTTP client: {}", e))?;
        Ok(Self { client })
    }
    
    pub async fn fetch_feed(&self, url: &str, rsshub_domain: Option<String>) -> Result<(NewFeed, Vec<NewArticle>), String> {
        let fetch_url = if url.starts_with("rsshub://") {
            let domain = rsshub_domain.unwrap_or_else(|| "https://rsshub.app".to_string());
            // Ensure domain ends with / if needed, but rsshub:// usually maps to path
            // If domain is "https://rsshub.app" and url is "rsshub://bilibili...", replace "rsshub://" with "https://rsshub.app/"
            // If domain has trailing slash "https://rsshub.app/", replace "rsshub://" with it.
            // Let's handle it safely.
            let path = url.trim_start_matches("rsshub://");
            let base = domain.trim_end_matches('/');
            format!("{}/{}", base, path)
        } else {
            url.to_string()
        };

        let response = self
            .client
            .get(&fetch_url)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch feed from {}: {}", fetch_url, e))?;
        
        let status = response.status();
        if !status.is_success() {
            return Err(format!("Failed to fetch feed: HTTP {} from {}", status, fetch_url));
        }

        let content = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response: {}", e))?;
        


        let content = normalize_rss_dates(&content);

        let feed = parser::parse(content.as_bytes())
            .map_err(|e| format!("Failed to parse feed from {}: {}", fetch_url, e))?;
        
        let icon = feed.icon.as_ref().map(|i| i.uri.clone())
            .or_else(|| feed.logo.as_ref().map(|l| l.uri.clone()));

        let new_feed = NewFeed {
            title: feed.title.map(|t| t.content).unwrap_or_else(|| "Untitled".to_string()),
            url: url.to_string(),
            description: feed.description.map(|d| d.content),
            link: feed.links.first().map(|l| l.href.clone()),
            category: feed.categories.first().map(|c| c.term.clone()),
            icon,
        };
        
        let articles: Vec<NewArticle> = feed
            .entries
            .iter()
            .filter_map(|entry| {
                let link = entry.links.first()?;
                
                let thumbnail = extract_thumbnail(entry);
                
                Some(NewArticle {
                    feed_id: 0,
                    title: entry.title.as_ref()?.content.clone(),
                    link: link.href.clone(),
                    author: entry.authors.first().map(|a| a.name.clone()),
                    content: entry.content.as_ref().map(|c| c.body.clone()).flatten(),
                    summary: entry.summary.as_ref().map(|s| s.content.clone()),
                    published_at: entry.published.or(entry.updated).map(|p| p.to_rfc3339()),
                    updated_at: entry.updated.map(|u| u.to_rfc3339()),
                    thumbnail,
                })
            })
            .collect();
        
        Ok((new_feed, articles))
    }
}

mod tests;

impl Default for FeedFetcher {
    fn default() -> Self {
        Self::new().expect("Failed to build HTTP client in default")
    }
}
