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
 
 function App() {
   const [tasks, setTasks] = useState([]);
   const [title, setTitle] = useState("");
   const [priority, setPriority] = useState("medium");
   const [dueDate, setDueDate] = useState("");
 
   const [loading, setLoading] = useState(true);
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
 
         const response = await fetch(API_URL);
 
         if (!response.ok) {
           throw new Error("Failed to load tasks");
         }
 
         const data = await response.json();
 
         setTasks(data.tasks || []);
       } catch (err) {
         console.error("Load tasks error:", err);
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
 
       const data = await response.json();
 
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
     const task = tasks.find((item) => item.id === id);
 
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
         previousTasks.map((item) => (item.id === id ? data.task : item))
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
 
       const data = await response.json();
 
       if (!response.ok) {
         throw new Error(data.message || "Failed to delete task");
       }
 
       setTasks((previousTasks) =>
         previousTasks.filter((task) => task.id !== id)
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
     setEditingId(task.id);
     setEditingTitle(task.title);
     setEditingPriority(task.priority || "medium");
 
     // Convert MongoDB date to YYYY-MM-DD for the date input
     if (task.dueDate) {
       setEditingDueDate(task.dueDate.substring(0, 10));
     } else {
       setEditingDueDate("");
     }
 
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
 
       const data = await response.json();
 
       if (!response.ok) {
         throw new Error(data.message || "Failed to edit task");
       }
 
       setTasks((previousTasks) =>
         previousTasks.map((task) => (task.id === id ? data.task : task))
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
 
   // ==========================================
   // FORMAT DATE (DD/MM/YYYY)
   // ==========================================
 
   function formatDueDate(date) {
     if (!date) {
       return "No due date";
     }
 
     const dateOnly = date.substring(0, 10);
     const [year, month, day] = dateOnly.split("-");
 
     return `${day}/${month}/${year}`;
   }
 
   // ==========================================
   // CHECK OVERDUE
   // ==========================================
 
   function isOverdue(task) {
     if (!task.dueDate || task.completed) {
       return false;
     }
 
     // Build today's date as YYYY-MM-DD using local time
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
   // UI
   // ==========================================
 
   return (
     <main className="taskflow-container">
       {/* HEADER */}
       <header className="taskflow-header">
         <h1>TaskFlow</h1>
         <p>Your project management workspace.</p>
       </header>
 
       {/* ======================================
           ADD TASK FORM
       ====================================== */}
 
       <form className="task-form" onSubmit={handleSubmit}>
         {/* Task title */}
         <input
           className="task-input"
           type="text"
           value={title}
           onChange={(event) => setTitle(event.target.value)}
           placeholder="Enter a task..."
         />
 
         {/* Priority */}
         <select
           className="priority-select"
           value={priority}
           onChange={(event) => setPriority(event.target.value)}
         >
           <option value="low">Low</option>
           <option value="medium">Medium</option>
           <option value="high">High</option>
         </select>
 
         {/* Due date (opens calendar on click) */}
         <input
           className="due-date-input"
           type="date"
           value={dueDate}
           onChange={(event) => setDueDate(event.target.value)}
           onClick={openDatePicker}
           aria-label="Due date"
         />
 
         {/* Add button */}
         <button className="add-button" type="submit">
           Add Task
         </button>
       </form>
 
       {/* ERROR */}
       {error && <p className="error-message">{error}</p>}
 
       {/* ======================================
           FILTERS
       ====================================== */}
 
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
 
       {/* ======================================
           LOADING / EMPTY / LIST
       ====================================== */}
 
       {loading ? (
         <p className="loading-message">Loading tasks...</p>
       ) : tasks.length === 0 ? (
         <p className="empty-message">No tasks yet. Add your first task!</p>
       ) : filteredTasks.length === 0 ? (
         <p className="empty-message">No {filter} tasks found.</p>
       ) : (
         <ul className="task-list">
           {filteredTasks.map((task) => (
             <li className="task-item" key={task.id}>
               {/* CHECKBOX */}
               <input
                 className="task-checkbox"
                 type="checkbox"
                 checked={task.completed}
                 onChange={() => toggleTask(task.id)}
               />
 
               {editingId === task.id ? (
                 /* =================================
                    EDIT MODE
                 ================================= */
                 <>
                   {/* Edit title */}
                   <input
                     className="edit-input"
                     type="text"
                     value={editingTitle}
                     onChange={(event) => setEditingTitle(event.target.value)}
                     aria-label="Edit task title"
                   />
 
                   {/* Edit priority */}
                   <select
                     className="priority-select"
                     value={editingPriority}
                     onChange={(event) => setEditingPriority(event.target.value)}
                   >
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                   </select>
 
                   {/* Edit due date (opens calendar on click) */}
                   <input
                     className="due-date-input"
                     type="date"
                     value={editingDueDate}
                     onChange={(event) => setEditingDueDate(event.target.value)}
                     onClick={openDatePicker}
                     aria-label="Edit due date"
                   />
 
                   {/* Save */}
                   <button
                     className="save-button"
                     type="button"
                     onClick={() => saveEdit(task.id)}
                   >
                     Save
                   </button>
 
                   {/* Cancel */}
                   <button
                     className="cancel-button"
                     type="button"
                     onClick={cancelEdit}
                   >
                     Cancel
                   </button>
                 </>
               ) : (
                 /* =================================
                    NORMAL MODE
                 ================================= */
                 <>
                   {/* TASK TITLE */}
                   <span
                     className={`task-title ${task.completed ? "completed" : ""}`}
                   >
                     {task.title}
                   </span>
 
                   {/* PRIORITY */}
                   <span className={`priority-badge priority-${task.priority}`}>
                     {task.priority}
                   </span>
 
                   {/* DUE DATE */}
                   <span className={`due-date ${isOverdue(task) ? "overdue" : ""}`}>
                     {formatDueDate(task.dueDate)}
                   </span>
 
                   {/* EDIT */}
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
 