const express = require("express");
const router = express.Router();
const Task = require("../../../models/project_0/task/index");
const mongoose = require("mongoose");

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

/**
 * @swagger
 * /task:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               projectId:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               eta:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  const { title, description, projectId, assignedTo, eta } = req.body;

  if (!title || !projectId) {
    return res
      .status(400)
      .json({ message: "Title and projectId are required" });
  }

  // validate projectId as a MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid projectId",
    });
  }

  // validate assignedTo as a MongoDB ObjectId
  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    return res.status(400).json({
      success: false,
      message: "Invalid assignedTo",
    });
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
    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: newTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /task/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *               eta:
 *                 type: string
 *                 format: date-time
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", async (req, res) => {
  const { title, description, assignedTo, eta, isCompleted } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Title is required",
    });
  }

  // validate projectId as a MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid taskId",
    });
  }

  // validate assignedTo as a MongoDB ObjectId
  if (assignedTo && !mongoose.Types.ObjectId.isValid(assignedTo)) {
    return res.status(400).json({
      success: false,
      message: "Invalid assignedTo",
    });
  }

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, eta, isCompleted },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /task/{id}/complete:
 *   put:
 *     summary: Mark a task as completed
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task marked as completed
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id/complete", async (req, res) => {
  try {
    const taskId = req.params.id;

    // validate taskId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taskId",
      });
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { isCompleted: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task marked as completed",
      data: task,
    });
  } catch (error) {
    console.error("Error completing task:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /task/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", async (req, res) => {
  try {
    const taskId = req.params.id;

    // validate taskId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taskId",
      });
    }
    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
