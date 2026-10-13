 
const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");

const router = express.Router();

// Format MongoDB documents for the existing React frontend
const formatTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  completed: task.completed,
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
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const newTask = await Task.create({
      title: title.trim(),
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

 
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title is required",
        });
      }

      updates.title = title.trim();
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Completed must be true or false",
        });
      }

      updates.completed = completed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a title or completed value to update",
      });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
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
 