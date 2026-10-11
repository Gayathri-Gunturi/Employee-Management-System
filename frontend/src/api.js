const BASE_URL = "http://127.0.0.1:5000/api";
const TOKEN_KEY = "ems_token";

// ---- token storage (localStorage can be unavailable, so every call is guarded) ----
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

// App.jsx registers a function here so an expired session sends the user back to login.
let unauthorizedHandler = null;
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// ---- core request helper ----
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(BASE_URL + path, { ...options, headers });
  } catch {
    throw new Error("Cannot reach the server. Is the Flask backend running?");
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    // response had no JSON body
  }

  if (!response.ok || !body || !body.success) {
    // A 401 on a protected call means the token is missing, invalid or expired.
    if (response.status === 401 && token && path !== "/auth/login") {
      clearToken();
      if (unauthorizedHandler) unauthorizedHandler();
    }
    const error = new Error((body && body.error) || "Something went wrong.");
    error.fieldErrors = (body && body.errors) || {};
    error.status = response.status;
    throw error;
  }
  return body.data;
}

// ---- authentication ----
export async function login(username, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  saveToken(data.token);
  return data.user;
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // even if the server call fails, the user still gets logged out locally
  }
  clearToken();
}

export function getCurrentUser() {
  return request("/auth/me");
}

// ---- employees and dashboard ----
export function getEmployees(search = "", department = "") {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (department) params.set("department", department);
  const query = params.toString();
  return request("/employees" + (query ? "?" + query : ""));
}

export function createEmployee(employee) {
  return request("/employees", { method: "POST", body: JSON.stringify(employee) });
}

export function updateEmployee(id, employee) {
  return request(`/employees/${id}`, { method: "PUT", body: JSON.stringify(employee) });
}

export function deleteEmployee(id) {
  return request(`/employees/${id}`, { method: "DELETE" });
}

export function getDashboard() {
  return request("/dashboard");
}
