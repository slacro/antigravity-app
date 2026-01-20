const { supabase } = require('../supabase');
const { getBinanceRate, getDashboardP2P } = require('./binance');

async function logP2PSnapshot() {
    console.log("Logging P2P Snapshot...");
    try {
        // 1. Get General Rate
        const rate = await getBinanceRate();

        // 2. Get detailed list (Top 3 Buy/Sell)
        const dashboardData = await getDashboardP2P(); // Returns { buy: [], sell: [] }

        const entries = [];

        // Add General Average
        // We log "average" as a specific type or just track the trades?
        // Let's track the actual ads for granular analysis.

        // Log Buy Ads
        dashboardData.buy.forEach(ad => {
            entries.push({
                platform: 'binance',
                type: 'buy',
                price: ad.price,
                advertiser: ad.name,
                currency: 'VES'
            });
        });

        // Log Sell Ads
        dashboardData.sell.forEach(ad => {
            entries.push({
                platform: 'binance',
                type: 'sell',
                price: ad.price,
                advertiser: ad.name,
                currency: 'VES'
            });
        });

        if (entries.length > 0) {
            const { error } = await supabase.from('p2p_history').insert(entries);
            if (error) console.error('P2P Logging Error:', error);
            else console.log(`Logged ${entries.length} P2P ads.`);
        }

    } catch (err) {
        console.error("Failed to log P2P snapshot:", err);
    }
}

module.exports = { logP2PSnapshot };
