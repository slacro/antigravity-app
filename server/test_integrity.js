const { getBTCStats, getBTCChart, getDashboardP2P } = require('./services/binance');
const { getBCVRate } = require('./services/bcv');

(async () => {
    try {
        console.log("--- TEST START ---");

        console.log("1. Testing BTC Stats...");
        const btcStats = await getBTCStats();
        console.log("BTC Price:", btcStats.lastPrice); // Expect string number

        console.log("2. Testing BTC Chart...");
        const btcChart = await getBTCChart('1h', 5);
        console.log("BTC Chart Data Length:", btcChart.length);
        console.log("First Point:", btcChart[0]);

        console.log("3. Testing Dashboard P2P...");
        const p2p = await getDashboardP2P();
        console.log("Buy Ads:", p2p.buy.length);
        console.log("Sell Ads:", p2p.sell.length);
        console.log("Sample Ad:", p2p.buy[0]);

        console.log("4. Testing BCV Rate...");
        const bcv = await getBCVRate();
        console.log("BCV Rate:", bcv.rate);

        console.log("--- TEST END ---");
    } catch (error) {
        console.error("TEST FAILED:", error);
    }
})();
