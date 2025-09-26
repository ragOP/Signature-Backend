const axios = require("axios");

const CASHFREE_URL = "https://sandbox.cashfree.com/pg";

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

    const cartUrl = "https://www.thesignaturestudio.in/confirmation";

    const finalUrl = url ? url : cartUrl;

    let returnUrl = `${finalUrl}?orderId=${orderId}&orderType=${orderType}`;

    const response = await axios.post(
      `${CASHFREE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_001",
          customer_email: "test@example.com",
          customer_phone: "9999999999",
        },
        order_meta: {
          return_url: returnUrl,
          order_type: orderType,
          quantity: quantity,
          additional_products: additionalProducts,
          profession: profession,
          remarks: remarks,
          full_name: fullName,
          email: email,
          phone_number: phoneNumber,
          url: url,
        },
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
    res.status(500).json({ error: "Failed to create session" });
  }
};

const getCashfreePaymentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${CASHFREE_URL}/orders/${id}/payments`, {
      headers: {
        "x-client-id": process.env.CASHFREE_CLIENT_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        Accept: "application/json",
        "x-api-version": "2025-01-01",
      },
    });

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
  CASHFREE_URL,
};
