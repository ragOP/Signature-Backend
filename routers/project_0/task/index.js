const express = require("express");
// const User = require("../../../models/project_0/user/index");
const Task = require("../../../models/project_0/task/index");
const router = express.Router();

// Get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find();
    return res.status(200).json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create a new task
router.post("/", async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      eta,
      assignedTo,
      isCompleted,
      createdBy,
    } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Project ID is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    const task = await Task.create({
      projectId,
      title,
      description,
      eta,
      assignedTo,
      isCompleted,
      createdBy,
    });
    return res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Update a task
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectId,
      title,
      description,
      eta,
      assignedTo,
      isCompleted,
      createdBy,
    } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      {
        projectId,
        title,
        description,
        eta,
        assignedTo,
        isCompleted,
        createdBy,
      },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
