// --- Trend Scraper Back-End Server ---
// This Node.js server uses the Express framework to create an API endpoint.
// When the /scan endpoint is called, it uses the Gemini AI to simulate
// a real-time web scrape and returns the fresh trend data.
// To run this:
// 1. Save as `server.js`
// 2. Run `npm install express cors node-fetch@2`
// 3. Get your API key from https://aistudio.google.com/app/apikey
// 4. Paste your key into the `YOUR_API_KEY` variable below.
// 5. Run `node server.js`

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// --- PASTE YOUR API KEY HERE ---
const YOUR_API_KEY = "AIzaSyDV5kgTxu0bU73XC7WR_mFk7tWrMDfYTccRE";

// Use the CORS middleware
app.use(cors());

// The main API endpoint for scanning trends
app.get('/scan', async (req, res) => {
  console.log("Received request to /scan endpoint...");

  // CORRECTED LOGIC: This now correctly checks for the placeholder text.
  if (YOUR_API_KEY === "AIzaSyDV5kgTxu0bU73XC7WR_mFk7tWrMDfYTccRE") {
    return res.status(400).json({ error: "API Key not set. Please add your Google AI API key to the server.js file." });
  }

  const trendScrapingPrompt = `You are TrendShirt AI, an expert market research analyst for the print-on-demand t-shirt industry. Your task is to perform a simulated, multi-source analysis to find the absolute freshest, most current t-shirt trends as of today's date.

Follow this exact three-step process:

1.  **Simulate Google Trends Analysis:** Identify 3 "breakout" search queries or topics that are seeing a sudden, recent spike in search interest. These should be topics people are unexpectedly searching for *right now*.
2.  **Simulate Amazon New Release Analysis:** Imagine you are scanning the top 100 new releases in Amazon's "Novelty & More" t-shirt category. Identify 3 slogans that mimic the style of fast-selling, text-based designs. Think about current events, niche hobbies, or witty phrases that would appeal to impulse buyers.
3.  **Simulate TikTok/Social Media Analysis:** Identify 2 trends based on viral audio, new memes, or trending challenges on TikTok or other social media platforms. Convert these into short, catchy t-shirt slogans.

**Final Output:**
Based on your multi-step analysis, compile a final list of the 8 slogans you discovered. For each slogan, you MUST provide:
- slogan: The t-shirt text.
- relatedKeyword: The core topic or meme.
- source: The primary source you identified it from ('Google Trends Spike', 'Amazon New Release Style', or 'Viral TikTok Sound').
- searchVolume: A realistic estimated search volume number.
- startedTrending: A very recent timeframe, ranging from "1 hour ago" to "30 days ago".
- competition: A level of 'low', 'medium', or 'high'.

The goal is to provide data that feels like it was discovered *today*. Do not use old or generic trends.`;

  const payload = {
      contents: [{ role: "user", parts: [{ text: trendScrapingPrompt }] }],
      generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
              type: "OBJECT", properties: { trends: { type: "ARRAY", items: {
                  type: "OBJECT", properties: {
                      slogan: { type: "STRING" }, relatedKeyword: { type: "STRING" },
                      source: { type: "STRING" }, searchVolume: { type: "NUMBER" },
                      startedTrending: { type: "STRING" }, competition: { type: "STRING" }
                  }, required: ["slogan", "relatedKeyword", "source", "searchVolume", "startedTrending", "competition"]
              }}}, required: ["trends"]
          }
      }
  };

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${YOUR_API_KEY}`;
    
    const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        console.error('API Response Error Body:', await apiResponse.text());
        throw new Error(`API call failed with status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
         throw new Error("Invalid response structure from the AI model.");
    }

    const generatedData = JSON.parse(result.candidates[0].content.parts[0].text);
    console.log("Successfully fetched and parsed trends from AI.");
    res.json(generatedData);

  } catch (error) {
    console.error('SERVER ERROR:', error);
    res.status(500).json({ error: 'Failed to fetch trends from the AI model.' });
  }
});

app.listen(PORT, () => {
  console.log(`Trend scraper server running on https://trend-scraper-backend.onrender.com`);
});
