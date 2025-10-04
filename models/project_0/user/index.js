const { mongoose, Schema } = require("mongoose");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    fcmToken: {
      type: String,
      default: "",
    },
    apnToken: {
      type: String,
      default: "",
    },
    companies: [
      {
        companyId: {
          type: Schema.Types.ObjectId,
          ref: "Company",
        },
        role: {
          type: String,
          enum: ["admin", "member"],
          default: "member",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
