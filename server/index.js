const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getBCVRate } = require('./services/bcv');
const { getBinanceRate, getTopP2PAds, getBTCStats, getBTCChart, getDashboardP2P } = require('./services/binance');
const { getBybitRate, getBybitDashboard, getBybitTopAds } = require('./services/bybit');
const { getMiningStats } = require('./services/mining');
const { supabase } = require('./supabase');
const bcvHistory = require('./data/bcv_history.json');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Endpoints
// API Endpoints
app.get('/api/bcv/history', async (req, res) => {
    try {
        // Try fetching from Supabase first
        const { data, error } = await supabase
            .from('bcv_quotes')
            .select('date, usd, eur, cny, rub, try_lira')
            .order('date', { ascending: true });

        if (!error && data && data.length > 0) {
            // Transform to format expected by Recharts
            const formatted = data.map(row => ({
                date: row.date,
                value: row.usd,
                eur: row.eur,
                cny: row.cny,
                rub: row.rub,
                try: row.try_lira
            }));
            return res.json(formatted);
        }

        // Fallback to local JSON if DB is empty or fails (temporary)
        console.warn("Supabase empty/error, using local fallback:", error?.message);
        const chronological = [...bcvHistory].reverse().map(item => ({
            date: item.date,
            value: item.rate
        }));
        res.json(chronological);

    } catch (err) {
        console.error("History API Error:", err);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});
// Routes
app.get('/api/rates', async (req, res) => {
    try {
        const [bcv, binance] = await Promise.allSettled([
            getBCVRate(), // Fetches USD and EUR from BCV official site
            getBinanceRate() // Buy price usually reflects the "market" better for users looking to sell USD, but users wanted "diferencial", usually between official and street (selling ves to buy usd)
        ]);

        // Unpack results
        const bcvData = bcv.status === 'fulfilled' ? bcv.value : { error: bcv.reason?.message };
        const binanceData = binance.status === 'fulfilled' ? binance.value : { error: binance.reason?.message };

        res.json({
            timestamp: new Date().toISOString(),
            bcv: bcvData,
            binance: binanceData
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rates' });
    }
});

// New Endpoint: P2P Calculator
app.get('/api/p2p/calculate', async (req, res) => {
    try {
        const amount = parseFloat(req.query.amount);
        const paymentMethod = req.query.paymentMethod; // Get payment method from query

        if (isNaN(amount)) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const ads = await getTopP2PAds(amount, paymentMethod);
        res.json(ads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch P2P ads' });
    }
});

app.get('/api/mining', async (req, res) => {
    try {
        const stats = await getMiningStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch mining stats' });
    }
});

// New Endpoint: P2P Ranges
app.get('/api/p2p/ranges', async (req, res) => {
    try {
        // 1. Get current exchange rate to convert USD ranges to VES
        // We use the Buy rate as a reference for "market price"
        const rates = await getBinanceRate();
        const exchangeRate = rates.buy || 40; // Fallback if fails

        // 2. Define probe amounts (midpoints) in USD
        // Range 1: 1 - 20 USD -> Probe: 10 USD
        // Range 2: 20 - 100 USD -> Probe: 60 USD
        // Range 3: 100 - 200 USD -> Probe: 150 USD
        const probes = [
            { id: 'low', label: '$1 - $20', amountUSD: 10 },
            { id: 'mid', label: '$20 - $100', amountUSD: 60 },
            { id: 'high', label: '$100 - $200', amountUSD: 150 }
        ];

        // 3. Fetch data for each range sequentially to avoid rate limiting
        const results = [];
        for (const probe of probes) {
            const amountVES = probe.amountUSD * exchangeRate;
            try {
                // Fetch Binance
                const binanceAds = await getTopP2PAds(amountVES);

                // Fetch Bybit
                const bybitAds = await getBybitTopAds(amountVES);

                results.push({
                    ...probe,
                    testAmountVES: amountVES,
                    binance: binanceAds,
                    bybit: bybitAds
                });
            } catch (err) {
                console.error(`Failed to fetch for probe ${probe.id}:`, err);
                results.push({
                    ...probe,
                    testAmountVES: amountVES,
                    binance: { buy: [], sell: [] },
                    bybit: { buy: [], sell: [] }
                });
            }
        }

        res.json({
            rateUsed: exchangeRate,
            ranges: results
        });

    } catch (error) {
        console.error('P2P Ranges Error:', error);
        res.status(500).json({ error: 'Failed to fetch P2P ranges' });
    }
});

// New Endpoint: Dashboard P2P Widget (Binance)
app.get('/api/p2p/dashboard', async (req, res) => {
    try {
        const data = await getDashboardP2P();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard P2P data' });
    }
});

// New Endpoint: Dashboard P2P Widget (Bybit)
app.get('/api/bybit/dashboard', async (req, res) => {
    try {
        const data = await getBybitDashboard();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Bybit dashboard data' });
    }
});

// New Endpoint: BTC Stats
// --- API Endpoints ---
const { getCryptoPrices } = require('./services/coinmarketcap');

app.get('/api/btc/stats', async (req, res) => {
    try {
        console.log("Fetching BTC stats from CoinMarketCap...");
        const data = await getCryptoPrices(['BTC']);

        if (data && data.bitcoin) {
            // Map CMC format to what the frontend expects
            const frontendFormat = {
                lastPrice: data.bitcoin.price.toString(),
                priceChangePercent: data.bitcoin.change_24h.toString(),
                highPrice: "0", // CMC simple quote doesn't give 24h high/low in free tier easily
                lowPrice: "0",
                quoteVolume: data.bitcoin.volume_24h.toString()
            };
            res.json(frontendFormat);
        } else {
            throw new Error("No data from CMC");
        }
    } catch (error) {
        console.error("Error in /api/btc/stats:", error);
        res.status(500).json({ error: "Failed to fetch BTC stats" });
    }
});

// New Endpoint: BTC Chart
const { getCoinGeckoChart } = require('./services/coingecko');

app.get('/api/btc/chart', async (req, res) => {
    try {
        const { timeframe } = req.query; // '5m', '1h', '1M', '1Y'

        // Map frontend timeframe to CoinGecko 'days' query
        let days = '1'; // Default 24h

        switch (timeframe) {
            case '5m':
            case '1h':
                days = '1'; // CoinGecko min is 1 day for public API granularity
                break;
            case '1M':
                days = '30';
                break;
            case '1Y':
                days = '365';
                break;
            default:
                days = '1';
        }

        const data = await getCoinGeckoChart('bitcoin', days);
        res.json(data);
    } catch (error) {
        console.error("Chart Error:", error);
        res.status(500).json({ error: 'Failed to fetch chart data' });
    }
});

// New Endpoint: Top Crypto Widget
const { getTopCoins } = require('./services/coingecko');

app.get('/api/crypto/top', async (req, res) => {
    try {
        const data = await getTopCoins(5);
        res.json(data);
    } catch (error) {
        console.error("Top Coins Error:", error);
        res.status(500).json({ error: 'Failed to fetch top coins' });
    }
});

// --- NEW: News & Analysis Endpoints ---

// 1. Get News Feed
app.get('/api/news', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('news_feed')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// 2. Get AI Reports
app.get('/api/analysis', async (req, res) => {
    try {
        const { type } = req.query; // optional filter
        let query = supabase.from('market_reports').select('*').order('created_at', { ascending: false }).limit(10);

        if (type) query = query.eq('report_type', type);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch analysis' });
    }
});

// 3. Get P2P History for Charting
app.get('/api/p2p/history', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('p2p_history')
            .select('*')
            .gte('created_at', since)
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch P2P history' });
    }
});

// --- SCHEDULER & STARTUP ---
const cron = require('node-cron');
const { scrapeNews } = require('./services/scraper');
const { logP2PSnapshot } = require('./services/p2p_logger');
const { generateDailyBrief, analyzeMarketTrends, chatWithAgent } = require('./services/ai_agent');

// AI Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;
        // Fetch current context
        const [bcvRate, binanceRate, bybitRate] = await Promise.all([
            getBCVRate(),
            getBinanceRate(),
            getBybitRate()
        ]);

        const diff = binanceRate.buy > 0 ? ((binanceRate.buy - bcvRate.rate) / bcvRate.rate) * 100 : 0;

        const context = {
            bcv: bcvRate.rate,
            binance: { buy: binanceRate.buy, sell: binanceRate.sell },
            bybit: { buy: bybitRate.buy, sell: bybitRate.sell },
            diff: diff.toFixed(2)
        };

        const reply = await chatWithAgent(message, context);
        res.json({ reply });
    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ error: "Chat processing failed" });
    }
});

