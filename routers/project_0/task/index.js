const express = require("express");
const router = express.Router();
const Task = require("../../../models/project_0/task/index");

// POST /tasks
// Create task
router.post("/", async (req, res) => {
  const { title, description, projectId, assignedTo, eta } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ message: "Title and projectId are required" });
  }

  try {
    // Assuming createdBy will be set from authenticated user later
    const newTask = new Task({
      title,
      description,
      projectId,
      assignedTo,
      eta,
    });

    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /tasks/:id
// Update task details
router.put("/:id", async (req, res) => {
  const { title, description, assignedTo, eta, isCompleted } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, eta, isCompleted },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /tasks/:id/complete
// Mark a task as completed
router.put("/:id/complete", async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { isCompleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /tasks/:id
// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;