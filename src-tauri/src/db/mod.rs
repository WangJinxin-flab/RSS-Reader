pub mod articles;
pub mod cache;
pub mod feeds;
pub mod groups;
pub mod opml;
pub mod rules;
pub mod rules_engine;
pub mod tags;

use crate::models::{Article, Feed, NewArticle};
use articles::{query_articles, row_to_article, ArticleFilter};
use rusqlite::{Connection, OptionalExtension, Result as SqliteResult, params};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

type DbState = Mutex<Connection>;

// Re-export all the command functions to maintain backward compatibility
pub use cache::{
    clean_all_articles, clean_articles, clean_media_cache, get_storage_info,
};
pub use feeds::{add_feed, delete_feed, edit_feed, get_feeds};
pub use groups::{
    add_article_to_group, create_group, delete_group, get_group_articles, get_groups,
    remove_article_from_group, rename_group,
};
pub use opml::{export_opml, import_opml};
pub use tags::{add_tag, get_all_tags, get_article_tags, get_articles_by_tag, remove_tag};

pub fn get_legacy_db_path() -> Option<PathBuf> {
    let mut path = std::env::current_dir().ok()?;
    path.push(".rss-reader-data");
    path.push("rss.db");
    Some(path)
}

pub fn init_database_at_path(db_path: &std::path::Path) -> SqliteResult<Connection> {
    let conn = Connection::open(db_path)?;

    // Enable foreign key constraints
    conn.execute("PRAGMA foreign_keys = ON", [])
        .map_err(|e| {
            eprintln!("Warning: Failed to enable foreign keys: {}", e);
            e
        })?;

    // Performance PRAGMAs (use execute_batch — journal_mode returns a result row)
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA cache_size = -32000;
         PRAGMA temp_store = MEMORY;
         PRAGMA mmap_size = 134217728;"
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            url TEXT NOT NULL UNIQUE,
            link TEXT,
            category TEXT,
            last_updated TEXT,
            etag TEXT,
            last_modified TEXT,
            error_message TEXT,
            icon TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    let _ = conn.execute("ALTER TABLE feeds ADD COLUMN icon TEXT", []);
    let _ = conn.execute("ALTER TABLE articles ADD COLUMN thumbnail TEXT", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feed_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            link TEXT NOT NULL,
            summary TEXT,
            content TEXT,
            author TEXT,
            published_at TEXT,
            updated_at TEXT,
            is_read INTEGER DEFAULT 0,
            is_starred INTEGER DEFAULT 0,
            is_favorite INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id)",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read)",
        [],
    )?;

    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_link ON articles(link)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS article_tags (
            article_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (article_id, tag_id),
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS article_groups (
            article_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (article_id, group_id),
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Enable FTS5
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
            title,
            content,
            summary,
            author,
            content='articles',
            content_rowid='id'
        )",
        [],
    )?;

    // Triggers to keep FTS index up to date
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
            INSERT INTO articles_fts(rowid, title, content, summary, author)
            VALUES (new.id, new.title, new.content, new.summary, new.author);
        END",
        [],
    )?;
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, content, summary, author)
            VALUES('delete', old.id, old.title, old.content, old.summary, old.author);
        END",
        [],
    )?;
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
            INSERT INTO articles_fts(articles_fts, rowid, title, content, summary, author)
            VALUES('delete', old.id, old.title, old.content, old.summary, old.author);
            INSERT INTO articles_fts(rowid, title, content, summary, author)
            VALUES (new.id, new.title, new.content, new.summary, new.author);
        END",
        [],
    )?;

    // Run integrity check
    let integrity: String = conn
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .unwrap_or_else(|_| "error".to_string());

    if integrity != "ok" {
        eprintln!("Warning: Database integrity check failed: {}", integrity);
    }


    // Clean up orphaned articles (articles without a valid feed)
    let orphaned_count = conn
        .execute(
            "DELETE FROM articles WHERE feed_id NOT IN (SELECT id FROM feeds)",
            [],
        )
        .unwrap_or(0);

    if orphaned_count > 0 {
        eprintln!("Cleaned up {} orphaned articles", orphaned_count);
    }

    conn.execute(
        "CREATE TABLE IF NOT EXISTS rules (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            conditions TEXT NOT NULL,
            actions TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS ai_tasks (
            id TEXT PRIMARY KEY,
            article_id INTEGER NOT NULL,
            rule_id TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            task_type TEXT DEFAULT 'condition',
            action_config TEXT,
            error_msg TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Migration: Add new columns to ai_tasks if they don't exist
    let _ = conn.execute(
        "ALTER TABLE ai_tasks ADD COLUMN task_type TEXT DEFAULT 'condition'",
        [],
    );
    let _ = conn.execute("ALTER TABLE ai_tasks ADD COLUMN action_config TEXT", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS article_scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            rule_id TEXT NOT NULL,
            score INTEGER NOT NULL,
            badge_name TEXT,
            badge_color TEXT,
            badge_icon TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
            UNIQUE(article_id, rule_id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS article_rule_executions (
            article_id INTEGER NOT NULL,
            rule_id TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (article_id, rule_id),
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
            FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS article_ai_summaries (
            article_id INTEGER PRIMARY KEY,
            summary TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // On startup, reset any tasks that were interrupted mid-processing
    let _ = conn.execute(
        "UPDATE ai_tasks SET status = 'pending', error_msg = NULL WHERE status = 'processing'",
        [],
    );

    Ok(conn)
}

#[tauri::command]
pub fn delete_article(conn: State<DbState>, id: i64) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "DELETE FROM articles WHERE id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_articles(
    conn: State<DbState>,
    feed_id: Option<i64>,
    limit: Option<u64>,
    cursor: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    query_articles(
        &conn,
        ArticleFilter::All,
        feed_id,
        sort_by.as_deref(),
        cursor.as_deref(),
        limit.unwrap_or(50),
    )
}

#[tauri::command]
pub fn get_unread_articles(
    conn: State<DbState>,
    limit: Option<u64>,
    cursor: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    query_articles(
        &conn,
        ArticleFilter::Unread,
        None,
        sort_by.as_deref(),
        cursor.as_deref(),
        limit.unwrap_or(50),
    )
}

#[tauri::command]
pub fn get_starred_articles(
    conn: State<DbState>,
    limit: Option<u64>,
    cursor: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    query_articles(
        &conn,
        ArticleFilter::Starred,
        None,
        sort_by.as_deref(),
        cursor.as_deref(),
        limit.unwrap_or(50),
    )
}

#[tauri::command]
pub fn get_favorite_articles(
    conn: State<DbState>,
    limit: Option<u64>,
    cursor: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    query_articles(
        &conn,
        ArticleFilter::Favorite,
        None,
        sort_by.as_deref(),
        cursor.as_deref(),
        limit.unwrap_or(50),
    )
}

#[tauri::command]
pub fn search_articles(conn: State<DbState>, query: String) -> Result<Vec<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    search_articles_inner(&conn, query).map_err(|e| e.to_string())
}

fn search_articles_inner(conn: &Connection, query: String) -> SqliteResult<Vec<Article>> {
    let mut stmt = conn.prepare(
         "SELECT a.id, a.feed_id, a.title, a.link, a.author, a.content, a.summary, a.published_at,
                 a.updated_at, a.is_read, a.is_starred, a.is_favorite, a.created_at, a.thumbnail
          FROM articles a
          JOIN articles_fts fts ON a.id = fts.rowid
          WHERE articles_fts MATCH ?1
          ORDER BY rank
          LIMIT 100"
     )?;

    let articles = stmt
        .query_map([&query], row_to_article)?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(articles)
}

#[tauri::command]
pub fn export_data(conn: State<DbState>, format: String) -> Result<String, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    export_data_impl(&conn, &format).map_err(|e| e.to_string())
}

fn export_data_impl(conn: &Connection, format: &str) -> Result<String, Box<dyn std::error::Error>> {
    if format == "json" {
        let mut stmt = conn.prepare(
            "SELECT id, feed_id, title, link, author, content, summary, published_at,
                    updated_at, is_read, is_starred, is_favorite, created_at, thumbnail
             FROM articles"
        )?;

        let articles = stmt
            .query_map([], row_to_article)?
            .collect::<Result<Vec<_>, rusqlite::Error>>()?;

        let json = serde_json::to_string_pretty(&articles)?;
        Ok(json)
    } else {
        Err(format!("Unsupported format: {}", format).into())
    }
}

#[tauri::command]
pub fn mark_article_read(conn: State<DbState>, id: i64, is_read: bool) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE articles SET is_read = ?1 WHERE id = ?2",
        rusqlite::params![is_read as i32, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn toggle_article_star(conn: State<DbState>, id: i64) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE articles SET is_starred = NOT is_starred WHERE id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn toggle_article_favorite(conn: State<DbState>, id: i64) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE articles SET is_favorite = NOT is_favorite WHERE id = ?1",
        [id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn update_article_summary(conn: State<DbState>, id: i64, summary: String) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE articles SET summary = ?1 WHERE id = ?2",
        params![summary, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

fn get_article_inner(conn: &Connection, id: i64) -> Result<Option<Article>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, feed_id, title, link, author, content, summary, published_at,
                    updated_at, is_read, is_starred, is_favorite, created_at, thumbnail
             FROM articles
             WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let article = stmt
        .query_row([id], row_to_article)
        .map(Some)
        .or_else(|e| {
            if e.to_string().contains("no row found") {
                Ok(None)
            } else {
                Err(e.to_string())
            }
        })?;

    let Some(article) = article else {
        return Ok(None);
    };

    let mut articles = vec![article];
    articles::attach_scores_to_articles(conn, &mut articles)?;

    Ok(articles.pop())
}

#[tauri::command]
pub fn get_article(conn: State<DbState>, id: i64) -> Result<Option<Article>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    get_article_inner(&conn, id)
}

fn get_article_ai_summary_inner(conn: &Connection, article_id: i64) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT summary FROM article_ai_summaries WHERE article_id = ?1",
        [article_id],
        |row| row.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_article_ai_summary(
    conn: State<DbState>,
    article_id: i64,
) -> Result<Option<String>, String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    get_article_ai_summary_inner(&conn, article_id)
}

fn upsert_article_ai_summary_inner(
    conn: &Connection,
    article_id: i64,
    summary: String,
) -> Result<(), String> {
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO article_ai_summaries (article_id, summary, created_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(article_id) DO UPDATE SET summary = excluded.summary, created_at = excluded.created_at",
        params![article_id, summary, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn upsert_article_ai_summary(
    conn: State<DbState>,
    article_id: i64,
    summary: String,
) -> Result<(), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;
    upsert_article_ai_summary_inner(&conn, article_id, summary)
}

#[tauri::command]
pub fn get_article_navigation(
    conn: State<DbState>,
    current_id: i64,
) -> Result<(Option<Article>, Option<Article>), String> {
    let conn = conn.lock().map_err(|e| e.to_string())?;

    // Get current article info
    let current_article = {
        let mut stmt = conn
            .prepare("SELECT feed_id, published_at FROM articles WHERE id = ?1")
            .map_err(|e| e.to_string())?;

        stmt.query_row([current_id], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, Option<String>>(1)?))
        })
        .map_err(|e| e.to_string())?
    };

    let (feed_id, published_at) = current_article;

    // If no published time, return empty navigation
    if published_at.is_none() {
        return Ok((None, None));
    }

    let published_at = published_at.unwrap();

    // Get previous article (same feed, published earlier than current article)
    let prev_article = {
        let mut stmt = conn
            .prepare(
                "SELECT id, feed_id, title, link, author, content, summary, published_at,
                        updated_at, is_read, is_starred, is_favorite, created_at, thumbnail
                 FROM articles
                 WHERE feed_id = ?1 AND published_at < ?2
                 ORDER BY published_at DESC
                 LIMIT 1"
            )
            .map_err(|e| e.to_string())?;

        stmt.query_row((feed_id, published_at.clone()), row_to_article)
            .map(Some)
            .or_else(|e| {
                if e.to_string().contains("no row found") {
                    Ok(None)
                } else {
                    Err(e.to_string())
                }
            })?
    };

    // Get next article (same feed, published later than current article)
    let next_article = {
        let mut stmt = conn
            .prepare(
                "SELECT id, feed_id, title, link, author, content, summary, published_at,
                        updated_at, is_read, is_starred, is_favorite, created_at, thumbnail
                 FROM articles
                 WHERE feed_id = ?1 AND published_at > ?2
                 ORDER BY published_at ASC
                 LIMIT 1"
            )
            .map_err(|e| e.to_string())?;

        stmt.query_row((feed_id, published_at.clone()), row_to_article)
            .map(Some)
            .or_else(|e| {
                if e.to_string().contains("no row found") {
                    Ok(None)
                } else {
                    Err(e.to_string())
                }
            })?
    };

    Ok((prev_article, next_article))
}

#[tauri::command]
pub async fn fetch_and_add_feed(
    conn: State<'_, DbState>,
    url: String,
    category: Option<String>,
    rsshub_domain: Option<String>,
) -> Result<(Feed, Vec<Article>), String> {
    let fetcher = crate::feed::FeedFetcher::new()?;
    let (new_feed, new_articles) = fetcher.fetch_feed(&url, rsshub_domain).await?;

    let conn = conn.lock().map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();

    // Use provided category or fallback to feed's category
    let final_category = category.or(new_feed.category);

    conn.execute(
        "INSERT INTO feeds (title, url, description, link, category, icon, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            &new_feed.title,
            &new_feed.url,
            &new_feed.description,
            &new_feed.link,
            &final_category,
            &new_feed.icon,
            &now,
            &now
        ],
    )
    .map_err(|e| e.to_string())?;

    let feed_id = conn.last_insert_rowid();

    let mut articles = Vec::new();

    for item in new_articles {
        let created_at = chrono::Utc::now().to_rfc3339();
        let (article, is_new, _is_updated) =
            upsert_article_from_feed_item(&conn, feed_id, &item, &created_at)?;

        let context = rules_engine::RuleTriggerContext {
            is_existing_article: !is_new,
            is_new_article: is_new,
            allow_include_fetched: false,
        };

        if let Err(e) = rules_engine::process_article_rules_with_context(&conn, &article, context) {
            eprintln!("Warning: Failed to process rules for article {}: {}", article.id, e);
        }

        if is_new {
            articles.push(article);
        }
    }

    let feed = Feed {
        id: feed_id,
        title: new_feed.title,
        description: new_feed.description,
        url: new_feed.url,
        link: new_feed.link,
        category: final_category,
        icon: new_feed.icon,
        last_updated: Some(now.clone()),
        etag: None,
        last_modified: None,
        error_message: None,
        created_at: now.clone(),
        updated_at: now,
        unread_count: Some(articles.len() as i64),
    };

    Ok((feed, articles))
}

