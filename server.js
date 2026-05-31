require("dotenv").config();
const express = require("express");
const cors = require("cors");
const https = require("https"); 
const fs = require("fs");       
const path = require('path');
const axios = require('axios'); 
const supabase = require("./supabase");
const app = express();
const PORT = 443;               

// 1. SSL Setup (Don't change this)
const sslOptions = {
  key: fs.readFileSync("./localhost+2-key.pem"),
  cert: fs.readFileSync("./localhost+2.pem")
};

// 2. Essential Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  if (req.path.endsWith('/')) return res.status(403).send('Forbidden');
  next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    const blocked = /\.(env|json|log|sh|key|pem|sql|py)$/i;
    if (blocked.test(req.path)) return res.status(403).send('Forbidden');
    next();
});

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

app.get('/api/maps/places', async (req, res) => {
    const { lat, lon, radius, keyword } = req.query;
    const key = process.env.GOOGLE_MAPS_KEY;

    try {
        const url = `https://places.googleapis.com/v1/places:searchText`;
        
        const body = {
            textQuery: keyword,
            locationBias: {
                circle: {
                    center: { latitude: parseFloat(lat), longitude: parseFloat(lon) },
                    radius: parseFloat(radius)
                }
            },
            maxResultCount: 20
        };

        console.log('🌍 Searching:', keyword, 'radius:', radius);
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': key,
                'X-Goog-FieldMask': 'places.displayName,places.location,places.types,places.formattedAddress'
            }
        });

        console.log('📍 Results:', response.data.places?.length ?? 0);
        res.json({ results: response.data.places || [] });

    } catch (err) {
        console.error('❌ Google Places Bridge Error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Places search failed' });
    }
});

// --- [RE-ADD YOUR ORIGINAL ROUTES HERE] ---
const signupRoute = require("./routes/signup");
const signinRoute = require("./routes/signin");
const profileRoute = require("./routes/profile");
// If you had more routes like 'goals', 'history', etc., add them here:
// const goalsRoute = require("./routes/goals");

app.use("/api/signup", signupRoute);
app.use("/api/signin", signinRoute);
app.use("/api/profile", profileRoute);
// app.use("/api/goals", goalsRoute);

// --- [RE-ADD ANY CUSTOM LOGIC OR HELPER FUNCTIONS HERE] ---


// --- THE BRIDGES (Keep these for Mobile/Python support) ---
app.post('/api/classify', async (req, res) => {
  try {
    // 1. Capture the Authorization header sent from your frontend
    const authHeader = req.headers['authorization'];

    // 2. Attach that header to the request going to Python
    const pythonResponse = await axios.post('https://127.0.0.1:5000/classify', req.body, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 
        'Authorization': authHeader, // This is the missing link
        'Content-Type': 'application/json' 
      }
    });
    
    // 3. Send Python's successful response back to the frontend
    res.json(pythonResponse.data);
  } catch (error) {
    // Log the specific error to help us debug
    console.error("❌ Bridge Error:", error.response?.status || error.message);
    
    // Send the error back so the frontend knows what happened
    res.status(error.response?.status || 500).json(
      error.response?.data || { error: "Python server error" }
    );
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const pythonResponse = await axios.post(`https://127.0.0.1:5000/api/goals`, req.body, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
    });
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Goals Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Goals unreachable" });
  }
});

app.post('/api/upload-avatar', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const pythonResponse = await axios.post(`https://127.0.0.1:5000/api/upload-avatar`, req.body, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
    });
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Avatar Upload Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Avatar upload unreachable" });
  }
});

app.post('/api/update-profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const pythonResponse = await axios.post(`https://127.0.0.1:5000/api/update-profile`, req.body, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
    });
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Update Profile Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Update profile unreachable" });
  }
});

app.get('/api/maps/key', (req, res) => {
    res.json({ key: process.env.GOOGLE_MAPS_KEY });
});

app.get('/api/streak/check', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const pythonResponse = await axios.get(`https://127.0.0.1:5000/api/streak/check`, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader }
    });
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Streak Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Streak unreachable" });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const pythonResponse = await axios.get(`https://127.0.0.1:5000/api/leaderboard`, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader }
    });
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Leaderboard Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Leaderboard unreachable" });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const range = req.query.range || 'weekly';

    const pythonResponse = await axios.get(`https://127.0.0.1:5000/stats?range=${range}`, {
      httpsAgent: new require('https').Agent({ rejectUnauthorized: false }),
      headers: { 'Authorization': authHeader }
    });
    
    res.json(pythonResponse.data);
  } catch (error) {
    console.error("❌ Stats Bridge Error:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: "Stats unreachable" });
  }
});

// 3. The Server Start
https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 REGEN running securely on https://0.0.0.0`);
});