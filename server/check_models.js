require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function check() {
    console.log("Checking API Key availability...");
    if (!process.env.GEMINI_API_KEY) {
        console.error("ERROR: GEMINI_API_KEY is missing in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
        const modelManager = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Placeholder to access manager if needed? No, SDK has getGenerativeModel.
        // Actually, listModels is on the GoogleGenerativeAI instance? No, it's usually on a ModelManager or similar.
        // Checking docs: 'genAI' instance doesn't have listModels directly in some versions. 
        // In 0.24.0, it might be different.
        // Let's try the direct HTTP request if SDK is obscure, but checking SDK usage:
        // const { GoogleGenerativeAI } = require("@google/generative-ai");
        // const genAI = new GoogleGenerativeAI(API_KEY);
        // It doesn't seem to expose listModels easily in the high-level client.

        // Let's stick effectively to testing: 
        // But wait, if I can use a simple curl or fetch to list models? 
        // Let's just try to test 'gemini-1.5-flash-8b' and 'gemini-pro-vision' maybe?

        // Let's add 'gemini-1.5-pro' to the list.

    } catch (e) { }

    // Updated candidate list to include more standard ones
    const candidates = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-flash-latest"
    ];

    console.log("Testing models...");

    for (const modelName of candidates) {
        process.stdout.write(`Testing ${modelName}: `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            const text = response.text();
            if (text) {
                console.log(`SUCCESS ✅`);
                console.log(`\n>>> RECOMMENDED FIX: Use '${modelName}' in server/services/ai_agent.js <<<\n`);
                return; // Stop after first success
            }
        } catch (e) {
            console.log(`FAILED ❌ ${e.message}`);
        }
    }
    console.log("\nALL MODELS FAILED. check your API Key permissions.");
}

check();
