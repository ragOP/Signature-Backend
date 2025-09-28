const express = require("express");
const router = express.Router();
const Project = require("../../../models/project_0/projects/index");
const Task = require("../../../models/project_0/task/index");
const Company = require("../../../models/project_0/Company/index");
const User = require("../../../models/project_0/user/index");
const mongoose = require("mongoose");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - companyId
 *             properties:
 *               projectName:
 *                 type: string
 *               projectDescription:
 *                 type: string
 *               companyId:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  try {
    const {
      projectName,
      projectDescription,
      companyId,
      members = [],
    } = req.body;

    if (!projectName || !companyId) {
      return res
        .status(400)
        .json({ message: "projectName and companyId are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid companyId" });
    }

    // Run queries in parallel
    const [existingProject, company] = await Promise.all([
      Project.findOne({ projectName, companyId }),
      Company.findById(companyId),
    ]);

    if (existingProject) {
      return res.status(400).json({ message: "Project name already exists" });
    }
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Validate member IDs
    const invalidMembers = members.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidMembers.length) {
      return res.status(400).json({
        message: `Invalid member ID(s): ${invalidMembers.join(", ")}`,
      });
    }

    // Ensure all members exist
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(404).json({ message: "Some members do not exist" });
    }

    // Create project
    const newProject = await Project.create({
      projectName,
      projectDescription,
      companyId,
      members,
    });

    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *               projectDescription:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", async (req, res) => {
  const { projectName, projectDescription, members } = req.body;

  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName, projectDescription, members },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /project/company/{id}:
 *   get:
 *     summary: Get all projects for a specific company
 *     tags: [Projects]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
 *       404:
 *         description: Company not found
 *       500:
 *         description: Internal server error
 */
router.get("/company/:id", async (req, res) => {
  const companyId = req.params.id;

  try {
    // validate companyId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: "Invalid companyId" });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const projects = await Project.find({ companyId });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching company projects:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /project/tasks/{id}:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *     responses:
 *       200:
 *         description: A list of tasks for the project
 *       500:
 *         description: Internal server error
 */
router.get("/tasks/:id", async (req, res) => {
  try {
    const projectId = req.params.id;

    // validate projectId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid projectId",
      });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "fullName email") // get assigned user details
      .populate("createdBy", "fullName email"); // get creator details

    res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
