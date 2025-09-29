const express = require("express");
const router = express.Router();
const Task = require("../../../models/project_0/task/index");
const mongoose = require("mongoose");
// const admin = require("../../../utils/firebaseNotification/firebase");
const User = require("../../../models/project_0/user/index");
// const schedule = require("node-schedule");
/*
async function sendreminder(taskId) {
  const task = await Task.findById(taskId);
  if (!task) {
    return;
  }
  const eta = task.eta;
  const reminderTime = eta.getTime() - 10 * 60 * 1000;
  const now = new Date();
  if (now > reminderTime || task.status === "completed") {
    return;
  }
  if (reminderTime > now) {
    schedule.scheduleJob(reminderTime, async () => {
      console.log(`Reminder: Task "${newTask.title}" ETA ends in 1 hour.`);

      await sendRemindernotification(assignedTo, newTask);
    });
  }
  const user = await User.findById(task.assignedTo);
  if (!user) {
    return;
  }
  if (!user.fcmToken) {
    return;
  }
  await admin.messaging().send({
    token: user.fcmToken,
    notification: { title: "Task Reminder", body: "You have a task reminder" },
  });
}
  */

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
  const { title, description, projectId, assignedTo, eta, status, priority } =
    req.body;

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
      status,
      priority,
    });

    await newTask.save();
    // sendreminder(newTask._id);
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
 * /task/update-status:
 *   put:
 *     summary: Update a task's status or priority
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         required: true
 *         description: The task ID to update
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["to do", "in progress", "completed"]
 *         required: false
 *         description: New status for the task
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: ["low", "medium", "high"]
 *         required: false
 *         description: New priority for the task
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Bad request (invalid params or values)
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */

router.put("/update-status", async (req, res) => {
  try {
    const { taskId, status, priority } = req.query;
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "TaskId are required",
      });
    }
    const filter = {};
    // validate taskId as a MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid taskId",
      });
    }
    if (status) {
      const allowed = ["to do", "in progress", "completed"];
      if (!allowed.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      filter.status = status;
    }
    if (priority) {
      const allowed = ["low", "medium", "high"];
      if (!allowed.includes(priority)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid priority" });
      }

      filter.priority = priority;
    }

    const task = await Task.findByIdAndUpdate(taskId, filter, { new: true });

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
  const { title, description, assignedTo, eta, status, priority } =
    req.body || {};

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
  if (!["to do", "in progress", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status",
    });
  }

  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, eta, status, priority },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    // sendreminder(task._id);

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

/**
 * @swagger
 * /task:
 *   get:
 *     summary: Get tasks with optional filters
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter tasks assigned to a specific user (assignedTo)
 *       - in: query
 *         name: adminId
 *         schema:
 *           type: string
 *         description: Filter tasks created by a specific admin (createdBy)
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter tasks by project
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ["to do", "in progress", "completed"]
 *         description: Filter tasks by status
 *     responses:
 *       200:
 *         description: List of tasks
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/get-records", async (req, res) => {
  try {
    const { userId, adminId, projectId, status } = req.query;

    const filter = {};

    if (userId) {
      filter.assignedTo = userId;
      console.log(filter, "filter>>>>>>");
    }

    if (adminId) {
      filter.createdBy = adminId;
    }

    if (projectId) {
      filter.projectId = projectId;
    }

    if (status) {
      const allowed = ["to do", "in progress", "completed"];
      if (!allowed.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      filter.status = status;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("projectId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
