
const { getBCVRate } = require('./server/services/bcv');

(async () => {
    try {
        console.log('Testing BCV Scraper...');
        const data = await getBCVRate();
        console.log('Scraper Result:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
})();
