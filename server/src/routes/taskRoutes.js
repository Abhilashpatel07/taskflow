const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");

const router = express.Router();

// Format MongoDB documents for the existing React frontend
const formatTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  completed: task.completed,
  priority: task.priority,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

// GET /api/tasks — get all tasks
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks: tasks.map(formatTask),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
});

// POST /api/tasks — create a task
router.post("/", async (req, res) => {
  try {
    const { title ,priority} = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }
    const validPriorities = ["low", "medium", "high"];

if (priority !== undefined && !validPriorities.includes(priority)) {
  return res.status(400).json({
    success: false,
    message: "Priority must be low, medium, or high",
  });
} 

  const newTask = await Task.create({
  title: title.trim(),
  priority: priority || "medium",
});
    res.status(201).json({
      success: true,
      task: formatTask(newTask),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
});

// DELETE /api/tasks/:id — delete a task
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});
// PATCH /api/tasks/:id — update a task
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed, priority } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const updates = {};

    // Update title
    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title is required",
        });
      }

      updates.title = title.trim();
    }

    // Update completed
    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Completed must be true or false",
        });
      }

      updates.completed = completed;
    }

    // Update priority
    if (priority !== undefined) {
      const validPriorities = ["low", "medium", "high"];

      if (!validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Priority must be low, medium, or high",
        });
      }

      updates.priority = priority;
    }

    // Make sure something was provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a title, completed value, or priority to update",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task: formatTask(updatedTask),
    });
  } catch (error) {
    console.error("Update task error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

module.exports = router;
 