const axios = require("axios");

const MAIN_URL = "https://www.thesignaturestudio.in";

const createCashfreeSession = async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      amount,
      profession,
      remarks,
      additionalProducts,
      orderType = "normal",
      url,
      quantity = 1,
    } = req.body;

    const orderId = "order_" + Date.now();

    const cartUrl = `${MAIN_URL}/confirmation`;

    const finalUrl = url ? url : cartUrl;

    console.log(">>>>", process.env.CASHFREE_CLIENT_ID);
    console.log(">>>>", process.env.CASHFREE_SECRET_KEY);

    let returnUrl = `${finalUrl}?orderId=${orderId}&orderType=${orderType}`;

    const response = await axios.post(
      `${process.env.CASHFREE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_001",
          customer_name: fullName || "Customer",
          customer_email: email || "test@example.com",
          customer_phone: phoneNumber || "9999999999",
        },
        order_meta: {
          return_url: returnUrl,
          notify_url: `${MAIN_URL}/api/payment/webhook`,
        },
        order_note: remarks,
        order_tags:
          additionalProducts && additionalProducts.length > 0
            ? additionalProducts
            : null,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2025-01-01",
        },
      }
    );

    const data = response.data;
    res.json({ data: data });
  } catch (error) {
    console.error("Error creating session:", error.response?.data || error);
    res
      .status(500)
      .json({ error: "Failed to create session", ...error.response?.data });
  }
};

const getCashfreePaymentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(
      `${process.env.CASHFREE_URL}/orders/${id}/payments`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_CLIENT_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          Accept: "application/json",
          "x-api-version": "2025-01-01",
        },
      }
    );

    const data = response.data;
    res.json({ data: data });
  } catch (error) {
    console.error(
      "Error fetching payment details:",
      error.response?.data || error
    );
    res.status(500).json({ error: "Failed to fetch payment details" });
  }
};

module.exports = {
  createCashfreeSession,
  getCashfreePaymentDetails,
};
