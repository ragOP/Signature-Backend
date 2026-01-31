require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 9005;
const MONGO_URI = process.env.MONGO_URI;
const { connectToDatabase } = require("./config/config");
const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./config/swagger");

connectToDatabase(MONGO_URI);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    data: "Server is running",
  });
});

// ---------------------- Routers -----------------------//

// /api/payment/razorpay
app.use("/api/payment", require("./routers/payment/index"));

// // ------ Astra Soul -----//
// app.use("/api/lander1", require("./routers/lander1/index"));

// // ------ Astra Love -----//
// app.use("/api/lander2", require("./routers/lander2/index"));

// // ----- SoulMate -----//
// app.use("/api/lander3", require("./routers/lander3/index"));

// ---- Signature -----//
app.use("/api/lander4", require("./routers/lander4/index"));

app.use("/api/lander5", require("./routers/lander5/index"));

// ---- Signature Rag -----//
app.use("/api/signature/rag", require("./routers/signature-rag/index"));

// ---- Signature Rag 1 -----//
app.use("/api/signature/rag-v2", require("./routers/signature-rag-1/index"));

app.use("/api/phonepe-v2", require("./routers/phonepeV2/index"));

app.use("/api/lander30", require("./routers/lander30/index"));
app.use("/api/lander90", require("./routers/lander90/index"));
app.use("/api/lander31", require("./routers/lander31/index"));
app.use("/api/lander34", require("./routers/lander34/index"));
app.use("/api/lander41", require("./routers/lander41/index"));

// ---- Project 0 -----// Company
app.use("/api/project-0/auth", require("./routers/project_0/user/index"));
app.use("/api/project-0/company", require("./routers/project_0/company/index"));
app.use("/api/project-0/project", require("./routers/project_0/project/index"));
app.use("/api/project-0/task", require("./routers/project_0/task/index"));
// app.use("/api/project-0/firebase", require("./routers/project_0/firebase/index"));
app.use("/api/auth", require("./routers/auth/index"));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
