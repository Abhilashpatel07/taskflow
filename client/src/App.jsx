 
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  // Toggle completion in React state for now
   
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

  return (
    <main style={{ fontFamily: "Arial", padding: "30px" }}>
      <h1>TaskFlow</h1>
      <p>Your project management workspace.</p>

      <form onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a task..."
        />
        <button type="submit">Add Task</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>My Tasks ({tasks.length})</h2>

      {loading ? (
        <p>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet. Add your first task!</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id} style={{ marginBottom: "10px" }}>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
              />

              {editingId === task.id ? (
                <>
                  <input
                    value={editingTitle}
                    onChange={(event) =>
                      setEditingTitle(event.target.value)
                    }
                    aria-label="Edit task title"
                  />

                  <button
                    type="button"
                    onClick={() => saveEdit(task.id)}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span
                    style={{
                      margin: "0 10px",
                      textDecoration: task.completed
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {task.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => startEdit(task)}
                  >
                    Edit
                  </button>
                </>
              )}

              <button
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