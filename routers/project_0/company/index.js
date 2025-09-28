const express = require("express");
const router = express.Router();

const companyModel = require("../../../models/project_0/Company/index");

//Post - create company
router.post("/create-company", async (req, res) => {
  try {
    const { name, description, createdBy } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Company name is required" });
    }
    const existing = await companyModel.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Company already exists" });
    }
    const data = await companyModel.create({
      name,
      description,
      createdBy,
    });
    if (!data) {
      return res.status(500).json({ message: "Failed to create company" });
    }
    return res.status(201).json({ message: "Company created", data });
  } catch (error) {
    return res.status(500).json({ message: "Internal server " });
  }
});
//Get - get all comopanies
router.get("/get-companies", async (req, res) => {
  try {
    const companies = await companyModel.find({}).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ message: "Companies fetched", data: companies });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
