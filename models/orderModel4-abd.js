const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    abdOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
    },
    email: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    profession: {
      type: String,
    },
    remarks: {
      type: String,
      default: "",
    },
    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
    },
    additionalProducts: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order4Abd", orderSchema);
