const express = require("express");
const router = express.Router();
const Project = require("../../../models/project_0/projects/index");
const Task = require("../../../models/project_0/task/index");
const Company = require("../../../models/project_0/Company/index");
const User = require("../../../models/project_0/user/index");
const {
  isValidObjectId,
  validateObjectIds,
} = require("../../../utils/validMongoId");

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * /project:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - companyId
 *               - userId
 *             properties:
 *               projectName:
 *                 type: string
 *                 description: Name of the project
 *               projectDescription:
 *                 type: string
 *                 description: Description of the project
 *               companyId:
 *                 type: string
 *                 description: ID of the company
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs to add as members (optional)
 *               userId:
 *                 type: string
 *                 description: ID of the user creating the project (for authorization)
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to create projects in this company
 *       404:
 *         description: Company not found or some members not found
 *       500:
 *         description: Internal server error
 */
router.post("/", async (req, res) => {
  const {
    projectName,
    projectDescription,
    companyId,
    members = [],
    userId,
  } = req.body;

  if (!projectName || !companyId || !userId) {
    return res.status(400).json({
      success: false,
      message: "projectName, companyId, and userId are required",
    });
  }

  // Validate ObjectId formats
  if (!isValidObjectId(companyId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid company ID format",
      details: "Company ID must be a valid MongoDB ObjectId",
    });
  }

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
    // Run queries in parallel
    const [existingProject, company, user] = await Promise.all([
      Project.findOne({ projectName, companyId }),
      Company.findById(companyId),
      User.findById(userId),
    ]);

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: "Project name already exists in this company",
      });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user is authorized to create projects in this company
    const userInCompany = company.users.find(
      (member) => member.userId.toString() === userId
    );

    if (!userInCompany) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: You must be a member of this company to create projects",
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

    // Create project
    const newProject = await Project.create({
      projectName,
      projectDescription,
      companyId,
      members: validMembers.map((member) => member._id),
    });

    // Populate the response with user and company details
    const populatedProject = await Project.findById(newProject._id)
      .populate("companyId", "name description")
      .populate("members", "fullName email");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: populatedProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /project/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *                 description: Updated project name
 *               projectDescription:
 *                 type: string
 *                 description: Updated project description
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Updated array of member user IDs
 *               userId:
 *                 type: string
 *                 description: ID of the user making the request (for authorization)
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to update this project
 *       404:
 *         description: Project not found or some members not found
 *       500:
 *         description: Internal server error
 */
router.put("/:id", async (req, res) => {
  const { id: projectId } = req.params;
  const { projectName, projectDescription, members, userId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required for authorization",
    });
  }

  // Validate ObjectId formats
  if (!isValidObjectId(projectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID format",
      details: "Project ID must be a valid MongoDB ObjectId",
    });
  }

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
    // Find the project
    const project = await Project.findById(projectId).populate("companyId");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is authorized to update this project
    const company = project.companyId;
    const userInCompany = company.users.find(
      (member) => member.userId.toString() === userId
    );

    if (!userInCompany) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: You must be a member of this company to update projects",
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

    // Update project
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        ...(projectName && { projectName }),
        ...(projectDescription !== undefined && { projectDescription }),
        ...(members && { members: validMembers.map((member) => member._id) }),
      },
      { new: true, runValidators: true }
    )
      .populate("companyId", "name description")
      .populate("members", "fullName email");

    res.json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /project/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user making the request (for authorization)
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to delete this project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", async (req, res) => {
  const { id: projectId } = req.params;
  const { userId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required for authorization",
    });
  }

  // Validate ObjectId formats
  if (!isValidObjectId(projectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID format",
      details: "Project ID must be a valid MongoDB ObjectId",
    });
  }

  if (!isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
      details: "User ID must be a valid MongoDB ObjectId",
    });
  }

  try {
    // Find the project with company details
    const project = await Project.findById(projectId).populate("companyId");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is authorized to delete this project (must be company admin)
    const company = project.companyId;
    const userInCompany = company.users.find(
      (member) => member.userId.toString() === userId && member.role === "admin"
    );

    if (!userInCompany) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: You must be an admin of this company to delete projects",
      });
    }

    // Delete the project
    await Project.findByIdAndDelete(projectId);

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /project/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID for authorization
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to view this project
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", async (req, res) => {
  const { id: projectId } = req.params;
  const { userId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required for authorization",
    });
  }

  // Validate ObjectId formats
  if (!isValidObjectId(projectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID format",
      details: "Project ID must be a valid MongoDB ObjectId",
    });
  }

  if (!isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
      details: "User ID must be a valid MongoDB ObjectId",
    });
  }

  try {
    // Check if project exists and user has access
    const project = await Project.findById(projectId)
      .populate("companyId", "name description")
      .populate("members", "fullName email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is authorized to view this project (must be company member)
    const company = project.companyId;
    const userInCompany = company.users.find(
      (member) => member.userId.toString() === userId
    );

    if (!userInCompany) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: You must be a member of this company to view this project",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project fetched successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /project/tasks/{id}:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The project ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID for authorization
 *     responses:
 *       200:
 *         description: A list of tasks for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized - user not authorized to view this project's tasks
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get("/tasks/:id", async (req, res) => {
  const projectId = req.params.id;
  const { userId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "Project ID is required",
    });
  }

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required for authorization",
    });
  }

  // Validate ObjectId formats
  if (!isValidObjectId(projectId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID format",
      details: "Project ID must be a valid MongoDB ObjectId",
    });
  }

  if (!isValidObjectId(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format",
      details: "User ID must be a valid MongoDB ObjectId",
    });
  }

  try {
    // Check if project exists and user has access
    const project = await Project.findById(projectId).populate("companyId");
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user is authorized to view tasks (must be company member)
    const company = project.companyId;
    const userInCompany = company.users.find(
      (member) => member.userId.toString() === userId
    );

    if (!userInCompany) {
      return res.status(401).json({
        success: false,
        message:
          "Unauthorized: You must be a member of this company to view project tasks",
      });
    }

    const tasks = await Task.find({ projectId })
      .populate("assignedTo", "fullName email") // get assigned user details
      .populate("createdBy", "fullName email"); // get creator details

    res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
