const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project 0 API",
      version: "1.0.0",
      description: "API documentation for Project 0",
    },
    servers: [
      {
        // url: "http://localhost:9005/api/project-0",
        url: "https://signature-backend-bm3q.onrender.com/api/project-0",
      },
    ],
  },
  apis: [
    "./routers/project_0/user/*.js",
    "./routers/project_0/company/*.js",
    "./routers/project_0/project/*.js",
    "./routers/project_0/task/*.js",
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
