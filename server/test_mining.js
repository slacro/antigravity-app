const axios = require('axios');

async function testMining() {
    const urlParams = 'M9xuwFxCIkdeU8OvBEZ6KJrd6VZYavZAQELpF20lDmE05517';
    // Try the "home" endpoint which usually contains the dashboard stats for observers
    const url = `https://pool.binance.com/mining-api/v1/public/mining/observer/home?urlParams=${urlParams}`;

    try {
        console.log(`Fetching ${url}...`);
        const response = await axios.get(url, {
            headers: {
                // Mimic browser headers to avoid basic blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log('Response Status:', response.status);
        console.log('Data Preview:', JSON.stringify(response.data).substring(0, 500));
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testMining();
