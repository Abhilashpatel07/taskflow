 
const express = require("express");

const router = express.Router();

// Temporary storage for learning.
// Tasks will later be stored in MongoDB.
let tasks = [];
let nextId = 1;

// GET /api/tasks — get all tasks
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    tasks,
  });
});

// POST /api/tasks — create a task
router.post("/", (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Task title is required",
    });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: false,
  };

  tasks.push(newTask);

  res.status(201).json({
    success: true,
    task: newTask,
  });
});

// DELETE /api/tasks/:id — delete a task
router.delete("/:id", (req, res) => {
  const taskId = Number(req.params.id);

  const taskExists = tasks.some((task) => task.id === taskId);

  if (!taskExists) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  tasks = tasks.filter((task) => task.id !== taskId);

  res.status(200).json({
    success: true,
    message: "Task deleted successfully",
  });
});

 // PATCH /api/tasks/:id — update task completion
router.patch("/:id", (req, res) => {
  const taskId = Number(req.params.id);
  const { completed } = req.body;

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  if (typeof completed !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Completed must be true or false",
    });
  }

  task.completed = completed;

  res.status(200).json({
    success: true,
    task,
  });
});


module.exports = router;
