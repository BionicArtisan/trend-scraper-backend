// --- Trend Scraper Back-End Server (Live Google Trends) ---
// This server now connects directly to Google Trends to fetch real-time data.
// To Deploy:
// 1. Create a GitHub repository with this file and a `package.json` file.
// 2. In your `package.json`, make sure you have these dependencies: "express", "cors", "node-fetch@2", "google-trends-api".
// 3. Deploy to a service like Render.com.
// 4. Set the Start Command on Render to: `node server.js`
// 5. Add your Google AI API Key as an Environment Variable on Render named `YOUR_API_KEY`.

const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const googleTrends = require('google-trends-api'); // The library for Google Trends
const app = express();
const PORT = process.env.PORT || 3001;

// It's best practice to get the API key from environment variables for security.
const YOUR_API_KEY = "AIzaSyDV5kgTxu0bU73XC7WR_mFk7tWrMDfYTccRE";

app.use(cors());

// The main API endpoint for scanning trends
app.get('/scan', async (req, res) => {
  console.log("Received request to /scan endpoint...");

  if (!YOUR_API_KEY) {
    return res.status(500).json({ error: "API Key not configured on the server." });
  }

  try {
    // --- STEP 1: Fetch REAL data from Google Trends ---
    console.log("Fetching real-time data from Google Trends...");
    // Fetch daily trending searches for the US.
    const trendsData = await googleTrends.dailyTrends({ geo: 'US' });
    const trends = JSON.parse(trendsData);
    
    // Extract the top 5 trending search queries for today.
    const topTrends = trends.default.trendingSearchesDays[0].trendingSearches.slice(0, 5).map(t => t.title.query);
    
    if (topTrends.length === 0) {
        throw new Error("Could not fetch any trending topics from Google Trends at the moment.");
    }
    
    console.log("Verified Google Trends Topics:", topTrends);

    // --- STEP 2: Use AI to generate slogans for the REAL trends ---
    console.log("Sending verified trends to AI for slogan generation...");
    const sloganGenerationPrompt = `You are a creative copywriter for a t-shirt company. Given the following list of verified, real-time trending topics from Google Trends, generate one creative, witty, or funny t-shirt slogan for each topic.

Trending Topics:
- ${topTrends.join('\n- ')}

For each slogan, provide the slogan, the original keyword it's related to, a plausible search volume, a competition level ('low', 'medium', or 'high'), and set the source to "Live Google Trend". The 'startedTrending' value should be "Today".`;

    const payload = {
        contents: [{ role: "user", parts: [{ text: sloganGenerationPrompt }] }],
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

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${YOUR_API_KEY}`;
    const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('AI API Response Error Body:', errorText);
        throw new Error(`AI API call failed with status ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
         throw new Error("Invalid response structure from the AI model.");
    }

    const generatedData = JSON.parse(result.candidates[0].content.parts[0].text);
    console.log("Successfully generated slogans for real trends.");
    res.json(generatedData);

  } catch (error) {
    console.error('SERVER ERROR:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Trend scraper server running on https://trend-scraper-backend.onrender.com`);
});
