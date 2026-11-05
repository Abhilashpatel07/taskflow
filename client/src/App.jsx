 import "./App.css";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/tasks";

// Opens the browser calendar when the date field is clicked
function openDatePicker(event) {
  try {
    event.currentTarget.showPicker();
  } catch (err) {
    // showPicker is not supported or was blocked; the native icon still works
  }
}

// Safely read a JSON body (DELETE may return 204 / an empty body)
async function readJson(response) {
  try {
    return await response.json();
  } catch (err) {
    return {};
  }
}

// Support both `id` and MongoDB's `_id`
function getId(task) {
  return task.id ?? task._id;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState("medium");
  const [editingDueDate, setEditingDueDate] = useState("");

  const [filter, setFilter] = useState("all");

  // ==========================================
  // LOAD TASKS
  // ==========================================

  useEffect(() => {
    async function loadTasks() {
      try {
        setError("");
        setLoadFailed(false);

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }

        const data = await readJson(response);

        setTasks(data.tasks || []);
      } catch (err) {
        console.error("Load tasks error:", err);
        setLoadFailed(true);
        setError("Could not connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  // ==========================================
  // CREATE TASK
  // ==========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          priority: priority,
          dueDate: dueDate || null,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setTasks((previousTasks) => [...previousTasks, data.task]);

      // Reset form
      setTitle("");
      setPriority("medium");
      setDueDate("");
    } catch (err) {
      console.error("Create task error:", err);
      setError(err.message || "Could not create task.");
    }
  }

  // ==========================================
  // TOGGLE TASK COMPLETION
  // ==========================================

  async function toggleTask(id) {
    const task = tasks.find((item) => getId(item) === id);

    if (!task) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) => (getId(item) === id ? data.task : item))
      );
    } catch (err) {
      console.error("Toggle task error:", err);
      setError(err.message || "Could not update task.");
    }
  }

  // ==========================================
  // DELETE TASK
  // ==========================================

  async function deleteTask(id) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      // Body may be empty (204), so it is read safely
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => getId(task) !== id)
      );

      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      console.error("Delete task error:", err);
      setError(err.message || "Could not delete task.");
    }
  }

  // ==========================================
  // START EDIT
  // ==========================================

  function startEdit(task) {
    setEditingId(getId(task));
    setEditingTitle(task.title);
    setEditingPriority(task.priority || "medium");

    // Convert ISO date to YYYY-MM-DD for the date input
    setEditingDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");

    setError("");
  }

  // ==========================================
  // SAVE EDIT
  // ==========================================

  async function saveEdit(id) {
    if (!editingTitle.trim()) {
      setError("Task title cannot be empty.");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
          priority: editingPriority,
          dueDate: editingDueDate || null,
        }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to edit task");
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) => (getId(task) === id ? data.task : task))
      );

      cancelEdit();
    } catch (err) {
      console.error("Edit task error:", err);
      setError(err.message || "Could not edit task.");
    }
  }

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
    setEditingPriority("medium");
    setEditingDueDate("");
  }

  // Enter = save, Escape = cancel while editing the title
  function handleEditKeyDown(event, id) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveEdit(id);
    } else if (event.key === "Escape") {
      cancelEdit();
    }
  }

  // ==========================================
  // FORMAT DATE (DD/MM/YYYY)
  // ==========================================

  function formatDueDate(date) {
    if (!date) {
      return "No due date";
    }

    const [year, month, day] = date.substring(0, 10).split("-");

    if (!year || !month || !day) {
      return "No due date";
    }

    return `${day}/${month}/${year}`;
  }

  // ==========================================
  // CHECK OVERDUE
  // ==========================================

  function isOverdue(task) {
    if (!task.dueDate || task.completed) {
      return false;
    }

    // Today's date as YYYY-MM-DD in local time
    const now = new Date();
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    return task.dueDate.substring(0, 10) < today;
  }

  // ==========================================
  // FILTER TASKS
  // ==========================================

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") {
      return !task.completed;
    }

    if (filter === "completed") {
      return task.completed;
    }

    return true;
  });

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(
    (task) => task.priority === "high"
  ).length;

  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="taskflow-container">
      {/* HEADER */}
      <header className="taskflow-header">
        <h1>TaskFlow</h1>
        <p>Your project management workspace.</p>
      </header>

      {/* ADD TASK FORM */}
      <form className="task-form" onSubmit={handleSubmit}>
        <input
          className="task-input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a task..."
          aria-label="Task title"
        />

        <select
          className="priority-select"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
          aria-label="Priority"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <input
          className="due-date-input"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          onClick={openDatePicker}
          aria-label="Due date"
        />

        <button className="add-button" type="submit">
          Add Task
        </button>
      </form>

      {/* ERROR */}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {/* DASHBOARD STATISTICS */}
      <section className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{totalTasks}</p>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <p>{completedTasks}</p>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <p>{pendingTasks}</p>
        </div>

        <div className="stat-card">
          <h3>High Priority</h3>
          <p>{highPriorityTasks}</p>
        </div>

        <div className="progress-card">
          <div className="progress-info">
            <h3>Task Completion</h3>
            <span>{completionPercentage}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div className="filter-container">
        <button
          className={`filter-button ${filter === "all" ? "active" : ""}`}
          type="button"
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          className={`filter-button ${filter === "pending" ? "active" : ""}`}
          type="button"
          onClick={() => setFilter("pending")}
        >
          Pending
        </button>

        <button
          className={`filter-button ${filter === "completed" ? "active" : ""}`}
          type="button"
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
      </div>

      {/* TASK COUNT */}
      <h2 className="task-heading">My Tasks ({filteredTasks.length})</h2>

      {/* LOADING / EMPTY / LIST */}
      {loading ? (
        <p className="loading-message">Loading tasks...</p>
      ) : loadFailed ? null : tasks.length === 0 ? (
        <p className="empty-message">No tasks yet. Add your first task!</p>
      ) : filteredTasks.length === 0 ? (
        <p className="empty-message">No {filter} tasks found.</p>
      ) : (
        <ul className="task-list">
          {filteredTasks.map((task) => {
            const id = getId(task);
            const isEditing = editingId === id;

            return (
              <li className="task-item" key={id}>
                {/* CHECKBOX */}
                <input
                  className="task-checkbox"
                  type="checkbox"
                  checked={Boolean(task.completed)}
                  onChange={() => toggleTask(id)}
                  aria-label={`Mark "${task.title}" as completed`}
                />

                {isEditing ? (
                  /* EDIT MODE */
                  <>
                    <input
                      className="edit-input"
                      type="text"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => handleEditKeyDown(event, id)}
                      aria-label="Edit task title"
                      autoFocus
                    />

                    <select
                      className="priority-select"
                      value={editingPriority}
                      onChange={(event) =>
                        setEditingPriority(event.target.value)
                      }
                      aria-label="Edit priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>

                    <input
                      className="due-date-input"
                      type="date"
                      value={editingDueDate}
                      onChange={(event) =>
                        setEditingDueDate(event.target.value)
                      }
                      onClick={openDatePicker}
                      aria-label="Edit due date"
                    />

                    <button
                      className="save-button"
                      type="button"
                      onClick={() => saveEdit(id)}
                    >
                      Save
                    </button>

                    <button
                      className="cancel-button"
                      type="button"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  /* NORMAL MODE */
                  <>
                    <span
                      className={`task-title ${
                        task.completed ? "completed" : ""
                      }`}
                    >
                      {task.title}
                    </span>

                    <span
                      className={`priority-badge priority-${
                        task.priority || "medium"
                      }`}
                    >
                      {task.priority || "medium"}
                    </span>

                    <span
                      className={`due-date ${isOverdue(task) ? "overdue" : ""}`}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>

                    <button
                      className="edit-button"
                      type="button"
                      onClick={() => startEdit(task)}
                    >
                      Edit
                    </button>
                  </>
                )}

                {/* DELETE */}
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTask(id)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default App;