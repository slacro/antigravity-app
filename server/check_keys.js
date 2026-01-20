
const http = require('http');

http.get('http://localhost:3000/api/bcv/history', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("Count:", json.length);
            if (json.length > 0) {
                // Check keys of the last item
                const last = json[json.length - 1];
                console.log("Keys:", Object.keys(last));
                console.log("Last Item:", JSON.stringify(last, null, 2));
            }
        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
});
