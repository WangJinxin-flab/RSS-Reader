#[cfg(test)]
mod tests {
    use super::super::FeedFetcher;
    use wiremock::matchers::{method, path};
    use wiremock::{Mock, MockServer, ResponseTemplate};

    #[tokio::test]
    async fn test_fetch_feed_success() {
        let mock_server = MockServer::start().await;
        
        let rss_content = r#"
            <?xml version="1.0" encoding="UTF-8" ?>
            <rss version="2.0">
            <channel>
                <title>Test Feed</title>
                <link>http://example.com</link>
                <description>Test Description</description>
                <item>
                    <title>Test Article</title>
                    <link>http://example.com/article</link>
                    <description>Test Article Description</description>
                </item>
            </channel>
            </rss>
        "#;

        Mock::given(method("GET"))
            .and(path("/feed.xml"))
            .respond_with(ResponseTemplate::new(200).set_body_string(rss_content))
            .mount(&mock_server)
            .await;

        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        let url = format!("{}/feed.xml", mock_server.uri());
        let result = fetcher.fetch_feed(&url, None).await;

        assert!(result.is_ok());
        let (feed, articles) = result.unwrap();
        assert_eq!(feed.title, "Test Feed");
        assert_eq!(articles.len(), 1);
        assert_eq!(articles[0].title, "Test Article");
    }

    #[tokio::test]
    async fn test_fetch_feed_404() {
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/404.xml"))
            .respond_with(ResponseTemplate::new(404))
            .mount(&mock_server)
            .await;

        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        let url = format!("{}/404.xml", mock_server.uri());
        let result = fetcher.fetch_feed(&url, None).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("HTTP 404"));
    }

    #[tokio::test]
    async fn test_fetch_feed_500() {
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/500.xml"))
            .respond_with(ResponseTemplate::new(500))
            .mount(&mock_server)
            .await;

        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        let url = format!("{}/500.xml", mock_server.uri());
        let result = fetcher.fetch_feed(&url, None).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("HTTP 500"));
    }

    #[tokio::test]
    async fn test_fetch_feed_parse_error() {
        let mock_server = MockServer::start().await;

        Mock::given(method("GET"))
            .and(path("/invalid.xml"))
            .respond_with(ResponseTemplate::new(200).set_body_string("Invalid XML"))
            .mount(&mock_server)
            .await;

        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        let url = format!("{}/invalid.xml", mock_server.uri());
        let result = fetcher.fetch_feed(&url, None).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        assert!(err.contains("Failed to parse feed"));
    }

    #[tokio::test]
    async fn test_fetch_feed_connection_error() {
        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        // Use a port that is unlikely to be open
        let url = "http://127.0.0.1:12345/feed.xml";
        let result = fetcher.fetch_feed(url, None).await;

        assert!(result.is_err());
        let err = result.unwrap_err();
        // Verify it contains connection error details
        assert!(err.contains("Failed to fetch feed"));
    }

    #[tokio::test]
    async fn test_rsshub_domain_replacement() {
        let mock_server = MockServer::start().await;
        
        let rss_content = r#"
            <?xml version="1.0" encoding="UTF-8" ?>
            <rss version="2.0">
            <channel>
                <title>RSSHub Feed</title>
                <link>http://example.com</link>
                <description>RSSHub Description</description>
            </channel>
            </rss>
        "#;

        // Expect request to the mock server with the path extracted from rsshub:// URL
        Mock::given(method("GET"))
            .and(path("/bilibili/user/video/123"))
            .respond_with(ResponseTemplate::new(200).set_body_string(rss_content))
            .mount(&mock_server)
            .await;

        let fetcher = FeedFetcher::new().expect("Failed to build HTTP client in test");
        // Use rsshub:// protocol
        let url = "rsshub://bilibili/user/video/123";
        // Pass mock server URL as the custom domain
        let rsshub_domain = Some(mock_server.uri());
        
        let result = fetcher.fetch_feed(url, rsshub_domain).await;

        assert!(result.is_ok());
        let (feed, _) = result.unwrap();
        assert_eq!(feed.title, "RSSHub Feed");
    }
}
