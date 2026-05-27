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
  console.log("➡️", req.method, req.url);
  next();
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
    const pythonResponse = await axios.post('http://127.0.0.1:5000/classify', req.body, {
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

app.get('/api/stats', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const range = req.query.range || 'weekly';

    const pythonResponse = await axios.get(`http://127.0.0.1:5000/stats?range=${range}`, {
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