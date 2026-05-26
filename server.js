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
const changeprofileRoute = require("./routes/changeProfile");
app.use("/api/changeprofile", changeprofileRoute);
app.get("/", (req, res) => {
res.send("REGEN backend running 🚀");
});

app.listen(PORT, () => {
console.log(`🚀 REGEN running on http://localhost:${PORT}`);
});

const supabase = require("./supabase");
app.get("/api/profile", async (req, res) => {
const email = req.query.email;

if (!email) {
return res.status(400).json({
error: "Email is required"
});

}

const { data, error } = await supabase
.from("users")
.select("username, email")
.eq("email", email)
.single();

if (error) {
console.log("SUPABASE ERROR:", error);
return res.status(500).json({
error: error.message
});
}

res.json({
success: true,
user: data
});
});

app.get("/", (req, res) => {
res.send("REGEN backend running 🚀");
});

app.listen(PORT, () => {
console.log(`🚀 REGEN running on http://localhost:${PORT}`);
});