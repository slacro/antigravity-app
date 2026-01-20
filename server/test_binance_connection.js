const { getBinanceRate, getTopP2PAds, getDashboardP2P } = require('./services/binance');

(async () => {
    try {
        console.log("Testing Binance Rate...");
        const rate = await getBinanceRate();
        console.log("Rate:", rate);

        console.log("Testing Dashboard P2P...");
        const dashboard = await getDashboardP2P();
        console.log("Dashboard Data:", JSON.stringify(dashboard, null, 2));

    } catch (error) {
        console.error("Test Failed:", error);
    }
})();
