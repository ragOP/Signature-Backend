const express = require("express");
const router = express.Router();
const SignatureRagOrderModel = require("../../models/signatureRagOrder");
const crypto = require("crypto");
const signatureRagAbdOrderModel = require("../../models/signatureRagAbd");

/**
 * POST /api/signature/rag/create-order
 */
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
    // const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    // hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    // const generatedSignature = hmac.digest("hex");

    // if (generatedSignature !== razorpaySignature) {
    //   return res.status(400).json({
    //     success: false,
    //     data: null,
    //     message: "Invalid Payment",
    //   });
    // }
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
    const order = await SignatureRagOrderModel.create(payload);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
/**
 * GET /api/signature/rag/get-orders
 */

router.get("/get-orders", async (req, res) => {
  const orders = await SignatureRagOrderModel.find({}).sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

/**
 * POST /api/signature/rag/create-order-abd
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
    const order = await signatureRagAbdOrderModel.create(payload);

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("create-order-abd error:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/signature/rag/delete-order-abd/:id
 */
router.delete("/delete-order-abd/:email", async (req, res) => {
  const { email } = req.params;
  if (!email)
    return res.status(400).json({ success: false, error: "email required" });

  try {
    const order = await signatureRagAbdOrderModel.deleteMany({ email });
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
 * GET /api/signature/rag/get-orders-abd
 */
router.get("/get-orders-abd", async (req, res) => {
  const orders = await signatureRagAbdOrderModel
    .find({})
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: orders });
});

module.exports = router;
