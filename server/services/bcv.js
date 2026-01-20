const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Create an https agent that ignores SSL errors (BCV sometimes has cert issues or requires specific ciphers)
const agent = new https.Agent({
    rejectUnauthorized: false
});

const { supabase } = require('../supabase');

/**
 * Scrapes the official USD rate from BCV website
 * @returns {Promise<{rate: number, lastUpdate: string}>}
 */
async function getBCVRate() {
    try {
        const response = await axios.get('https://www.bcv.org.ve', {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);

        // Target specific ID for USD and EUR
        const dollarElement = $('#dolar strong');
        const euroElement = $('#euro strong');

        const rateText = dollarElement.length ? dollarElement.text().trim() : '';
        const eurRateText = euroElement.length ? euroElement.text().trim() : '';

        // Clean up text (replace comma with dot)
        const rate = parseFloat(rateText.replace(',', '.'));
        const eurRate = parseFloat(eurRateText.replace(',', '.'));

        if (isNaN(rate)) {
            throw new Error('Failed to parse BCV rate');
        }

        // --- Extract Date "Fecha Valor" ---
        // Expected format: "Fecha Valor: Martes, 20 Enero 2026" inside some div
        // usually passed in specific areas, but let's try a broader search or specific selector if known
        // The date is often in .pull-right.dinpro.center or similar.
        // Let's look for the text "Fecha Valor"

        let dateStr = new Date().toISOString().split('T')[0]; // Default to today

        try {
            const dateSection = $('span.date-display-single').first();
            // Alternatively, search for text
            const fullText = $('body').text();
            const fechaValorMatch = fullText.match(/Fecha Valor:\s*.*?,?\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i);

            if (fechaValorMatch) {
                const day = fechaValorMatch[1];
                const monthStr = fechaValorMatch[2].toLowerCase();
                const year = fechaValorMatch[3];

                const months = {
                    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
                    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
                    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
                };

                const month = months[monthStr];
                if (month) {
                    dateStr = `${year}-${month}-${day.padStart(2, '0')}`;
                }
            }
        } catch (e) {
            console.warn("Could not parse BCV Date, using system date", e);
        }

        // --- Save to Supabase (History) ---
        if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            const payload = {
                date: dateStr,
                usd: rate,
                eur: isNaN(eurRate) ? 0 : eurRate,
                // We keep existing values for others if we are upserting? 
                // Supabase upsert overwrites the row by default unless we merge. 
                // However, simplistic upsert is safer here to ensure we have the latest OFFICIAL rate.
            };

            // Non-blocking save
            supabase.from('bcv_quotes')
                .upsert(payload, { onConflict: 'date' })
                .then(({ error }) => {
                    if (error) console.error('Supabase Save Error:', error.message);
                    else console.log(`Saved BCV Rate for ${dateStr}: ${rate}`);
                });
        }

        return {
            source: 'BCV',
            symbol: 'USD',
            rate: rate,
            eurRate: isNaN(eurRate) ? 0 : eurRate,
            lastUpdate: new Date().toISOString(),
            validDate: dateStr
        };
    } catch (error) {
        console.error('BCV Scrape Error:', error.message);
        throw error;
    }
}

module.exports = { getBCVRate };
