const agenda = require("../config/agenda");
const Task = require("../models/project_0/task");
const User = require("../models/project_0/user");
const { sendPushNotification } = require("../utils/sendNotification");
const { sendViaAPNs } = require("../utils/sendNotificationApn");

agenda.define("task-notify", async (job) => {
  try {
    const { taskId, type } = job.attrs.data || {};
    if (!taskId)
      return res.status(500).json({ message: "Task ID is required" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(500).json({ message: "Task not found" });

    const user = await User.findById(task.assignedTo);
    if (!user) return res.status(500).json({ message: "User not found" });

    const title =
      type === "assigned"
        ? task.title
          ? `Assigned: ${task.title}`
          : "Task Assigned"
        : task.title
        ? `Reminder: ${task.title}`
        : "Task Reminder";
    const body =
      type === "assigned"
        ? task.description || "You have been assigned a new task."
        : task.description || "Your task ETA is approaching.";

    const hasFcm = Boolean(user.fcmToken && String(user.fcmToken).trim());

    if (hasFcm) {
      await sendPushNotification(
        user.fcmToken,
        null,
        user._id,
        { title, body },
        { taskId: String(task._id), type }
      );
      return res
        .status(200)
        .json({ message: "Push notification sent successfully" });
    }

    if (user.apnToken) {
      await sendViaAPNs({
        apnToken: user.apnToken,
        notificationData: { title, body },
        userId: user._id,
      });
      return res
        .status(200)
        .json({ message: "Push notification sent successfully" });
    }
  } catch (err) {
    console.error("task-notify job failed:", err?.message || err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
