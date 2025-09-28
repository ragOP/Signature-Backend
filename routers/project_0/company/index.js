const express = require("express");
const router = express.Router();
const Company = require("../../../models/project_0/Company/index");
const User = require("../../../models/project_0/user/index");
const Invite = require("../../../models/project_0/invite/index");
const Project = require("../../../models/project_0/projects/index");
const crypto = require("crypto");

// POST /companies
// Create Company
router.post("/", async (req, res) => {
  const { name, description, userId } = req.body; // Assuming userId is passed in body for now

  if (!name || !userId) {
    return res.status(400).json({ message: "Name and userId are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newCompany = new Company({
      name,
      description,
      createdBy: userId,
    });

    // Add creator as admin
    newCompany.users.push({ userId: user._id, role: "admin" });
    user.companies.push({ companyId: newCompany._id, role: "admin" });

    await newCompany.save();
    await user.save();

    res.status(201).json(newCompany);
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /companies/:id/invite
// Invite a user to a company
router.post("/:id/invite", async (req, res) => {
  const { email, role } = req.body;
  const companyId = req.params.id;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const newInvite = new Invite({
      email,
      companyId,
      role: role || "member",
      token,
    });

    await newInvite.save();

    // TODO: Send email with invite link
    // const inviteLink = `http://yourapp.com/auth/signup/${token}`;
    // sendEmail(email, 'You have been invited to join a company', `Click here to join: ${inviteLink}`);

    res.status(201).json({ message: "Invite sent successfully" });
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST /companies/:id/add-user
// Add an existing user to a company
router.post("/:id/add-user", async (req, res) => {
  const { userId, role } = req.body;
  const companyId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already in the company
    if (company.users.some((u) => u.userId.equals(user._id))) {
      return res
        .status(400)
        .json({ message: "User is already in the company" });
    }

    company.users.push({ userId: user._id, role: role || "member" });
    user.companies.push({ companyId: company._id, role: role || "member" });

    await company.save();
    await user.save();

    res.json({ message: "User added to company successfully" });
  } catch (error) {
    console.error("Error adding user to company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /companies/:id/members
// Get all members of a company
router.get("/:id/members", async (req, res) => {
  const companyId = req.params.id;

  try {
    const company = await Company.findById(companyId).populate(
      "users.userId",
      "fullName email"
    );
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company.users);
  } catch (error) {
    console.error("Error fetching company members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /companies/:id/projects
// Fetch all projects for a company
router.get("/:id/projects", async (req, res) => {
  const companyId = req.params.id;

  try {
    const projects = await Project.find({ companyId: companyId });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
