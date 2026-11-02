// const express = require("express");
// const cors = require("cors");
// const taskRoutes = require("./routes/taskRoutes");

// const app = express();

// app.use(cors({ origin: "http://localhost:5173" }));
// app.use(express.json());
// app.use("/api/tasks", taskRoutes);

// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: "TaskFlow API is running!",
//   });
// });

// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });

// module.exports = app;

const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10kb" }));

// API health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TaskFlow API is running!",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Express error:", error);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
  });
});

module.exports = app;
