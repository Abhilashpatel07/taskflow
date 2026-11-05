 const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "taskflow_token";

// ---------- Token helpers ----------

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------- Core request helper ----------

async function request(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();

  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw new Error("Could not connect to the server.");
  }

  // Body may be empty, so parse safely
  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.status = response.status; // used by App.jsx to detect expired sessions
    throw error;
  }

  return data;
}

// ---------- Auth ----------

export const registerUser = (payload) =>
  request("/auth/register", { method: "POST", body: payload });

export const loginUser = (payload) =>
  request("/auth/login", { method: "POST", body: payload });

export const getCurrentUser = () => request("/auth/me");

// ---------- Tasks ----------

export const getTasks = () => request("/tasks");

export const createTask = (payload) =>
  request("/tasks", { method: "POST", body: payload });

export const updateTask = (id, payload) =>
  request(`/tasks/${id}`, { method: "PATCH", body: payload });

export const deleteTask = (id) =>
  request(`/tasks/${id}`, { method: "DELETE" });