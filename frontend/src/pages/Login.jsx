import { useState } from "react";
import { login } from "../api.js";
import Message from "../components/Message.jsx";

export default function Login({ onLogin, notice }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!username.trim()) found.username = "Username is required.";
    if (!password) found.password = "Password is required.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      onLogin(user);
    } catch (err) {
      const fieldErrors = err.fieldErrors || {};
      setErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: err.message });
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>Employee Management System</h1>
        <p className="muted login-subtitle">Sign in to continue</p>

        {notice && <Message type="error" text={notice} />}
        {errors.form && <Message type="error" text={errors.form} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              autoComplete="username"
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>
          <button type="submit" className="btn btn-primary login-button" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="muted login-hint">Demo account: admin / admin123</p>
      </div>
    </div>
  );
}
