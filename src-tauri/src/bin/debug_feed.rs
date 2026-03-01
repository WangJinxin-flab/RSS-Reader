use rss_reader::feed::FeedFetcher;
use std::env;

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Default URL if not provided
    let url = if args.len() > 1 {
        &args[1]
    } else {
        "rsshub://bilibili/user/video/946974"
    };

    // Default mirror if not provided
    let mirror = if args.len() > 2 {
        Some(args[2].clone())
    } else {
        Some("https://rsshub.rssforever.com".to_string())
    };

    println!("Testing Feed Fetcher...");
    println!("Target URL: {}", url);
    println!("RSSHub Mirror: {:?}", mirror);
    println!("----------------------------------------");

    let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in debug_feed");
    
    match fetcher.fetch_feed(url, mirror).await {
        Ok((feed, articles)) => {
            println!("✅ SUCCESS!");
            println!("Feed Title: {}", feed.title);
            println!("Feed Description: {:?}", feed.description);
            println!("Found {} articles.", articles.len());
            if let Some(first) = articles.first() {
                println!("First Article: {}", first.title);
            }
        }
        Err(e) => {
            println!("❌ FAILED!");
            println!("Error: {}", e);
        }
    }
    println!("----------------------------------------");
}
