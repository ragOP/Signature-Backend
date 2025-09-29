const express = require("express");
const router = express.Router();
const Order4 = require("../../models/oderModel4");
const Order4Abd = require("../../models/orderModel4-abd");
const SignatureRagOrder = require("../../models/signatureRagOrder");
const signatureRagAbd = require("../../models/signatureRagAbd");

function getYesterdayISTRange() {
   // IST offset = +5 hours 30 minutes
  const istOffset = 5.5 * 60 * 60 * 1000;

  // Current time in UTC
  const nowUTC = new Date();

  // Convert UTC → IST
  const nowIST = new Date(nowUTC.getTime() + istOffset);

  // Go to "yesterday" in IST
  const yesterdayIST = new Date(
    nowIST.getFullYear(),
    nowIST.getMonth(),
    nowIST.getDate() - 1
  );

  // Start of yesterday in IST (00:00:00)
  const startIST = new Date(
    yesterdayIST.getFullYear(),
    yesterdayIST.getMonth(),
    yesterdayIST.getDate(),
    0, 0, 0, 0
  );

  // End of yesterday in IST (23:59:59.999)
  const endIST = new Date(
    yesterdayIST.getFullYear(),
    yesterdayIST.getMonth(),
    yesterdayIST.getDate(),
    23, 59, 59, 999
  );

  // Convert IST → UTC (because MongoDB expects UTC)
  const startUTC = new Date(startIST.getTime() - istOffset);
  const endUTC = new Date(endIST.getTime() - istOffset);

  return { start: startUTC, end: endUTC };
}

router.route("/get-stats/record").get(async (req, res) => {
  try {
    const { start, end } = getYesterdayISTRange();

    const query = {
      createdAt: { $gte: start, $lte: end },
    };
    const lander4 = await Order4.find(query).select("createdAt");
    const lander4Count = lander4.length;
    const lander5 = await SignatureRagOrder.find(query).select("createdAt");
    const lander5Count = lander5.length;
    return res.status(200).json({
      message: "User statistics retrieved successfully",
      stats: {
        lander4: {
          count: lander4Count,
          title: "Signature Main",
          lastOrderTime: lander4.length
            ? lander4[lander4.length - 1].createdAt
            : null,
        },
        lander5: {
          count: lander5Count,
          title: "Signature New 2",
          lastOrderTime: lander5.length
            ? lander5[lander5.length - 1].createdAt
            : null,
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving user statistics", error });
  }
});

router.route("/get-stats/abandoned").get(async (req, res) => {
  try {
    const { start, end } = getYesterdayISTRange();

    const query = {
      createdAt: { $gte: start, $lte: end },
    };
    const lander4 = await Order4Abd.find(query).select("createdAt");
    const lander4Count = lander4.length;
    const lander5 = await signatureRagAbd.find(query).select("createdAt");
    const lander5Count = lander5.length;
    return res.status(200).json({
      message: "User statistics retrieved successfully",
      stats: {
        lander4: {
          count: lander4Count,
          title: "Signature Main ABD",
          lastOrderTime: lander4.length
            ? lander4[lander4.length - 1].createdAt
            : null,
        },
        lander5: {
          count: lander5Count,
          title: "Signature New 2 ABD",
          lastOrderTime: lander5.length
            ? lander5[lander5.length - 1].createdAt
            : null,
        },
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error retrieving user statistics", error });
  }
});

module.exports = router;
