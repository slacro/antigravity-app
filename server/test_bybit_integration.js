const { getBybitDashboard, getBybitTopAds } = require('./services/bybit');

(async () => {
    try {
        console.log("--- TEST DASHBOARD ---");
        const dash = await getBybitDashboard();
        console.log("Buy:", dash.buy.length, "Sell:", dash.sell.length);
        console.log("Sample Buy:", dash.buy[0]);

        console.log("\n--- TEST RANGES ---");
        const ranges = await getBybitTopAds(1000); // 1000 VES
        console.log("Buy Ads for 1000 VES:", ranges.buy.length);
        console.log("Sample Range Ad:", ranges.buy[0]);

    } catch (e) {
        console.error("Test Failed:", e);
    }
})();
