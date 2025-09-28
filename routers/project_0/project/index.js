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
  const { projectName, projectDescription, companyId, members } = req.body;

  if (!projectName || !companyId) {
    return res
      .status(400)
      .json({ message: "projectName and companyId are required" });
  }

  // Verify as valid mongo db id
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return res.status(400).json({ message: "Invalid companyId" });
  }

  // Check if project name already exists
  const existingProject = await Project.findOne({ projectName });
  if (existingProject) {
    return res.status(400).json({ message: "Project name already exists" });
  }

  // Check if company exists
  const company = await Company.findById(companyId);
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  // Verify actual mongo db id for member
  const invalidMembers = members.filter(
    (member) => !mongoose.Types.ObjectId.isValid(member)
  );
  if (invalidMembers.length > 0) {
    return res
      .status(400)
      .json({ message: "Invalid member ID: " + invalidMembers.join(", ") });
  }

  // Check if members exist
  const users = await User.find({ _id: { $in: members } });
  if (users.length !== members.length) {
    return res.status(404).json({ message: "Some members do not exist" });
  }

  // Create the project
  try {
    const newProject = new Project({
      projectName,
      projectDescription,
      companyId,
      members,
    });

    await newProject.save();
    res.status(201).json({
      message: "Project created successfully",
      project: newProject,
    });
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
 * /project/{id}/tasks:
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
router.get("/:id/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.id });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
