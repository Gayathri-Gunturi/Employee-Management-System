import { useEffect, useState } from "react";
import {
  clearToken,
  getCurrentUser,
  getToken,
  logout,
  setUnauthorizedHandler,
} from "./api.js";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Login from "./pages/Login.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [sessionNotice, setSessionNotice] = useState("");
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    // If any API call gets a 401, the session is over: go back to the login screen.
    setUnauthorizedHandler(() => {
      setUser(null);
      setSessionNotice("Your session has expired. Please log in again.");
    });

    // On page load, verify a saved token with the backend.
    if (getToken()) {
      getCurrentUser()
        .then(setUser)
        .catch(() => clearToken())
        .finally(() => setChecking(false));
    }
  }, []);

  function handleLogin(loggedInUser) {
    setSessionNotice("");
    setPage("dashboard");
    setUser(loggedInUser);
  }

  async function handleLogout() {
    await logout();
    setSessionNotice("");
    setUser(null);
  }

  if (checking) return <div className="loading">Checking session...</div>;
  if (!user) return <Login onLogin={handleLogin} notice={sessionNotice} />;

  return (
    <div className="app">
      <Sidebar current={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
      <main className="content">
        {page === "dashboard" ? <Dashboard /> : <Employees />}
      </main>
    </div>
  );
}
