const { mongoose, Schema } = require("mongoose");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      default: "",
    },
    userName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["Admin", "superAdmin", "dev", "user"],
      default: "user",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
