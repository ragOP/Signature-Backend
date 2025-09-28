const express = require("express");
const router = express.Router();
const Project = require("../../../models/project_0/projects/index");
const Task = require("../../../models/project_0/task/index");

// POST /projects
// Create project
router.post("/", async (req, res) => {
  const { projectName, projectDescription, companyId, members } = req.body;

  if (!projectName || !companyId) {
    return res
      .status(400)
      .json({ message: "projectName and companyId are required" });
  }

  try {
    const newProject = new Project({
      projectName,
      projectDescription,
      companyId,
      members,
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /projects/:id
// Update project details/members
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

// DELETE /projects/:id
// Delete project
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

// GET /projects/:id/tasks
// Fetch all tasks for a project
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
