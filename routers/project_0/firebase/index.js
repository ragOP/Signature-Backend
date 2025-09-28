const express = require("express");
const User = require("../../../models/project_0/user/index");
const admin = require("../../../utils/firebaseNotification/firebase");
const router = express.Router();
// POST /firebase/save-token
// Save Firebase token
router.post("/save-token", async (req, res) => {
  const { userId, token } = req.body;

  try {
    await User.findByIdAndUpdate(userId, { fcmToken: token });
    res.json({ success: true, message: "Token saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /firebase/send-notification
// Send notification to user
router.post("/send-notification", async (req, res) => {
  const { userId, title, body } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user?.fcmToken) {
      return res.status(400).json({ error: "User has no FCM token" });
    }

    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
    });

    res.json({ success: true, message: "Notification sent" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
