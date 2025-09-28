const express = require("express");
const User = require("../../../models/project_0/user/index");
const bcrypt = require("bcrypt");
const user = require("../../../models/project_0/user/index");
const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  // Validate required fields
  if (!fullName || !email || !password || !userName) {
    return res.status(400).json({
      message: "All fields (fullName, email, password, userName) are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = await user.create({
      fullName,
      email,
      password: hashedPassword,
      userName,
    });
    if (!newUser) {
      return res.status(500).json({ message: "Failed to create user" });
    }
    res.status(201).json({ message: "User created successfully", newUser });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
