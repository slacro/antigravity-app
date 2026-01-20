const axios = require('axios');

/**
 * Fetches P2P rates from Bybit
 * @returns {Promise<{buy: number, sell: number, average: number}>}
 */
async function getBybitRate() {
    try {
        const buyPrice = await getBestPrice('1'); // Side 1 = Buy
        const sellPrice = await getBestPrice('0'); // Side 0 = Sell

        return {
            source: 'Bybit P2P',
            pair: 'USDT/VES',
            buy: buyPrice,
            sell: sellPrice,
            average: (buyPrice + sellPrice) / 2
        };
    } catch (error) {
        console.error('Bybit Rate Error:', error.message);
        return { source: 'Bybit P2P', pair: 'USDT/VES', buy: 0, sell: 0, average: 0 };
    }
}

async function getBestPrice(side) {
    const list = await fetchBybitAds(side, "2000"); // Probe 2000 VES (~3$)
    if (list.length === 0) return 0;
    return parseFloat(list[0].price);
}

/**
 * Fetches raw ads from Bybit
 */
async function fetchBybitAds(side, amount) {
    const url = 'https://api2.bybit.com/fiat/otc/item/online';
    const payload = {
        "userId": "",
        "tokenId": "USDT",
        "currencyId": "VES",
        "payment": [],
        "side": side,
        "size": "5",
        "page": "1",
        "amount": amount ? amount.toString() : ""
    };

    try {
        const res = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });
        return res.data?.result?.items || [];
    } catch (e) {
        console.error("Bybit Fetch Error:", e.message);
        return [];
    }
}

/**
 * Fetches top 3 Buy and Sell ads for dashboard display
 */
async function getBybitDashboard() {
    try {
        const rate = await getBybitRate();
        const probeAmount = 50 * (rate.buy || 600); // ~50 USD

        const [buyAds, sellAds] = await Promise.all([
            fetchBybitAds('1', probeAmount),
            fetchBybitAds('0', probeAmount)
        ]);

        const processAds = (list) => list.slice(0, 3).map(ad => ({
            name: ad.nickName,
            price: parseFloat(ad.price),
            id: ad.id
        }));

        return {
            buy: processAds(buyAds),
            sell: processAds(sellAds)
        };
    } catch (error) {
        console.error('Bybit Dashboard Error:', error.message);
        return { buy: [], sell: [] };
    }
}

/**
 * Fetches top 5 P2P ads for a specific amount (Generic for Calculator/Ranges)
 */
async function getBybitTopAds(amount) {
    try {
        const [buyAds, sellAds] = await Promise.all([
            fetchBybitAds('1', amount),
            fetchBybitAds('0', amount)
        ]);

        const process = (item) => ({
            advertiser: item.nickName,
            price: item.price,
            limitMin: item.minAmount,
            limitMax: item.maxAmount,
            available: item.quantity,
            orders: item.recentOrderNum,
            completionRate: item.recentExecuteRate // Bybit gives this as whole number usually, e.g. 95
        });

        return {
            buy: buyAds.map(process),
            sell: sellAds.map(process)
        };

    } catch (error) {
        return { buy: [], sell: [] };
    }
}

module.exports = { getBybitRate, getBybitDashboard, getBybitTopAds };
