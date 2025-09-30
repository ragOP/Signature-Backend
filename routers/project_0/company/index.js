const express = require("express");
const router = express.Router();
const Company = require("../../../models/project_0/Company/index");
const User = require("../../../models/project_0/user/index");
const Project = require("../../../models/project_0/projects/index");
const {
  isValidObjectId,
  validateObjectIds,
} = require("../../../utils/validMongoId");

/**
 * @swagger
 * tags:
 *   name: Companies
 *   description: Company management
 */

/**
 * @swagger
 * /company/{id}:
 *   get:
 *     summary: Get companies for a specific user
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch companies for
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        details: "User ID must be a valid MongoDB ObjectId",
      });
    }

    const companies = await Company.find({
      $or: [{ createdBy: userId }, { "users.userId": userId }],
    });

    res.json({
      success: true,
      message: "Companies fetched successfully",
      data: companies,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /company:
 *   post:
 *     summary: Create a new company
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Company name
 *               description:
 *                 type: string
 *                 description: Company description
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the company
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add as members (optional)
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found or some members not found
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  const { name, description, userId, members } = req.body;

  if (!name || !userId) {
    return res.status(400).json({
      success: false,
      message: "Name and userId are required",
    });
  }

  // Validate userId format
  if (!isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
      details: "User ID must be a valid MongoDB ObjectId",
    });
  }

  // Validate members array if provided
  if (members && Array.isArray(members) && members.length > 0) {
    const memberValidation = validateObjectIds(members);
    if (!memberValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID format(s)",
        details: "All member IDs must be valid MongoDB ObjectIds",
        invalidIds: memberValidation.invalidIds,
      });
    }
  }

  try {
    // Validate creator exists
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: "Creator user not found",
      });
    }

    // Validate members if provided
    let validMembers = [];
    if (members && Array.isArray(members) && members.length > 0) {
      const memberUsers = await User.find({ _id: { $in: members } });
      if (memberUsers.length !== members.length) {
        return res.status(404).json({
          success: false,
          message: "Some member users not found",
          details: `Found ${memberUsers.length} out of ${members.length} members`,
        });
      }
      validMembers = memberUsers;
    }

    const newCompany = new Company({
      name,
      description,
      createdBy: userId,
    });

    // Add creator as admin
    newCompany.users.push({ userId: creator._id, role: "admin" });
    creator.companies.push({ companyId: newCompany._id, role: "admin" });

    // Add members if provided
    for (const member of validMembers) {
      // Skip if member is the same as creator (already added as admin)
      if (member._id.toString() !== userId) {
        newCompany.users.push({ userId: member._id, role: "member" });
        member.companies.push({ companyId: newCompany._id, role: "member" });
      }
    }

    await newCompany.save();
    await creator.save();

    // Save all member users
    if (validMembers.length > 0) {
      await User.bulkWrite(
        validMembers.map((member) => ({
          updateOne: {
            filter: { _id: member._id },
            update: { companies: member.companies },
          },
        }))
      );
    }

    // Populate the response with user details
    const populatedCompany = await Company.findById(newCompany._id)
      .populate("createdBy", "fullName email")
      .populate("users.userId", "fullName email");

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: populatedCompany,
    });
  } catch (error) {
    console.error("Error creating company:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /company/{id}:
 *   put:
 *     summary: Update company details
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated company name
 *               description:
 *                 type: string
 *                 description: Updated company description
 *               membersToAdd:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add as members
 *               membersToRemove:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to remove from company
 *               userId:
 *                 type: string
 *                 description: ID of the user making the request (for authorization)
 *     responses:
 *       200:
 *         description: Company updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to update this company
 *       404:
 *         description: Company not found or some users not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", async (req, res) => {
  const { id: companyId } = req.params;
  const { name, description, membersToAdd, membersToRemove, userId } = req.body;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "Company ID is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required for authorization",
    });
  }

  // Validate companyId format
  if (!isValidObjectId(companyId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid company ID format",
      details: "Company ID must be a valid MongoDB ObjectId",
    });
  }

  // Validate userId format
  if (!isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
      details: "User ID must be a valid MongoDB ObjectId",
    });
  }

  // Validate membersToAdd array if provided
  if (membersToAdd && Array.isArray(membersToAdd) && membersToAdd.length > 0) {
    const memberValidation = validateObjectIds(membersToAdd);
    if (!memberValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID format(s) in membersToAdd",
        details: "All member IDs must be valid MongoDB ObjectIds",
        invalidIds: memberValidation.invalidIds,
      });
    }
  }

  // Validate membersToRemove array if provided
  if (
    membersToRemove &&
    Array.isArray(membersToRemove) &&
    membersToRemove.length > 0
  ) {
    const memberValidation = validateObjectIds(membersToRemove);
    if (!memberValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid member ID format(s) in membersToRemove",
        details: "All member IDs must be valid MongoDB ObjectIds",
        invalidIds: memberValidation.invalidIds,
      });
    }
  }

  try {
    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    // Check if user is authorized to update (must be admin)
    const userInCompany = company.users.find(
      (user) => user.userId.toString() === userId && user.role === "admin"
    );

    if (!userInCompany) {
      return res.status(401).json({
        message: "Unauthorized: You must be an admin to update this company",
      });
    }

    // Update basic fields if provided
    if (name !== undefined) company.name = name;
    if (description !== undefined) company.description = description;

    // Handle member additions
    if (
      membersToAdd &&
      Array.isArray(membersToAdd) &&
      membersToAdd.length > 0
    ) {
      // Validate that all users to add exist
      const usersToAdd = await User.find({ _id: { $in: membersToAdd } });
      if (usersToAdd.length !== membersToAdd.length) {
        return res.status(404).json({
          message: "Some users to add not found",
          details: `Found ${usersToAdd.length} out of ${membersToAdd.length} users`,
        });
      }

      // Add new members
      for (const user of usersToAdd) {
        // Check if user is already in company
        const existingMember = company.users.find(
          (member) => member.userId.toString() === user._id.toString()
        );

        if (!existingMember) {
          company.users.push({ userId: user._id, role: "member" });
          user.companies.push({ companyId: company._id, role: "member" });
        }
      }
    }

    // Handle member removals
    if (
      membersToRemove &&
      Array.isArray(membersToRemove) &&
      membersToRemove.length > 0
    ) {
      // Validate that all users to remove exist
      const usersToRemove = await User.find({ _id: { $in: membersToRemove } });
      if (usersToRemove.length !== membersToRemove.length) {
        return res.status(404).json({
          message: "Some users to remove not found",
          details: `Found ${usersToRemove.length} out of ${membersToRemove.length} users`,
        });
      }

      // Remove members (but not admins)
      for (const user of usersToRemove) {
        // Prevent removing the creator
        if (user._id.toString() === company.createdBy.toString()) {
          return res.status(400).json({
            message: "Cannot remove the company creator",
          });
        }

        // Find and remove the user from company
        const memberIndex = company.users.findIndex(
          (member) => member.userId.toString() === user._id.toString()
        );

        if (memberIndex !== -1) {
          // Check if trying to remove an admin
          if (company.users[memberIndex].role === "admin") {
            return res.status(400).json({
              message: "Cannot remove admin users. Change their role first.",
            });
          }

          company.users.splice(memberIndex, 1);

          // Remove company from user's companies array
          user.companies = user.companies.filter(
            (comp) => comp.companyId.toString() !== companyId
          );
        }
      }
    }

    // Save the company
    await company.save();

    // Save all affected users
    const allAffectedUsers = [
      ...(membersToAdd ? await User.find({ _id: { $in: membersToAdd } }) : []),
      ...(membersToRemove
        ? await User.find({ _id: { $in: membersToRemove } })
        : []),
    ];

    if (allAffectedUsers.length > 0) {
      await User.bulkWrite(
        allAffectedUsers.map((user) => ({
          updateOne: {
            filter: { _id: user._id },
            update: { companies: user.companies },
          },
        }))
      );
    }

    // Populate and return updated company
    const updatedCompany = await Company.findById(company._id)
      .populate("createdBy", "fullName email")
      .populate("users.userId", "fullName email");

    res.json({
      success: true,
      message: "Company updated successfully",
      data: updatedCompany,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /company/{id}/projects:
 *   get:
 *     summary: Get all projects for a company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The company ID
 *     responses:
 *       200:
 *         description: A list of projects for the company
 *       500:
 *         description: Internal server error
 */
router.get("/:id/projects", async (req, res) => {
  const companyId = req.params.id;

  if (!companyId) {
    return res.status(400).json({
      success: false,
      message: "Company ID is required",
    });
  }

  if (!isValidObjectId(companyId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid company ID format",
      details: "Company ID must be a valid MongoDB ObjectId",
    });
  }

  try {
    const projects = await Project.find({ companyId: companyId });
    res.json({
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
