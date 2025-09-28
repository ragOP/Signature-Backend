const { mongoose, Schema } = require("mongoose");

const role = new Schema(
  {
    companyName: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

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
    roles: [role],
    companyIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Company",
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
