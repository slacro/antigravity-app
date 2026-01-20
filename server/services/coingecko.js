const axios = require('axios');

const BASE_URL = 'https://api.coingecko.com/api/v3';

async function getCoinGeckoChart(coinId = 'bitcoin', days = '1') {
    try {
        console.log(`Fetching chart data from CoinGecko for ${coinId} (${days} days)`);

        const response = await axios.get(`${BASE_URL}/coins/${coinId}/market_chart`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            params: {
                vs_currency: 'usd',
                days: days
            }
        });

        const prices = response.data.prices; // Array of [timestamp, price]

        // Transform to format expected by Recharts: { time: 'HH:MM', value: 12345 }
        const chartData = prices.map(([timestamp, price]) => {
            const date = new Date(timestamp);
            let timeLabel = '';

            if (days === '1' || days === '1d') {
                timeLabel = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                timeLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            return {
                time: timeLabel,
                value: price
            };
        });

        // Reduce resolution if too many points (Recharts performance)
        if (chartData.length > 100) {
            const step = Math.ceil(chartData.length / 100);
            return chartData.filter((_, index) => index % step === 0);
        }

        return chartData;

    } catch (error) {
        console.error('Error fetching CoinGecko chart:', error.message);
        // Return empty array instead of crashing so the UI just shows no chart but keeps price
        return [];
    }
}

async function getTopCoins(limit = 5) {
    const CACHE_KEY = `top_${limit}`;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Check Cache
    if (global.coinCache && global.coinCache[CACHE_KEY]) {
        const { data, timestamp } = global.coinCache[CACHE_KEY];
        if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`Serving top ${limit} coins from cache`);
            return data;
        }
    }

    try {
        console.log(`Fetching top ${limit} coins from CoinGecko...`);
        const response = await axios.get(`${BASE_URL}/coins/markets`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: limit,
                page: 1,
                sparkline: true,
                price_change_percentage: '24h,7d'
            }
        });

        const data = response.data.map(coin => ({
            id: coin.id,
            rank: coin.market_cap_rank,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            image: coin.image,
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            volume_24h: coin.total_volume,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            price_change_percentage_7d_in_currency: coin.price_change_percentage_7d_in_currency,
            sparkline: coin.sparkline_in_7d ? coin.sparkline_in_7d.price.map((p, i) => ({ i, value: p })) : []
        }));

        // Update Cache
        if (!global.coinCache) global.coinCache = {};
        global.coinCache[CACHE_KEY] = {
            data: data,
            timestamp: Date.now()
        };

        return data;

    } catch (error) {
        console.error('Error fetching Top Coins:', error.message);

        // Return Stale Cache if available
        if (global.coinCache && global.coinCache[CACHE_KEY]) {
            console.warn("Serving stale cache due to error.");
            return global.coinCache[CACHE_KEY].data;
        }

        // Return Mock/Fallback if absolutely nothing works (to avoid empty UI)
        return [
            { id: 'bitcoin', rank: 1, name: 'Bitcoin', symbol: 'BTC', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 93200, price_change_percentage_24h: 1.2, price_change_percentage_7d_in_currency: 4.5, sparkline: [] },
            { id: 'ethereum', rank: 2, name: 'Ethereum', symbol: 'ETH', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3200, price_change_percentage_24h: -0.5, price_change_percentage_7d_in_currency: 2.1, sparkline: [] },
            { id: 'tether', rank: 3, name: 'Tether', symbol: 'USDT', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 1.00, price_change_percentage_24h: 0.01, price_change_percentage_7d_in_currency: 0.05, sparkline: [] },
            { id: 'binancecoin', rank: 4, name: 'BNB', symbol: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 590, price_change_percentage_24h: 0.8, price_change_percentage_7d_in_currency: -1.2, sparkline: [] },
            { id: 'solana', rank: 5, name: 'Solana', symbol: 'SOL', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 145, price_change_percentage_24h: 2.5, price_change_percentage_7d_in_currency: 10.5, sparkline: [] }
        ];
    }
}

module.exports = { getCoinGeckoChart, getTopCoins };
