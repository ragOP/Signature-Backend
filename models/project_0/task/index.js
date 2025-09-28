const { mongoose, Schema } = require("mongoose");

const TaskSchema = new Schema(
  {
    // which project
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    // to which user
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    title: {
      type: String,
    },
    description: { type: String },

    eta: {
      type: Date,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", TaskSchema);
