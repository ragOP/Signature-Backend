const express = require("express");
const router = express.Router();
const Company = require("../../../models/project_0/Company/index");
const User = require("../../../models/project_0/user/index");
const Invite = require("../../../models/project_0/invite/index");
const Project = require("../../../models/project_0/projects/index");
const crypto = require("crypto");

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management
 */

/**
 * @swagger
 * /company/{id}:
 *   get:
 *     summary: Get companies for a specific user
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch companies for
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const companies = await Company.find({
      $or: [{ createdBy: userId }, { "users.userId": userId }],
    });

    res.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /company:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /company/{id}/invite:
 *   post:
 *     summary: Invite a user to a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       201:
 *         description: Invite sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /company/{id}/add-user:
 *   post:
 *     summary: Add an existing user to a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: User added to company successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company or user not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /company/{id}/members:
 *   get:
 *     summary: Get all members of a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     responses:
 *       200:
 *         description: A list of company members
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /company/{id}/projects:
 *   get:
 *     summary: Get all projects for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     responses:
 *       200:
 *         description: A list of projects for the company
 *       500:
 *         description: Internal server error
 */
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
