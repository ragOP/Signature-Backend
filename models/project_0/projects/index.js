const { mongoose, Schema } = require("mongoose");

const projectSchema = new Schema(
  {
    projectName: {
      type: String,
      required: true,
    },
    projectDescription: {
      type: String,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
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