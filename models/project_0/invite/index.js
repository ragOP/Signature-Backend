const { mongoose, Schema } = require("mongoose");

const inviteSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invite", inviteSchema);
