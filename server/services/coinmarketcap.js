const axios = require('axios');

const API_KEY = process.env.COINMARKETCAP_API_KEY;
const BASE_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Mapping of symbols to CoinMarketCap IDs to save credits/lookup time
// BTC = 1, ETH = 1027, LTC = 2, USDT = 825
const SYMBOL_MAP = {
    'BTC': '1',
    'ETH': '1027',
    'LTC': '2',
    'USDT': '825',
    'SOL': '5426'
};

async function getCryptoPrices(symbols = ['BTC']) {
    try {
        if (!API_KEY) {
            console.error('COINMARKETCAP_API_KEY is missing');
            return null;
        }

        // Convert symbols to IDs
        const ids = symbols.map(s => SYMBOL_MAP[s] || s).join(',');

        const response = await axios.get(BASE_URL, {
            headers: {
                'X-CMC_PRO_API_KEY': API_KEY,
            },
            params: {
                id: ids,
                convert: 'USD'
            }
        });

        const data = response.data.data;

        // Format the response to be cleaner for our app
        const formattedData = {};

        // Parse ID 1 (BTC)
        if (data['1']) {
            const btc = data['1'];
            formattedData.bitcoin = {
                price: btc.quote.USD.price,
                change_24h: btc.quote.USD.percent_change_24h,
                volume_24h: btc.quote.USD.volume_24h,
                market_cap: btc.quote.USD.market_cap,
                last_updated: btc.last_updated
            };
        }

        return formattedData;

    } catch (error) {
        console.error('Error fetching CoinMarketCap data:', error.response?.data || error.message);
        return null;
    }
}

module.exports = { getCryptoPrices };
