
const API_BASE_URL = "http://localhost:5000/api";

// Store and retrieve JWT token
export const getToken = () => {
  return localStorage.getItem("token");
};

export const setToken = (token) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

// Common API request handler
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
};

// Authentication APIs
export const registerUser = (userData) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginUser = (userData) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getCurrentUser = () => {
  return apiRequest("/auth/me");
};

export const logoutUser = () => {
  removeToken();
};

// Task APIs
export const getTasks = () => {
  return apiRequest("/tasks");
};

export const createTask = (taskData) => {
  return apiRequest("/tasks", {
    method: "POST",
    body: JSON.stringify(taskData),
  });
};

export const updateTask = (id, taskData) => {
  return apiRequest(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(taskData),
  });
};

export const deleteTask = (id) => {
  return apiRequest(`/tasks/${id}`, {
    method: "DELETE",
  });
};
