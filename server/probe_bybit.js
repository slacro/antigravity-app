const axios = require('axios');

async function probeBybit() {
    const url = 'https://api2.bybit.com/fiat/otc/item/online';

    // Test both sides
    // 1 = Buy (User Buy / Maker Sell), 0 = Sell (User Sell / Maker Buy)
    const sides = ["1", "0"];
    const amount = ""; // Try empty amount

    for (const side of sides) {
        const payload = {
            "userId": "",
            "tokenId": "USDT",
            "currencyId": "VES",
            "payment": [],
            "side": side,
            "size": "5",
            "page": "1",
            "amount": amount,
            "authMaker": false,
            "canTrade": false
        };

        try {
            console.log(`\n--- PROBING SIDE ${side} (Amount: '${amount}') ---`);
            const res = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            const items = res.data?.result?.items || [];
            console.log(`Found ${items.length} items.`);
            if (items.length > 0) {
                console.log("Top item price:", items[0].price);
                console.log("Top item User:", items[0].nickName);
            } else {
                console.log("Response:", JSON.stringify(res.data).substring(0, 200));
            }
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

probeBybit();
