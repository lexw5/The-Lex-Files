import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function AdminPage({ isAdmin, onLogin, onLogout }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      onLogin({ username, password });
      setMessage("Logged in as admin.");
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (isAdmin) {
    return (
      <div>
        <h1>Admin</h1>
        <p style={{ color: "green" }}>You are logged in as admin.</p>
        <button onClick={onLogout}>Log Out</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin Login</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px", maxWidth: "320px" }}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Log In</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}

export default AdminPage;