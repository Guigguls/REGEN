const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

router.post("/", async (req, res) => {
  console.log("🔥 SIGNUP HIT");

  const { username, email, password, termsAccepted } = req.body;

  if (!termsAccepted) {
    return res.json({
      success: false,
      error: "You must accept Terms & Conditions"
    });
  }

  const { data, error } = await supabase
    .from("users")
    .insert([{ username, email, password }])
    .select();

  if (error) {
    return res.json({
      success: false,
      error: error.message
    });
  }

  res.json({
    success: true,
    data
  });
});

module.exports = router;