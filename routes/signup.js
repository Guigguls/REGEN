const express = require("express");
const router = express.Router();

const supabase = require("../supabase");

router.post("/", async (req, res) => {

  console.log("🔥 SIGNUP HIT");


  let {
    username,
    email,
    password,
    termsAccepted
  } = req.body;


  /* =========================================================
     INPUT CLEANING
  ========================================================= */

  if (username) {
    username = username.trim();
  }

  if (email) {
    email = email.trim().toLowerCase();
  }


  /* =========================================================
     TERMS VALIDATION
  ========================================================= */

  if (!termsAccepted) {

    return res.json({
      success: false,
      error: "You must accept the Terms & Conditions."
    });
  }


  /* =========================================================
     NAME VALIDATION
  ========================================================= */

  // Letters and spaces only
  const nameRegex = /^[A-Za-z\s]+$/;

  if (!username) {

    return res.json({
      success: false,
      error: "Please enter your name."
    });
  }

  if (username.length < 2) {

    return res.json({
      success: false,
      error: "Name must be at least 2 letters."
    });
  }

  if (username.length > 50) {

    return res.json({
      success: false,
      error: "Name is too long."
    });
  }

  if (!nameRegex.test(username)) {

    return res.json({
      success: false,
      error: "Name must contain letters only."
    });
  }


  /* =========================================================
     EMAIL VALIDATION
  ========================================================= */

  // Accepts:
  // gmail.com
  // yahoo.net
  // school.edu
  // etc.

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.(com|net|org|edu|gov|ph|co|io)$/i;

  if (!email || !emailRegex.test(email)) {

    return res.json({
      success: false,
      error: "Please enter a valid email address."
    });
  }


  /* =========================================================
     PASSWORD VALIDATION
  ========================================================= */

  // Requirements:
  // 8-20 chars
  // uppercase
  // lowercase
  // number
  // no spaces

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?!.*\s).{8,20}$/;

  if (!passwordRegex.test(password)) {

    return res.json({
      success: false,
      error:
        "Password must be 8-20 characters and include uppercase, lowercase, and a number."
    });
  }


  /* =========================================================
     CHECK IF EMAIL ALREADY EXISTS
  ========================================================= */

  try {

    const { data: existingUser } =
      await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .maybeSingle();

    if (existingUser) {

      return res.json({
        success: false,
        error: "Email is already registered."
      });
    }


    /* =========================================================
       CREATE USER IN SUPABASE AUTH
    ========================================================= */

    const {
      data,
      error
    } = await supabase.auth.signUp({

      email,
      password,

      options: {
        data: {
          username
        }
      }
    });


    if (error || !data.user) {

      console.log(
        "❌ Supabase signup error:",
        error?.message
      );

      return res.json({
        success: false,
        error:
          error?.message ||
          "Signup failed"
      });
    }


    /* =========================================================
       INSERT INTO USERS TABLE
    ========================================================= */

    const {
      error: tableError
    } = await supabase
      .from("users")
      .insert([
        {
          id: data.user.id,
          username,
          email
        }
      ]);


    if (tableError) {

      console.error(
        "❌ Users table insert error:",
        tableError.message
      );
    }


    /* =========================================================
       TOKENS
    ========================================================= */

    const accessToken =
      data.session?.access_token || null;

    const refreshToken =
      data.session?.refresh_token || null;


    console.log(
      "✅ Account created:",
      data.user.email
    );


    /* =========================================================
       SUCCESS RESPONSE
    ========================================================= */

    res.json({

      success: true,

      message:
        "Account created successfully",

      access_token: accessToken,

      refresh_token: refreshToken,

      user: {
        id: data.user.id,
        email: data.user.email,
        username
      }
    });

  }


  /* =========================================================
     SERVER ERROR
  ========================================================= */

  catch (err) {

    console.error(
      "❌ Signup system error:",
      err
    );

    res.json({

      success: false,

      error:
        "Internal server error during registration."
    });
  }

});

module.exports = router;