// AI Arbitrage Endpoint
const { generateArbitrageAnalysis } = require('./services/ai_agent');

app.get('/api/p2p/arbitrage', async (req, res) => {
    try {
        // Collect P2P Data
        const [binance, bybit] = await Promise.all([
            getDashboardP2P(),
            getBybitDashboard()
        ]);

        // Calculate averages for the AI
        const getAvg = (list) => list.reduce((acc, item) => acc + item.price, 0) / (list.length || 1);

        const p2pData = {
            binance: {
                buyAvg: getAvg(binance.buy).toFixed(2),
                sellAvg: getAvg(binance.sell).toFixed(2)
            },
            bybit: {
                buyAvg: getAvg(bybit.buy).toFixed(2),
                sellAvg: getAvg(bybit.sell).toFixed(2)
            }
        };

        const analysis = await generateArbitrageAnalysis(p2pData);
        res.json({ analysis });

    } catch (err) {
        console.error("Arbitrage Error:", err);
        res.status(500).json({ error: "Arbitrage analysis failed" });
    }
});

// Manual Refresh Endpoint
app.post('/api/news/refresh', async (req, res) => {
    try {
        console.log("Manual Refresh Triggered");
        await scrapeNews();
        await generateDailyBrief();
        res.json({ success: true, message: 'Refresh started' });
    } catch (err) {
        console.error("Manual Refresh Error:", err.message);
        res.status(500).json({ error: err.message || 'Analysis failed' });
    }
});

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Run Scraper on Startup (for testing)
    console.log("Running initial News Scrape...");
    // Run Scraper on Startup (for testing)
    console.log("Running initial News Scrape...");
    // Execute asynchronously and catch errors to prevent server crash
    scrapeNews().catch(err => console.error("Startup Scrape Error:", err.message));
    generateDailyBrief().catch(err => console.error("Startup Brief Error:", err.message));
    analyzeMarketTrends().catch(err => console.error("Startup Trends Error:", err.message));

    // Schedule: Scrape News every hour
    cron.schedule('0 * * * *', () => {
        scrapeNews();
    });

    // Schedule: Log P2P Rate every hour
    cron.schedule('0 * * * *', () => {
        logP2PSnapshot();
    });

    // Schedule: Daily AI Brief at 8:00 AM
    cron.schedule('0 8 * * *', () => {
        generateDailyBrief();
    });

    // Schedule: Local Market Analysis at 9:00 AM
    cron.schedule('0 9 * * *', () => {
        analyzeMarketTrends();
    });
});
