const axios = require('axios');

async function probeBinance(payType) {
    const url = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';
    const payload = {
        "fiat": "VES",
        "page": 1,
        "rows": 1,
        "tradeType": "BUY",
        "asset": "USDT",
        "countries": [],
        "proMerchantAds": false,
        "shieldMerchantAds": false,
        "publisherType": null,
        "payTypes": [payType],
        "classifies": ["mass", "profession"],
        "transAmount": 500
    };

    try {
        const response = await axios.post(url, payload);
        const count = response.data?.data?.length || 0;
        console.log(`Payload '${payType}': ${count} results found.`);
    } catch (e) {
        console.log(`Payload '${payType}': Error - ${e.message}`);
        if (e.response) console.log(e.response.status);
    }
}

(async () => {
    console.log("Probing Binance Payment Methods...");
    await probeBinance("PagoMoval");  // Current (Typo?)
    await probeBinance("PagoMovil");  // Likely Correct
    await probeBinance("Banking");
    await probeBinance("Transfer");
})();
