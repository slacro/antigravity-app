
const dotenv = require('dotenv');
const path = require('path');

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const { getBCVRate } = require('./services/bcv');

(async () => {
    try {
        console.log('Testing BCV Scraper & Save...');
        const data = await getBCVRate();
        console.log('Scraper Result:', JSON.stringify(data, null, 2));

        // Give it a moment for the async DB save to complete logging
        setTimeout(() => {
            console.log('Done waiting for DB save.');
            process.exit(0);
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
})();
