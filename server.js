require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("➡️", req.method, req.url);
  next();
});

console.log("🟢 SERVER FILE LOADED");

// routes
const signupRoute = require("./routes/signup");
app.use("/api/signup", signupRoute);

const signinRoute = require("./routes/signin");
app.use("/api/signin", signinRoute);

app.get("/", (req, res) => {
  res.send("REGEN backend running 🚀");
});

// CHANGE THIS: Pass '0.0.0.0' right after the PORT variable
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 REGEN running on all interfaces at port: ${PORT}`);
});