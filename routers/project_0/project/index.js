const express = require("express");
const router = express.Router();
const Project = require("../../../models/project_0/projects/index");

//Post - create project
router.post("/create-project", async (req, res) => {
  try {
    const { projectName, projectDescription, company } = req.body;
    if (!projectName) {
      return res.status(400).json({ message: "Company name is required" });
    }
    const existing = await Project.findOne({ projectName });
    if (existing) {
      return res.status(400).json({ message: "Company already exists" });
    }
    const data = await Project.create({
      projectName,
      projectDescription,
      company,
    });
    if (!data) {
      return res.status(500).json({ message: "Failed to create company" });
    }
    return res.status(201).json({ message: "Company created", data });
  } catch (error) {
    return res.status(500).json({ message: "Internal server " });
  }
});
//Get - get all project
router.get("/get-projects", async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ message: "Projects fetched", data: projects });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
