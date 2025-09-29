const express = require("express");
const router = express.Router();
const Order4 = require("../../models/oderModel4");
const Order4Abd = require("../../models/orderModel4-abd");
const SignatureRagOrder = require("../../models/signatureRagOrder");
const signatureRagAbd = require("../../models/signatureRagAbd");

function getYesterdayISTRange() {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30

  // Current UTC time
  const nowUTC = new Date();

  // Convert UTC → IST
  const nowIST = new Date(nowUTC.getTime() + istOffset);

  // Go to yesterday (IST)
  const yesterdayIST = new Date(nowIST);
  yesterdayIST.setDate(nowIST.getDate() - 1);

  // Get IST start of yesterday
  const startIST = new Date(yesterdayIST.setHours(0, 0, 0, 0));

  // Get IST end of yesterday
  const endIST = new Date(yesterdayIST.setHours(23, 59, 59, 999));

  // Convert back to UTC (important for MongoDB)
  return {
    start: new Date(startIST.getTime() - istOffset),
    end: new Date(endIST.getTime() - istOffset),
  };
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
