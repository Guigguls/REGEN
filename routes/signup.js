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

  // Create user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username } // saves username in auth metadata
    }
  });

  if (error || !data.user) {
    return res.json({
      success: false,
      error: error?.message || "Signup failed"
    });
  }

  // Also insert into your users table to keep it in sync
  const { error: tableError } = await supabase
    .from("users")
    .insert([{
      id: data.user.id,  // use same ID as auth so they stay linked
      username,
      email
      // do NOT store password here
    }]);

  if (tableError) {
    console.error("Users table insert error:", tableError.message);
    // Don't block signup if table insert fails
  }

  res.json({
    success: true,
    message: "Account created successfully",
    user: {
      id: data.user.id,
      email: data.user.email,
      username
    }
  });
});

module.exports = router;