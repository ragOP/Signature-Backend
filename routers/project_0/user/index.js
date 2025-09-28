const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../../models/project_0/user/index");
const Invite = require("../../../models/project_0/invite/index");
const Company = require("../../../models/project_0/Company/index");
const router = express.Router();

// TODO: Use a secret from environment variables
const JWT_SECRET = "your-super-secret-key";

// POST /auth/signup
// Create User
router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ message: "fullName, email, and password are required" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error signing up:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/login
// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /users/:id
// Fetch user profile
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "companies.companyId",
      "name description"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /auth/signup/:token (for invite-based signup)
router.post("/signup/:token", async (req, res) => {
  const { token } = req.params;
  const { fullName, password } = req.body;

  if (!fullName || !password) {
    return res.status(400).json({ message: "fullName and password are required" });
  }

  try {
    const invite = await Invite.findOne({ token });

    if (!invite || invite.isAccepted) {
      return res.status(400).json({ message: "Invalid or expired invite token" });
    }

    const company = await Company.findById(invite.companyId);
    if (!company) {
      return res.status(404).json({ message: "Associated company not found" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      fullName,
      email: invite.email,
      password: hashedPassword,
    });

    newUser.companies.push({ companyId: company._id, role: invite.role });
    company.users.push({ userId: newUser._id, role: invite.role });

    invite.isAccepted = true;

    await newUser.save();
    await company.save();
    await invite.save();

    res.status(201).json({ message: "User created and linked to company successfully" });
  } catch (error) {
    console.error("Error in invite-based signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;