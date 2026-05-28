const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.get("/", async (req, res) => {
    try {
        const email = req.query.email;

        const { data, error } = await supabase
            .from("users")
            .select("username, email, bio, goals, interests, gender, date_of_birth, age, phone, total_points, avatar_url")
            .eq("email", email)
            .single();

        if (error) {
            return res.json({ success: false, error: error.message });
        }

        res.json({ success: true, user: data });

    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

module.exports = router;