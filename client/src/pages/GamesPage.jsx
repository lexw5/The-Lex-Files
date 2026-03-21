import { useEffect, useState } from "react";
import GameForm from "../components/GameForm";
import RecentGamesList from "../components/RecentGamesList";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function GamesPage({ isAdmin, adminCredentials }) {  
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  const emptyGameForm = {
    team1_player1_id: "",
    team1_player2_id: "",
    team2_player1_id: "",
    team2_player2_id: "",
    team1_score: "",
    team2_score: ""
  };

  const [formData, setFormData] = useState(emptyGameForm);
  const [editingGameId, setEditingGameId] = useState(null);

  const fetchPlayers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/players`);
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      const data = await response.json();
      setPlayers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/games`);
      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.status}`);
      }
      const data = await response.json();
      setGames(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGames(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
        setEditingGameId(null);
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    setSubmitMessage("");
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData(emptyGameForm);
    setEditingGameId(null);
  };

  const handleSubmitGame = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitMessage("");

    const method = editingGameId ? "PUT" : "POST";
    const url = editingGameId
      ? `${API_BASE}/api/games/${editingGameId}`
      : `${API_BASE}/api/games`;

    const headers = {
    "Content-Type": "application/json"
    };

    if (editingGameId && isAdmin) {
    headers["x-admin-username"] = adminCredentials.username;
    headers["x-admin-password"] = adminCredentials.password;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          team1_player1_id: Number(formData.team1_player1_id),
          team1_player2_id: Number(formData.team1_player2_id),
          team2_player1_id: Number(formData.team2_player1_id),
          team2_player2_id: Number(formData.team2_player2_id),
          team1_score: Number(formData.team1_score),
          team2_score: Number(formData.team2_score)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Request failed.");
      }

      setSubmitMessage(
        editingGameId ? "Game updated successfully." : "Game added successfully."
      );

      resetForm();
      await fetchPlayers();
      await fetchGames();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteGame = async (gameId) => {
    const confirmed = window.confirm("Delete this game?");
    if (!confirmed) return;
    if (!isAdmin) return;

    setError("");
    setSubmitMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/games/${gameId}`, {
        method: "DELETE",
        headers: {
            "x-admin-username": adminCredentials.username,
            "x-admin-password": adminCredentials.password
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete game.");
      }

      if (editingGameId === gameId) {
        resetForm();
      }

      setSubmitMessage("Game deleted successfully.");
      await fetchPlayers();
      await fetchGames();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditGame = (game) => {
    if (!isAdmin) return;

    
    setError("");
    setSubmitMessage("");
    setEditingGameId(game.id);
    setFormData({
      team1_player1_id: String(game.team1_player1_id),
      team1_player2_id: String(game.team1_player2_id),
      team2_player1_id: String(game.team2_player1_id),
      team2_player2_id: String(game.team2_player2_id),
      team1_score: String(game.team1_score),
      team2_score: String(game.team2_score)
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <h1>Games</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {submitMessage && <p style={{ color: "green" }}>{submitMessage}</p>}

      <section style={{ marginBottom: "32px" }}>
        <h2>{editingGameId ? `Edit Game #${editingGameId}` : "Add Game"}</h2>
        <GameForm
          players={players}
          formData={formData}
          editingGameId={editingGameId}
          onChange={handleChange}
          onSubmit={handleSubmitGame}
          onCancel={resetForm}
        />
      </section>

      <section>
        <h2>All Games</h2>
        <RecentGamesList
          games={games}
          loading={loadingGames || loadingPlayers}
          onEdit={handleEditGame}
          onDelete={handleDeleteGame}
          showActions={isAdmin}
        />
      </section>
    </div>
  );
}

export default GamesPage;