const axios = require('axios');

/**
 * Fetches P2P rates from Binance
 * @returns {Promise<{buy: number, sell: number, average: number}>}
 */
async function getBinanceRate() {
    try {
        // Binance P2P API endpoint (publicly accessible usually)
        const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

        const getRate = async (tradeType) => {
            const response = await axios.post(url, {
                "fiat": "VES",
                "page": 1,
                "rows": 5, // Top 5
                "tradeType": tradeType, // "BUY" or "SELL" (from user perspective)
                "asset": "USDT",
                "countries": [],
                "proMerchantAds": false,
                "shieldMerchantAds": false,
                "publisherType": null,
                "payTypes": [],
                "classifies": ["mass", "profession"]
            });

            const ads = response.data?.data || [];
            if (ads.length === 0) return 0;

            // Calculate average of top 5
            const total = ads.reduce((acc, ad) => acc + parseFloat(ad.adv.price), 0);
            return total / ads.length;
        };

        // User wants "Mercado P2P ... buy".
        // "Buy" on P2P means I (the user) want to Buy USDT with VES. This is the "Ask" price on traditional markets.
        // "Sell" means I want to Sell USDT for VES. This is the "Bid" price.
        // Usually "Buy" (buying USDT) is the higher price (street rate for dollar).

        const buyPrice = await getRate('BUY');
        const sellPrice = await getRate('SELL');

        return {
            source: 'Binance P2P',
            pair: 'USDT/VES',
            buy: buyPrice,
            sell: sellPrice,
            average: (buyPrice + sellPrice) / 2
        };

    } catch (error) {
        console.error('Binance API Error:', error.message);
        throw error;
    }
}

/**
 * Fetches top 5 P2P ads for a specific amount
 * @param {number} amount - Amount in VES to filter by
 * @param {string} paymentMethod - Optional payment method identifier (e.g., 'Banesco')
 * @returns {Promise<{buy: Array, sell: Array}>}
 */
async function getTopP2PAds(amount, paymentMethod = null) {
    const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

    const fetchAds = async (tradeType) => {
        try {
            const payload = {
                "fiat": "VES",
                "page": 1,
                "rows": 5,
                "tradeType": tradeType,
                "asset": "USDT",
                "countries": [],
                "proMerchantAds": false,
                "shieldMerchantAds": false,
                "publisherType": null,
                "payTypes": paymentMethod && paymentMethod !== 'all' ? [paymentMethod] : [],
                "classifies": ["mass", "profession"],
                "transAmount": amount // Filter by specific amount
            };

            const response = await axios.post(url, payload);
            return (response.data?.data || []).map(item => ({
                advertiser: item.advertiser.nickName,
                price: item.adv.price,
                limitMin: item.adv.minSingleTransAmount,
                limitMax: item.adv.maxSingleTransAmount,
                available: item.adv.surplusAmount,
                orders: item.advertiser.monthOrderCount,
                completionRate: item.advertiser.monthFinishRate,
                // Extract payment methods
                methods: item.adv.tradeMethods ? item.adv.tradeMethods.map(m => m.tradeMethodName) : []
            }));
        } catch (e) {
            console.error(`Error fetching ${tradeType} ads:`, e.message);
            return [];
        }
    };

    const [buyAds, sellAds] = await Promise.all([
        fetchAds('BUY'), // User buying USDT (Market Sell from user perspective? No, P2P BUY means converting FIAT to CRYPTO)
        fetchAds('SELL') // User selling USDT
    ]);

    return {
        buy: buyAds,
        sell: sellAds
    };
}

/**
 * Fetches BTC/USDT 24h ticker stats
 */
async function getBTCStats() {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        return response.data;
    } catch (error) {
        console.error('Binance BTC Stats Error:', error.message);
        throw error;
    }
}

/**
 * Fetches BTC/USDT Chart Data (Klines)
 * @param {string} interval - 1m, 5m, 1h, 1d, etc.
 * @param {number} limit - Number of points
 */
async function getBTCChart(interval, limit) {
    try {
        const response = await axios.get('https://api.binance.com/api/v3/klines', {
            params: {
                symbol: 'BTCUSDT',
                interval: interval,
                limit: limit
            }
        });
        // Binance returns [openTime, open, high, low, close, volume, ...]
        // We only map what we need for the chart
        return response.data.map(k => ({
            time: k[0],
            value: parseFloat(k[4]) // Close price
        }));
    } catch (error) {
        console.error('Binance Chart Error:', error.message);
        return [];
    }
}

/**
 * Fetches top 3 Buy and Sell ads for dashboard display
 */
async function getDashboardP2P() {
    try {
        // We probe with a standard amount, e.g., 50 USD worth of VES
        // to get realistic "market price" ads
        const rate = await getBinanceRate();
        const probeAmount = 50 * (rate.buy || 600);

        const ads = await getTopP2PAds(probeAmount);

        // Map to simplified format for dashboard
        const processAds = (adList) => adList.slice(0, 3).map(ad => ({
            name: ad.advertiser,
            price: parseFloat(ad.price)
        }));

        return {
            buy: processAds(ads.buy),
            sell: processAds(ads.sell)
        };
    } catch (error) {
        console.error('Binance Dashboard P2P Error:', error.message);
        return { buy: [], sell: [] };
    }
}

module.exports = { getBinanceRate, getTopP2PAds, getBTCStats, getBTCChart, getDashboardP2P };
