import { Link, Routes, Route } from "react-router-dom";
import { useState } from "react";
import LeaderboardPage from "./pages/LeaderboardPage";
import GamesPage from "./pages/GamesPage";
import AdminPage from "./pages/AdminPage";
import PlayersPage from "./pages/PlayersPage";

function App() {
  const [adminCredentials, setAdminCredentials] = useState(() => {
    const saved = localStorage.getItem("adminCredentials");
    return saved ? JSON.parse(saved) : null;
  });

  const isAdmin = !!adminCredentials;

  const handleLogin = (creds) => {
    setAdminCredentials(creds);
    localStorage.setItem("adminCredentials", JSON.stringify(creds));
  };

  const handleLogout = () => {
    setAdminCredentials(null);
    localStorage.removeItem("adminCredentials");
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      {isAdmin && (
        <span style={{ color: "green" }}>Admin Mode</span>
      )}
      <nav
        style={{
          display: "flex",
          gap: "16px",
          padding: "16px 20px",
          borderBottom: "1px solid #ccc",
          marginBottom: "20px"
        }}
        
      >
        <Link to="/">Leaderboard</Link>
        <Link to="/games">Games</Link>
        <Link to="/players">Players</Link>
        <Link to="/admin">{isAdmin ? "Admin" : "Admin Login"}</Link>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 20px 20px" }}>
        <Routes>
          <Route path="/" element={<LeaderboardPage />} />
          <Route
            path="/games"
            element={
              <GamesPage
                isAdmin={isAdmin}
                adminCredentials={adminCredentials}
              />
            }
          />
          <Route
            path="/players"
            element={
              <PlayersPage
                isAdmin={isAdmin}
                adminCredentials={adminCredentials}
              />
            }
          />
          <Route
            path="/admin"
            element={
              <AdminPage
                isAdmin={isAdmin}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;