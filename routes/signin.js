const express = require("express");
const router = express.Router();
const supabase = require("../supabase");

// 🔑 THE REAL SIGNIN LOGIC
router.post("/", async (req, res) => {
  console.log("🔑 SIGNIN HIT");

  let { email, password } = req.body;

  // 1. Clean up the email input (remove accidental spaces at the beginning or end)
  if (email) {
    email = email.trim();
  }

  console.log("📧 Attempting login for:", email);

  /* =========================================================
     📧 STRICT EMAIL VALIDATION CHECK
     ========================================================= */
  // Checks if input is empty, has an @, a domain, and a valid extension (.com, .org, etc.)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    console.log("❌ Validation failed: Invalid email format provided ->", email);
    return res.json({
      success: false,
      error: "Please enter a valid email address (e.g., user@mail.com)."
    });
  }

  // Double check that password isn't empty either
  if (!password || password.trim() === "") {
    console.log("❌ Validation failed: Missing password field.");
    return res.json({
      success: false,
      error: "Password field cannot be empty."
    });
  }

  /* =========================================================
     PROCEED TO SUPABASE AUTHENTICATION
     ========================================================= */
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