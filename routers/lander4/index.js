const express = require("express");
const router = express.Router();
const orderModel4 = require("../../models/oderModel4");
const crypto = require("crypto");
const orderModel4Abd = require("../../models/orderModel4-abd");

router.post("/create-order", async (req, res) => {
  const {
    amount,
    orderId,
    fullName,
    email,
    phoneNumber,
    profession,
    remarks,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    additionalProducts = [],
  } = req.body;
  try {
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Invalid Payment",
      });
    }
    const payload = {
      amount,
      orderId,
      fullName,
      email,
      phoneNumber,
      profession,
      remarks,
      razorpayOrderId,
      razorpayPaymentId,
      additionalProducts,
      razorpaySignature,
    };
    const order = await orderModel4.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get("/get-orders", async (req, res) => {
  const orders = await orderModel4.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * POST /api/lander4/create-order-abd
 */
router.post("/create-order-abd", async (req, res) => {
  const {
    amount,
    fullName,
    email,
    phoneNumber,
    profession,
    remarks,
    additionalProducts = [],
  } = req.body;

  try {
    const payload = {
      abdOrderId: `ord_${Date.now()}_${Math.floor(Math.random() * 1e5)}`,
      amount,
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      profession: profession,
      remarks: remarks,
      additionalProducts: additionalProducts,
    };
    const order = await orderModel4Abd.create(payload);

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("create-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/lander4/delete-order-abd/:id
 */
router.delete("/delete-order-abd/:id", async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ success: false, error: "id required" });

  try {
    const order = await orderModel4Abd.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      data: order,
      message: "Abandoned Order deleted successfully",
    });
  } catch (error) {
    console.error("delete-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/lander4/get-orders-abd
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await orderModel4Abd.find({}).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

module.exports = router;
