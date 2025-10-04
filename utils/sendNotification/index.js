const { getMessaging } = require("../../firebaseNotification/firebase");
const User = require("../../models/project_0/user");

exports.sendPushNotification = async (
  fcmToken,
  apnToken,
  userId,
  notificationData,
  data = {}
) => {
  try {
    const messaging = getMessaging();
    const message = {
      token: fcmToken ? fcmToken : apnToken,
      notification: {
        title: notificationData.title || "New Notification",
        body: notificationData.body || "You have a new notification",
        ...notificationData,
      },
      data: {
        ...data,
        userId: userId.toString(),
        timestamp: new Date().toISOString(),
      },
      android: {
        notification: {
          channelId: "chat-messages",
          priority: "high",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await messaging.send(message);

    console.log(
      `Push notification sent successfully to user ${userId}:`,
      response
    );

    return {
      success: true,
      message: "Push notification sent successfully",
      messageId: response,
      userId,
    };
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);

    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await User.findByIdAndUpdate(userId, { fcmToken: null });
      console.log(`Removed invalid FCM token for user ${userId}`);
    }

    return {
      success: false,
      message: "Failed to send push notification",
      error: error.message,
      userId,
    };
  }
};
