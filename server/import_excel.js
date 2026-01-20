
const XLSX = require('xlsx');
const { supabase } = require('./supabase');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// We will look for ALL .xls and .xlsx files in the server directory
const BATCH_SIZE = 50;

async function importAllExcels() {
    const directoryPath = __dirname;
    const files = fs.readdirSync(directoryPath);

    // Filter for Excel files
    const excelFiles = files.filter(file =>
        (file.endsWith('.xls') || file.endsWith('.xlsx')) &&
        file !== 'node_modules' &&
        !file.startsWith('~$') // Ignore temp lock files
    );

    if (excelFiles.length === 0) {
        console.log("❌ No Excel files found in the server directory.");
        return;
    }

    console.log(`Found ${excelFiles.length} Excel files to process.`);

    for (const filename of excelFiles) {
        console.log(`\n-----------------------------------`);
        console.log(`📂 Processing file: ${filename}...`);

        try {
            await processSingleFile(path.join(directoryPath, filename));
        } catch (err) {
            console.error(`❌ Error processing ${filename}:`, err.message);
        }
    }
}

async function processSingleFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log(`   > Found ${sheetNames.length} sheets.`);

    const recordsToInsert = [];

    for (const sheetName of sheetNames) {
        const sheet = workbook.Sheets[sheetName];

        // 1. Extract Date
        let dateStr = null;

        // Simple scan for "Fecha Valor"
        for (let r = 0; r < 20; r++) { // Increased range scan
            for (let c = 0; c < 10; c++) {
                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes('Fecha Valor:')) {
                    const parts = cell.v.split(':');
                    if (parts.length > 1) {
                        dateStr = parts[1].trim();
                    }
                }
            }
        }

        if (!dateStr) {
            // Only warn on verbose
            // console.warn(`   ⚠️ Skipped sheet '${sheetName}': Could not find 'Fecha Valor'`);
            continue;
        }

        // Convert DD/MM/YYYY to YYYY-MM-DD
        const dateParts = dateStr.split('/');
        if (dateParts.length !== 3) continue;

        const [day, month, year] = dateParts;
        const isoDate = `${year}-${month}-${day}`;

        // 2. Extract Currencies
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const rates = { date: isoDate };

        const currencyMap = {
            'USD': 'usd', 'EUR': 'eur', 'CNY': 'cny', 'TRY': 'try_lira', 'RUB': 'rub',
            'CAD': 'cad', 'INR': 'inr', 'JPY': 'jpy', 'ARS': 'ars', 'BRL': 'brl',
            'CLP': 'clp', 'COP': 'cop', 'UYU': 'uyu', 'PEN': 'pen', 'BOB': 'bob',
            'MXP': 'mxp', 'MXN': 'mxp', 'CUC': 'cuc', 'NIO': 'nio', 'DOP': 'dop',
            'TTD': 'ttd', 'ANG': 'ang'
        };

        jsonData.forEach(row => {
            if (row.length < 2) return;

            let foundCode = null;
            let foundRate = null;

            for (let i = 0; i < 4; i++) { // Check first 4 cols
                const cellVal = row[i];
                if (typeof cellVal === 'string') {
                    const cleanCode = cellVal.trim();
                    if (currencyMap[cleanCode]) {
                        foundCode = currencyMap[cleanCode];
                        // Rate is usually at index 5 (Column F) or 6 (Column G)
                        foundRate = row[5];
                        break;
                    }
                }
            }

            if (foundCode && foundRate !== undefined && foundRate !== null) {
                let rateNum = 0;
                if (typeof foundRate === 'number') {
                    rateNum = foundRate;
                } else if (typeof foundRate === 'string') {
                    rateNum = parseFloat(foundRate.replace(',', '.').replace(/[^\d.-]/g, ''));
                }
                rates[foundCode] = rateNum;
            }
        });

        if (Object.keys(rates).length > 1) {
            recordsToInsert.push(rates);
        }
    }

    console.log(`   ✅ Extracted ${recordsToInsert.length} daily records.`);

    if (recordsToInsert.length > 0) {
        // Upload
        for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
            const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('bcv_quotes').upsert(batch, { onConflict: 'date' });
            if (error) {
                console.error("   ❌ Error uploading batch:", error.message);
            }
        }
        console.log("   🚀 Upload complete for this file.");
    }
}

importAllExcels();
