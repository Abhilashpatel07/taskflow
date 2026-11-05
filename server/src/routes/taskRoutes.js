const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Every task route requires login
router.use(protect);

// Only these fields can be changed by the client
const UPDATABLE_FIELDS = ["title", "priority", "dueDate", "completed"];

// GET /api/tasks  (only the logged-in user's tasks)
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ tasks });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Could not load tasks." });
  }
});

// POST /api/tasks
router.post("/", async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      priority,
      dueDate: dueDate || null,
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error("Create task error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ message: err.message || "Could not create task." });
  }
});

// PATCH /api/tasks/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id." });
    }

    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (updates.title !== undefined && !String(updates.title).trim()) {
      return res.status(400).json({ message: "Task title cannot be empty." });
    }

    // Matching on `user` stops people editing other users' tasks
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ task });
  } catch (err) {
    console.error("Update task error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ message: err.message || "Could not update task." });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task id." });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted." });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ message: "Could not delete task." });
  }
});

module.exports = router; 
