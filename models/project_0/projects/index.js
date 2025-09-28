const { mongoose, Schema } = require("mongoose");

const projectSchema = new Schema(
  {
    projectName: {
      type: String,
      default: "",
    },
    projectDescription: {
      type: String,
      default: "",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("Project", projectSchema);
