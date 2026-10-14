 import "./App.css";
 import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [filter, setFilter] = useState("all");

  // Load tasks from the backend when the page opens
  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Failed to load tasks");
        }

        const data = await response.json();
        setTasks(data.tasks);
      } catch (err) {
        setError("Could not connect to the backend.");
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, []);

  // Create a task through the API
  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setTasks((previousTasks) => [
        ...previousTasks,
        data.task,
      ]);

      setTitle("");
    } catch (err) {
      setError(err.message || "Could not create task.");
    }
  }

  // Toggle task completion
  async function toggleTask(id) {
    const task = tasks.find((task) => task.id === id);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setTasks((previousTasks) =>
        previousTasks.map((item) =>
          item.id === id ? data.task : item
        )
      );
    } catch (err) {
      setError(err.message || "Could not update task.");
    }
  }

  // Delete a task
  async function deleteTask(id) {
    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setEditingTitle("");
      }
    } catch (err) {
      setError(err.message || "Could not delete task.");
    }
  }

  // Start editing a task
  function startEdit(task) {
    setEditingId(task.id);
    setEditingTitle(task.title);
    setError("");
  }

  // Save the edited title
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to edit task");
      }

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === id ? data.task : task
        )
      );

      setEditingId(null);
      setEditingTitle("");
    } catch (err) {
      setError(err.message || "Could not edit task.");
    }
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
    setError("");
  }

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
const totalTasks = tasks.length;

const completedTasks = tasks.filter(
  (task) => task.completed
).length;

const pendingTasks = tasks.filter(
  (task) => !task.completed
).length;  
    if (filter === "pending") {
      return !task.completed;
    }

    if (filter === "completed") {
      return task.completed;
    }

    return true;
  });
return (
  <main className="taskflow-container">
    <header className="taskflow-header">
      <h1>TaskFlow</h1>
      <p>Your project management workspace.</p>
    </header>

    {/* Add Task Form */}
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        className="task-input"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Enter a task..."
      />

      <button className="add-button" type="submit">
        Add Task
      </button>
    </form>

    {/* Error Message */}
    {error && <p className="error-message">{error}</p>}

    {/* Day 7 Filters */}
    <div className="filter-container">
      <button
        className={`filter-button ${
          filter === "all" ? "active" : ""
        }`}
        type="button"
        onClick={() => setFilter("all")}
      >
        All
      </button>

      <button
        className={`filter-button ${
          filter === "pending" ? "active" : ""
        }`}
        type="button"
        onClick={() => setFilter("pending")}
      >
        Pending
      </button>

      <button
        className={`filter-button ${
          filter === "completed" ? "active" : ""
        }`}
        type="button"
        onClick={() => setFilter("completed")}
      >
        Completed
      </button>
    </div>

    {/* Task Count */}
    <h2 className="task-heading">
      My Tasks ({filteredTasks.length})
    </h2>

    {loading ? (
      <p className="loading-message">Loading tasks...</p>
    ) : tasks.length === 0 ? (
      <p className="empty-message">
        No tasks yet. Add your first task!
      </p>
    ) : filteredTasks.length === 0 ? (
      <p className="empty-message">
        No {filter} tasks found.
      </p>
    ) : (
      <ul className="task-list">
        {filteredTasks.map((task) => (
          <li className="task-item" key={task.id}>
            {/* Completion Checkbox */}
            <input
              className="task-checkbox"
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task.id)}
            />

            {/* Edit Mode */}
            {editingId === task.id ? (
              <>
                <input
                  className="edit-input"
                  value={editingTitle}
                  onChange={(event) =>
                    setEditingTitle(event.target.value)
                  }
                  aria-label="Edit task title"
                />

                <button
                  className="save-button"
                  type="button"
                  onClick={() => saveEdit(task.id)}
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
              <>
                {/* Task Title */}
                <span
                  className={`task-title ${
                    task.completed ? "completed" : ""
                  }`}
                >
                  {task.title}
                </span>

                {/* Edit Button */}
                <button
                  className="edit-button"
                  type="button"
                  onClick={() => startEdit(task)}
                >
                  Edit
                </button>
              </>
            )}

            {/* Delete Button */}
            <button
              className="delete-button"
              type="button"
              onClick={() => deleteTask(task.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    )}
  </main>
);
}
export default App;
