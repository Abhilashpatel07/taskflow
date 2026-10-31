// const express = require("express");
// const mongoose = require("mongoose");
// const Task = require("../models/Task");

// const router = express.Router();

// // Format MongoDB documents for the existing React frontend
// const formatTask = (task) => ({
//   id: task._id.toString(),
//   title: task.title,
//   completed: task.completed,
//   priority: task.priority,
//   dueDate: task.dueDate,
//   createdAt: task.createdAt,
//   updatedAt: task.updatedAt,
// });

// // GET /api/tasks — get all tasks
// router.get("/", async (req, res) => {
//   try {
//     const tasks = await Task.find().sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       tasks: tasks.map(formatTask),
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch tasks",
//     });
//   }
// });

// // POST /api/tasks — create a task
// router.post("/", async (req, res) => {
//   try {
//     const { title ,priority, dueDate } = req.body;

//     if (typeof title !== "string" || !title.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Task title is required",
//       });
//     }
//     const validPriorities = ["low", "medium", "high"];

// if (priority !== undefined && !validPriorities.includes(priority)) {
//   return res.status(400).json({
//     success: false,
//     message: "Priority must be low, medium, or high",
//   });
// } 

//   const newTask = await Task.create({
//   title: title.trim(),
//   priority: priority || "medium",
//   dueDate: dueDate || null,
// });
//     res.status(201).json({
//       success: true,
//       task: formatTask(newTask),
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to create task",
//     });
//   }
// });

// // DELETE /api/tasks/:id — delete a task
// router.delete("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid task ID",
//       });
//     }

//     const deletedTask = await Task.findByIdAndDelete(id);

//     if (!deletedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Task deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to delete task",
//     });
//   }
// });
// // PATCH /api/tasks/:id — update a task
// router.patch("/:id", async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { title, completed, priority, dueDate } = req.body;

//     if (!mongoose.isValidObjectId(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid task ID",
//       });
//     }

//     const updates = {};

//     // Update title
//     if (title !== undefined) {
//       if (typeof title !== "string" || !title.trim()) {
//         return res.status(400).json({
//           success: false,
//           message: "Task title is required",
//         });
//       }

//       updates.title = title.trim();
//     }

//     // Update completed
//     if (completed !== undefined) {
//       if (typeof completed !== "boolean") {
//         return res.status(400).json({
//           success: false,
//           message: "Completed must be true or false",
//         });
//       }

//       updates.completed = completed;
//     }

//     // Update priority
//     if (priority !== undefined) {
//       const validPriorities = ["low", "medium", "high"];

//       if (!validPriorities.includes(priority)) {
//         return res.status(400).json({
//           success: false,
//           message: "Priority must be low, medium, or high",
//         });
//       }

//       updates.priority = priority;
//     }
//      // Update due date
// if (dueDate !== undefined) {
//   if (dueDate !== null && isNaN(Date.parse(dueDate))) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid due date",
//     });
//   }

//   updates.dueDate = dueDate;
// }
//     // Make sure something was provided
//     if (Object.keys(updates).length === 0) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Provide a title, completed value, priority, or due date to update",
//       });
//     }

//     const updatedTask = await Task.findByIdAndUpdate(
//       id,
//       { $set: updates },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!updatedTask) {
//       return res.status(404).json({
//         success: false,
//         message: "Task not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       task: formatTask(updatedTask),
//     });
//   } catch (error) {
//     console.error("Update task error:", error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to update task",
//     });
//   }
// });

// module.exports = router;
 
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

// All task routes require login
router.use(authMiddleware);

// Format MongoDB task for frontend
const formatTask = (task) => ({
  id: task._id.toString(),
  title: task.title,
  completed: task.completed,
  priority: task.priority,
  dueDate: task.dueDate
    ? task.dueDate.toISOString().slice(0, 10)
    : "",
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

// GET ALL TASKS FOR LOGGED-IN USER
router.get("/", async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      tasks: tasks.map(formatTask),
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch tasks.",
    });
  }
});

// CREATE TASK
router.post("/", async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({
        success: false,
        message: "Task title cannot exceed 200 characters.",
      });
    }

    const selectedPriority = priority || "medium";

    if (!["low", "medium", "high"].includes(selectedPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority.",
      });
    }

    let parsedDueDate = null;

    if (dueDate) {
      if (
        typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
        !Number.isFinite(Date.parse(`${dueDate}T00:00:00.000Z`)) ||
        new Date(`${dueDate}T00:00:00.000Z`)
          .toISOString()
          .slice(0, 10) !== dueDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid due date.",
        });
      }

      parsedDueDate = new Date(`${dueDate}T00:00:00.000Z`);
    }

    const task = await Task.create({
      title: title.trim(),
      priority: selectedPriority,
      dueDate: parsedDueDate,
      user: req.userId,
    });

    return res.status(201).json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create task.",
    });
  }
});

// UPDATE TASK
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const allowedFields = ["title", "completed", "priority", "dueDate"];
    const updates = {};
    const suppliedFields = Object.keys(req.body);

    if (
      suppliedFields.length === 0 ||
      suppliedFields.some((field) => !allowedFields.includes(field))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid task update.",
      });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "title")) {
      if (
        typeof req.body.title !== "string" ||
        !req.body.title.trim() ||
        req.body.title.trim().length > 200
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid task title.",
        });
      }

      updates.title = req.body.title.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "completed")) {
      if (typeof req.body.completed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Completed must be true or false.",
        });
      }

      updates.completed = req.body.completed;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "priority")) {
      if (!["low", "medium", "high"].includes(req.body.priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority.",
        });
      }

      updates.priority = req.body.priority;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "dueDate")) {
      if (req.body.dueDate === "" || req.body.dueDate === null) {
        updates.dueDate = null;
      } else {
        const date = req.body.dueDate;

        if (
          typeof date !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(`${date}T00:00:00.000Z`)) ||
          new Date(`${date}T00:00:00.000Z`)
            .toISOString()
            .slice(0, 10) !== date
        ) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid due date.",
          });
        }

        updates.dueDate = new Date(`${date}T00:00:00.000Z`);
      }
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        user: req.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update task.",
    });
  }
});

// DELETE TASK
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      user: req.userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully.",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not delete task.",
    });
  }
});

module.exports = router;
