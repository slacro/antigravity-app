const Parser = require('rss-parser');
const { supabase } = require('../supabase');

const parser = new Parser();

// Safe list of high-quality crypto news RSS feeds
const RSS_FEEDS = [
    'https://cointelegraph.com/rss',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://decrypt.co/feed',
    'https://cryptopotato.com/feed/',
    'https://bitcoinmagazine.com/.rss/full/',
    'https://www.bancaynegocios.com/feed/',
    'https://finanzasdigital.com/feed/',
    // Add more as needed
];

async function scrapeNews() {
    console.log("Starting News Scraper...");
    let articles = [];

    for (const feedUrl of RSS_FEEDS) {
        try {
            const feed = await parser.parseURL(feedUrl);
            console.log(`Fetched ${feed.items.length} items from ${feed.title || feedUrl}`);

            // Filter for last 24h & Bitcoin relevance
            const now = new Date();
            const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

            const relevantItems = feed.items.filter(item => {
                const pubDate = new Date(item.pubDate);
                const content = (item.title + " " + item.contentSnippet).toLowerCase();
                // Filter: Must be recent AND related to crypto/finance/local economy
                return pubDate > yesterday && (
                    content.includes('bitcoin') ||
                    content.includes('btc') ||
                    content.includes('crypto') ||
                    content.includes('market') ||
                    content.includes('price') ||
                    content.includes('venezuela') ||
                    content.includes('bcv') ||
                    content.includes('dolar') ||
                    content.includes('petroleo') ||
                    content.includes('sanciones')
                );
            });

            articles = [...articles, ...relevantItems.map(item => ({
                title: item.title,
                url: item.link,
                source: feed.title || 'Crypto News',
                published_at: new Date(item.pubDate).toISOString(),
                summary: item.contentSnippet ? item.contentSnippet.substring(0, 300) + '...' : ''
            }))];

        } catch (err) {
            console.error(`Error fetching feed ${feedUrl}:`, err.message);
        }
    }

    console.log(`Total relevant articles found: ${articles.length}`);

    // Batch insert into Supabase (Upsert to avoid duplicates by URL)
    // Supabase JS doesn't support 'ignoreDuplicates' easily in batch without upsert
    // We assume 'url' is unique in schema
    if (articles.length > 0) {
        const { error } = await supabase
            .from('news_feed')
            .upsert(articles, { onConflict: 'url', ignoreDuplicates: true });

        if (error) console.error('Supabase Insert Error:', error);
        else console.log(`Successfully synced ${articles.length} articles to DB.`);
    }
}

module.exports = { scrapeNews };
