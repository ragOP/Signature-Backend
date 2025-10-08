const express = require("express");
const router = express.Router();
const orderModel4 = require("../../models/oderModel4");
const crypto = require("crypto");
const orderModel4Abd = require("../../models/orderModel4-abd");

const {
  signatureOrderConfirmationHTML,
} = require("../../emails/orderConfirmation");

const { sendEmail } = require("../../utils/mailer");
const emailLog2 = require("../../models/emailLog2");

async function sendAndLogConfirmationEmailNodeMailer({
  email,
  name,
  orderId,
  amount,
  additionalProducts = [],
}) {
  const adminBcc = process.env.ADMIN_ORDER_BCC || "";

  const html = signatureOrderConfirmationHTML({
    customerName: name || "",
    orderId,
    amount: Number(amount || 0),
    items: [{ title: "Signature Order", price: Number(amount || 0) }],
    additionalProducts,
  });

  try {
    const result = await sendEmail({
      to: email,
      subject: `Your Signature Order is Confirmed (#${orderId})`,
      html,
      bcc: adminBcc || undefined,
      // Optional: helpful tags in Resend dashboard
      tags: [
        { name: "type", value: "order_confirmation" },
        { name: "orderId", value: String(orderId) },
      ],
    });

    const id = result?.id || "";
    const status = id ? "accepted" : "error";

    await emailLog2.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your Signature Order is Confirmed (#${orderId})`,
      orderId,
      status, // "accepted" if we got an id from Resend
      accepted: id ? [email] : [],
      rejected: [],
      response: id, // store the Resend message id here
      messageId: id, // also store in messageId
      errorMessage: "",
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });

    console.log(
      `[email-log] NodeMailer queued id=${id} for ${email} / ${orderId}`
    );
  } catch (err) {
    console.error("[order-email] NodeMailer failed:", err?.message || err);

    await emailLog2.create({
      toEmail: email,
      bcc: adminBcc,
      subject: `Your Signature Order is Confirmed (#${orderId})`,
      orderId,
      status: "error",
      accepted: [],
      rejected: [],
      response: "",
      messageId: "",
      errorMessage: err?.message || String(err),
      meta: { amount: Number(amount || 0), name, additionalProducts },
      sentAt: new Date(),
    });
  }
}

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
    const existingOrder = await orderModel4.findOne({ orderId });
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        data: existingOrder,
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
    (async () => {
      if (email) {
        await sendAndLogConfirmationEmailNodeMailer({
          email,
          fullName,
          orderId: orderId || razorpayOrderId || `ORDER_${Date.now()}`,
          amount,
          additionalProducts,
        });
      } else {
        console.warn(
          "[order-email] no email in payload; skipping Resend + log"
        );
      }
    })();
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

router.get("/get-orders/main", async (req, res) => {
  const { page = 1, limit = 1000, startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  const orders = await orderModel4Abd
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

router.get("/get-orders/abd-main", async (req, res) => {
  const { page = 1, limit = 1000, startDate, endDate } = req.query;
  const query = {};
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  const orders = await orderModel4Abd
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return res.status(200).json({
    success: true,
    data: orders,
  });
});

router.patch("/delivery-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryStatusEmail = req.body.deliveryStatusEmail;

    const order = await orderModel4.findByIdAndUpdate(
      id,
      { deliveryStatusEmail: deliveryStatusEmail },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
