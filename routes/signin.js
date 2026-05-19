const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.post("/", async (req, res) => {
    console.log("🔥 SIGNIN HIT");

    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({
            success: false,
            error: "Email and password are required"
        });
    }

    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

    if (error || !data) {
        return res.json({
            success: false,
            error: "Invalid email or password"
        });
    }

    res.json({
        success: true,
        message: "Login successful",
        user: {
            id: data.id,
            username: data.username,
            email: data.email
        }
    });
});

module.exports = router;