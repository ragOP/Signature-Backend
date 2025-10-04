const express = require("express");
const router = express.Router();
const Task = require("../../../models/project_0/task/index");
const mongoose = require("mongoose");
const User = require("../../../models/project_0/user/index");
const agenda = require("../../../config/agenda");
const { sendPushNotification } = require("../../../utils/sendNotification");
const { sendViaAPNs } = require("../../../utils/sendNotificationApn");

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
    // Send immediate assignment notification if assignedTo exists
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (user) {
        const titleText = newTask.title
          ? `Assigned: ${newTask.title}`
          : "Task Assigned";
        const bodyText =
          newTask.description || "You have been assigned a new task.";
        const hasFcm = Boolean(user.fcmToken && String(user.fcmToken).trim());
        if (hasFcm) {
          await sendPushNotification(
            user.fcmToken,
            null,
            user._id,
            { title: titleText, body: bodyText },
            { taskId: String(newTask._id), type: "assigned" }
          );
        } else if (user.apnToken) {
          await sendViaAPNs({
            apnToken: user.apnToken,
            notificationData: { title: titleText, body: bodyText },
            userId: user._id,
          });
        }
      }
    }

    // Schedule ETA reminder one hour before if eta exists
    if (eta) {
      const etaDate = new Date(eta);
      if (!isNaN(etaDate.getTime())) {
        const scheduleAt = new Date(etaDate.getTime() - 60 * 60 * 1000);
        if (scheduleAt > new Date()) {
          await agenda.schedule(scheduleAt, "task-notify", {
            taskId: newTask._id,
            type: "eta_reminder",
          });
        }
      }
    }

    return res.status(201).json({
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
    const prev = await Task.findById(req.params.id).lean();
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

    // If assignment changed, send assignment notification to new assignee
    if (
      task &&
      assignedTo &&
      String(prev?.assignedTo || "") !== String(assignedTo)
    ) {
      const user = await User.findById(assignedTo);
      if (user) {
        const titleText = task.title
          ? `Assigned: ${task.title}`
          : "Task Assigned";
        const bodyText =
          task.description || "You have been assigned a new task.";
        const hasFcm = Boolean(user.fcmToken && String(user.fcmToken).trim());
        if (hasFcm) {
          await sendPushNotification(
            user.fcmToken,
            null,
            user._id,
            { title: titleText, body: bodyText },
            { taskId: String(task._id), type: "assigned" }
          );
        } else if (user.apnToken) {
          await sendViaAPNs({
            apnToken: user.apnToken,
            notificationData: { title: titleText, body: bodyText },
            userId: user._id,
          });
        }
      }
    }

    // Reschedule ETA reminder if eta changed
    const prevEta = prev?.eta ? new Date(prev.eta) : null;
    const nextEta = eta ? new Date(eta) : null;
    const etaChanged =
      (prevEta?.getTime?.() || 0) !== (nextEta?.getTime?.() || 0);
    if (task && etaChanged) {
      // cancel existing reminders for this task
      await agenda.cancel({
        name: "task-notify",
        "data.taskId": String(task._id),
        "data.type": "eta_reminder",
      });
      if (nextEta && !isNaN(nextEta.getTime())) {
        const scheduleAt = new Date(nextEta.getTime() - 60 * 60 * 1000);
        if (scheduleAt > new Date()) {
          await agenda.schedule(scheduleAt, "task-notify", {
            taskId: task._id,
            type: "eta_reminder",
          });
        }
      }
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
 *       - in: query
 *         name: taskId
 *         schema:
 *           type: string
 *         description: Filter tasks by taskId
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
    const { userId, adminId, projectId, status, taskId } = req.query;

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
    if (taskId) {
      filter._id = taskId;
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
