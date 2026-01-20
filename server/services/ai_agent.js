const { GoogleGenerativeAI } = require("@google/generative-ai");
const { supabase } = require('../supabase');
const axios = require('axios');
require('dotenv').config();

// Configuration
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const HF_KEY = process.env.HUGGINGFACE_API_KEY;

// Initialize Gemini if key exists
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
// Use fallback model string if specific one fails, but keep simple for now
const geminiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-flash-latest" }) : null;

// Helper: Generate Text using available provider
async function generateAIContent(prompt) {
    let lastError = null;

    // 1. Try Gemini
    if (geminiModel) {
        try {
            console.log("Agent: Trying Gemini...");
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (err) {
            console.warn("Gemini Failed (likely region blocked or 404):", err.message);
            lastError = err;
        }
    } else {
        console.log("Agent: Gemini Key missing, skipping...");
    }

    // 2. Try Hugging Face (Mistral-7B)
    if (HF_KEY) {
        try {
            console.log("Agent: Trying Hugging Face (Mistral)...");
            // Using Mistral-7B-Instruct-v0.3 via free Inference API
            const response = await axios.post(
                "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
                {
                    inputs: `<s>[INST] ${prompt} [/INST]`,
                    parameters: {
                        max_new_tokens: 1000,
                        return_full_text: false,
                        temperature: 0.7
                    }
                },
                { headers: { Authorization: `Bearer ${HF_KEY}` } }
            );

            if (response.data && Array.isArray(response.data) && response.data[0]?.generated_text) {
                return response.data[0].generated_text.trim();
            } else if (response.data && response.data.error) {
                throw new Error("HF API Error: " + response.data.error);
            }
        } catch (err) {
            console.error("Hugging Face Error:", err.message);
            lastError = err;
        }
    } else {
        console.log("Agent: Hugging Face Key missing, skipping...");
    }

    // 3. Fail
    throw new Error("No AI provider worked. Check keys/region/VPN. Last error: " + (lastError?.message || "Unknown"));
}

async function generateDailyBrief() {
    console.log("Agent: Generating Daily Brief...");
    try {
        // 1. Fetch last 24h news
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: news, error } = await supabase
            .from('news_feed')
            .select('*')
            .gte('published_at', yesterday)
            .limit(10); // Limit to 10 to fit in smaller context windows

        if (error || !news || news.length === 0) {
            console.log("No news to analyze.");
            return;
        }

        const newsText = news.map(n => `- ${n.title} (${n.source})`).join('\n');

        // Simplified prompt for smaller models
        const prompt = `
        You are a Senior Crypto Financial Analyst. 
        Analyze these headlines (Last 24h Bitcoin/Crypto):
        ${newsText}
        
        Output strictly valid JSON only with NO markdown formatting:
        { 
          "sentiment": "Bullish/Bearish/Neutral", 
          "summary": "One concise paragraph summary.", 
          "highlights": ["Event 1", "Event 2", "Event 3"], 
          "outlook": "One sentence outlook." 
        }
        `;

        const text = await generateAIContent(prompt);

        // Clean JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Verify JSON
        JSON.parse(cleanJson);

        await supabase.from('market_reports').insert({
            report_type: 'daily_brief',
            content: cleanJson,
            sentiment_label: 'analysis',
            date: new Date()
        });

        console.log("Daily Brief Generated.");
        return cleanJson;

    } catch (err) {
        console.error("Agent Error (Brief):", err.message);
        return JSON.stringify({
            sentiment: "Error",
            summary: "AI Unavailable. Ensure Gemini (VPN required) or HuggingFace keys are set.",
            highlights: ["Check .env file", "Use VPN for Gemini", "Add HUGGINGFACE_API_KEY"],
            outlook: "System Offline"
        });
    }
}

async function analyzeMarketTrends() {
    console.log("Agent: Analyzing Local Trends...");
    try {
        // 1. Fetch recent local news (broad search in last 24h)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: localNews } = await supabase
            .from('news_feed')
            .select('title, source')
            .gte('published_at', yesterday)
            // We can't easily ILIKE multiple terms in one call with this client version cleanly without RPC, 
            // so we'll fetch all recent and filter in JS for now or just take the mix. 
            // Given the scraper filters input, most new items from local sources are relevant.
            .ilike('source', '%banca%') // prioritize local sources if possible, or just take all
            .limit(10);

        const newsContext = localNews ? localNews.map(n => `- ${n.title}`).join('\n') : "No recent headlines.";

        // User Provided Context (Knowledge Base)
        const knowledgeBase = `
        RECENT MARKET CONTEXT (Important):
        Recientemente, Venezuela ha recibido una inyección de capital vía divisas a través del Banco Central (BCV) y ventas de petróleo (aprox USD 300-500 millones).
        Objetivo: Estabilizar el bolívar y apoyar importaciones.
        Factores: Flexibilización de sanciones (OFAC) permite flujo de caja petrolero.
        Efecto Observado: La brecha cambiaria está disminuyendo, indicando cierta recuperación de confianza en el Bolívar o saturación de divisas.
        `;

        const prompt = `
        Act as a Venezuelan Financial Expert.
        
        ${knowledgeBase}

        Recent Local Headlines:
        ${newsContext}

        Based on the Context and Headlines:
        1. Explain the current spread (Official vs Parallel) trend.
        2. Give specific advice for holding USDT vs VES right now.
        
        Keep it concise (approx 3-4 sentences).
        `;

        const text = await generateAIContent(prompt);

        await supabase.from('market_reports').insert({
            report_type: 'local_analysis',
            content: text,
            sentiment_label: 'neutral',
            date: new Date()
        });
        console.log("Local Analysis Generated.");

    } catch (err) {
        console.error("Agent Error (Trends):", err.message);
        await supabase.from('market_reports').insert({
            report_type: 'local_analysis',
            content: "AI Analysis Unavailable.",
            sentiment_label: 'neutral',
            date: new Date()
        });
    }
}

module.exports = { generateDailyBrief, analyzeMarketTrends };
