const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// 🔑 THE REAL SIGNIN LOGIC
router.post("/", async (req, res) => {
  console.log("🔑 SIGNIN HIT");

  const { email, password } = req.body;

  console.log("📧 Attempting login for:", email);

  try {
    // Authenticate existing user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("❌ Supabase Auth login error:", error.message);
      return res.json({
        success: false,
        error: error.message
      });
    }

    console.log("✅ Auth login success:", data.user.email);

    // CRITICAL: Return success, the user object, AND the session (for the access_token!)
    res.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.user_metadata?.username || ""
      },
      session: {
        access_token: data.session.access_token
      }
    });

  } catch (err) {
    console.error("❌ System login error:", err);
    res.json({
      success: false,
      error: "Internal server error during sign-in."
    });
  }
});

module.exports = router;