#[tauri::command]
pub async fn update_feed(
    conn: State<'_, DbState>,
    feed_id: i64,
    rsshub_domain: Option<String>,
) -> Result<Vec<Article>, String> {
    let fetcher = crate::feed::FeedFetcher::new()?;

    let url: String = {
        let conn_clone = conn.lock().map_err(|e| e.to_string())?;
        conn_clone
            .query_row(
                "SELECT url FROM feeds WHERE id = ?1",
                [feed_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?
    };

    let (new_feed, new_articles) = fetcher.fetch_feed(&url, rsshub_domain).await?;

    let conn = conn.lock().map_err(|e| e.to_string())?;

    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        "UPDATE feeds SET title = ?1, description = ?2, link = ?3, category = ?4, icon = ?5, last_updated = ?6, updated_at = ?7, error_message = NULL WHERE id = ?8",
        params![
            new_feed.title,
            new_feed.description,
            new_feed.link,
            new_feed.category,
            new_feed.icon,
            now,
            now,
            feed_id
        ],
    )
    .map_err(|e| e.to_string())?;

    let mut articles = Vec::new();

    for item in new_articles {
        let created_at = chrono::Utc::now().to_rfc3339();
        match upsert_article_from_feed_item(&conn, feed_id, &item, &created_at) {
            Ok((article, is_new, _is_updated)) => {
                let context = rules_engine::RuleTriggerContext {
                    is_existing_article: !is_new,
                    is_new_article: is_new,
                    allow_include_fetched: false,
                };

                if let Err(e) =
                    rules_engine::process_article_rules_with_context(&conn, &article, context)
                {
                    eprintln!("Warning: Failed to process rules for article {}: {}", article.id, e);
                }

                if is_new {
                    articles.push(article);
                }
            }
            Err(e) => {
                eprintln!(
                    "Warning: Failed to upsert article {} in feed {}: {}",
                    item.link, feed_id, e
                );
            }
        }
    }

    Ok(articles)
}

#[tauri::command]
pub async fn update_all_feeds(
    conn: State<'_, DbState>,
    rsshub_domain: Option<String>,
) -> Result<Vec<Article>, String> {
    let feed_ids: Vec<i64> = {
        let conn_clone = conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn_clone
            .prepare("SELECT id FROM feeds")
            .map_err(|e| e.to_string())?;
        let ids = stmt
            .query_map([], |row| row.get(0))
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;
        ids
    };

    let mut all_new_articles = Vec::new();

    for feed_id in feed_ids {
        match update_feed(conn.clone(), feed_id, rsshub_domain.clone()).await {
            Ok(articles) => all_new_articles.extend(articles),
            Err(e) => {
                let conn_lock = conn.lock().map_err(|e| e.to_string())?;
                conn_lock
                    .execute(
                        "UPDATE feeds SET error_message = ?1 WHERE id = ?2",
                        params![e, feed_id],
                    )
                    .ok();
            }
        }
    }

    Ok(all_new_articles)
}

fn upsert_article_from_feed_item(
    conn: &Connection,
    feed_id: i64,
    item: &NewArticle,
    created_at: &str,
) -> Result<(Article, bool, bool), String> {
    let existing: Option<Article> = conn
        .query_row(
            "SELECT id, feed_id, title, link, summary, content, author, published_at,
                    updated_at, is_read, is_starred, is_favorite, created_at, thumbnail
             FROM articles WHERE link = ?1",
            params![&item.link],
            row_to_article,
        )
        .optional()
        .map_err(|e| e.to_string())?;

    if let Some(existing_article) = existing {
        let is_updated = existing_article.title != item.title
            || existing_article.summary != item.summary
            || existing_article.content != item.content
            || existing_article.author != item.author
            || existing_article.published_at != item.published_at
            || existing_article.updated_at != item.updated_at
            || existing_article.thumbnail != item.thumbnail;

        if is_updated {
            conn.execute(
                "UPDATE articles
                 SET title = ?1, summary = ?2, content = ?3, author = ?4,
                     published_at = ?5, updated_at = ?6, thumbnail = ?7
                 WHERE id = ?8",
                params![
                    &item.title,
                    &item.summary,
                    &item.content,
                    &item.author,
                    &item.published_at,
                    &item.updated_at,
                    &item.thumbnail,
                    existing_article.id
                ],
            )
            .map_err(|e| e.to_string())?;
        }

        let article = Article {
            id: existing_article.id,
            feed_id: existing_article.feed_id,
            title: item.title.clone(),
            link: item.link.clone(),
            summary: item.summary.clone(),
            content: item.content.clone(),
            author: item.author.clone(),
            published_at: item.published_at.clone(),
            updated_at: item.updated_at.clone(),
            is_read: existing_article.is_read,
            is_starred: existing_article.is_starred,
            is_favorite: existing_article.is_favorite,
            created_at: existing_article.created_at,
            thumbnail: item.thumbnail.clone(),
            scores: None,
        };

        return Ok((article, false, is_updated));
    }

    conn.execute(
        "INSERT INTO articles (feed_id, title, link, summary, content, author, published_at, updated_at, thumbnail, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            feed_id,
            &item.title,
            &item.link,
            &item.summary,
            &item.content,
            &item.author,
            &item.published_at,
            &item.updated_at,
            &item.thumbnail,
            created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    let article = Article {
        id: conn.last_insert_rowid(),
        feed_id,
        title: item.title.clone(),
        link: item.link.clone(),
        summary: item.summary.clone(),
        content: item.content.clone(),
        author: item.author.clone(),
        published_at: item.published_at.clone(),
        updated_at: item.updated_at.clone(),
        is_read: false,
        is_starred: false,
        is_favorite: false,
        created_at: created_at.to_string(),
        thumbnail: item.thumbnail.clone(),
        scores: None,
    };

    Ok((article, true, false))
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();

        // Enable foreign key constraints
        conn.execute("PRAGMA foreign_keys = ON", []).unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS feeds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT,
                url TEXT NOT NULL UNIQUE,
                link TEXT,
                category TEXT,
                last_updated TEXT,
                etag TEXT,
                last_modified TEXT,
                error_message TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feed_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                link TEXT NOT NULL,
                summary TEXT,
                content TEXT,
                author TEXT,
                published_at TEXT,
                updated_at TEXT,
                is_read INTEGER DEFAULT 0,
                is_starred INTEGER DEFAULT 0,
                is_favorite INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                thumbnail TEXT,
                FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
            )",
            [],
        )
        .unwrap();

        // Enable FTS5
        conn.execute(
            "CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
                title,
                content,
                summary,
                author,
                content='articles',
                content_rowid='id'
            )",
            [],
        )
        .unwrap();

        // Triggers to keep FTS index up to date
        conn.execute(
            "CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
                INSERT INTO articles_fts(rowid, title, content, summary, author)
                VALUES (new.id, new.title, new.content, new.summary, new.author);
            END",
            [],
        )
        .unwrap();

        conn
    }

    #[test]
    fn test_search_by_author() {
        let conn = setup_test_db();

        // Insert a feed
        conn.execute(
            "INSERT INTO feeds (title, url) VALUES ('Test Feed', 'http://test.com')",
            [],
        )
        .unwrap();
        let feed_id = conn.last_insert_rowid();

        // Insert an article with a specific author
        conn.execute(
            "INSERT INTO articles (feed_id, title, link, content, author)
             VALUES (?1, 'Rust News', 'http://rust.com', 'Some content', 'Linus Torvalds')",
            [feed_id],
        )
        .unwrap();

        // Search by author
        let results = search_articles_inner(&conn, "Linus".to_string()).unwrap();

        assert_eq!(results.len(), 1, "Should find article by author");
        assert_eq!(results[0].author.as_deref(), Some("Linus Torvalds"));
    }

    #[test]
    fn test_export_json() {
        let conn = setup_test_db();
        // Insert data
        conn.execute("INSERT INTO feeds (title, url) VALUES ('F1', 'U1')", [])
            .unwrap();
        let fid = conn.last_insert_rowid();
        conn.execute(
            "INSERT INTO articles (feed_id, title, link) VALUES (?1, 'A1', 'L1')",
            [fid],
        )
        .unwrap();

        // Export
        let json = export_data_impl(&conn, "json").unwrap();

        // Check content
        assert!(json.contains("A1"), "JSON should contain article title");
        assert!(json.contains("L1"), "JSON should contain article link");
    }

    #[test]
    fn get_article_attaches_scores() {
        let conn = setup_test_db();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                conditions TEXT NOT NULL,
                actions TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )
        .unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS article_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER NOT NULL,
                rule_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                badge_name TEXT,
                badge_color TEXT,
                badge_icon TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
                FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
                UNIQUE(article_id, rule_id)
            )",
            [],
        )
        .unwrap();

        conn.execute("INSERT INTO feeds (title, url) VALUES ('F1', 'U1')", [])
            .unwrap();
        let feed_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO articles (feed_id, title, link) VALUES (?1, 'A1', 'L1')",
            [feed_id],
        )
        .unwrap();
        let article_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO rules (id, name, conditions, actions) VALUES ('rule-1', 'Rule 1', '{}', '[]')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO rules (id, name, conditions, actions) VALUES ('rule-2', 'Rule 2', '{}', '[]')",
            [],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO article_scores (article_id, rule_id, score) VALUES (?1, 'rule-1', 90)",
            [article_id],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO article_scores (article_id, rule_id, score) VALUES (?1, 'rule-2', 80)",
            [article_id],
        )
        .unwrap();

        let article = get_article_inner(&conn, article_id).unwrap().unwrap();
        assert!(article.scores.is_some());
        assert_eq!(article.scores.unwrap().len(), 2);
    }

    #[test]
    fn upsert_and_get_article_ai_summary() {
        let conn = setup_test_db();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS article_ai_summaries (
                article_id INTEGER PRIMARY KEY,
                summary TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
            )",
            [],
        )
        .unwrap();

        conn.execute("INSERT INTO feeds (title, url) VALUES ('F1', 'U1')", [])
            .unwrap();
        let feed_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO articles (feed_id, title, link) VALUES (?1, 'A1', 'L1')",
            [feed_id],
        )
        .unwrap();
        let article_id = conn.last_insert_rowid();

        upsert_article_ai_summary_inner(&conn, article_id, "S1".to_string()).unwrap();
        assert_eq!(
            get_article_ai_summary_inner(&conn, article_id).unwrap(),
            Some("S1".to_string())
        );

        upsert_article_ai_summary_inner(&conn, article_id, "S2".to_string()).unwrap();
        assert_eq!(
            get_article_ai_summary_inner(&conn, article_id).unwrap(),
            Some("S2".to_string())
        );
    }
}
