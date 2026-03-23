import { useEffect, useState } from "react";
import PlayerForm from "../components/PlayerForm";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function PlayersPage({ isAdmin, adminCredentials }) {  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    if (!isAdmin) {
        setEditingPlayer(null);
    }
  }, [isAdmin]);

  const handleEditPlayer = (player) => {
    setError("");
    setMessage("");
    setEditingPlayer(player);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlayerSaved = async () => {
    setEditingPlayer(null);
    setError("");
    setMessage("Player saved successfully.");
    await fetchPlayers();
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
  };

  const handleDeletePlayer = async (playerId) => {
    const confirmed = window.confirm("Delete this player?");
    if (!confirmed) return;
    if (!isAdmin) return;

    setError("");
    setMessage("");

    if (editingPlayer && editingPlayer.id === playerId) {
      setEditingPlayer(null);
    }

    try {
      const response = await fetch(`${API_BASE}/api/players/${playerId}`, {
        method: "DELETE",
        headers: {
            "x-admin-username": adminCredentials.username,
            "x-admin-password": adminCredentials.password
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete player.");
      }

      setMessage("Player deleted successfully.");
      await fetchPlayers();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Players</h1>

      <section style={{ marginBottom: "24px" }}>
        <h2>
            {isAdmin
            ? editingPlayer
                ? `Edit ${editingPlayer.name}`
                : "Add Player"
            : "Add Player"}
        </h2>
        <PlayerForm
            editingPlayer={isAdmin ? editingPlayer : null}
            onPlayerSaved={handlePlayerSaved}
            onCancelEdit={handleCancelEdit}
            adminCredentials={adminCredentials}
            isAdmin={isAdmin}
        />
      </section>

      <section>
        <h2>All Players</h2>
    
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}

        <div style={{ marginBottom: "12px" }}>
            <label>
                <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={() => setShowActiveOnly((prev) => !prev)}
                />
                {" "}Show Active Players Only
            </label>
        </div>

        {loading ? (
          <p>Loading players...</p>
        ) : (
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>ELO</th>
                    <th>Games</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Status</th>
                    <th>Tags</th>
                    <th>Offset</th>
                    {isAdmin && <th>Actions</th>}
                </tr>
            </thead>
            <tbody>
                {players
                    .filter((player) => !showActiveOnly || player.active)
                    .sort((a, b) => (b.elo + (b.manual_offset ?? 0)) - (a.elo + (a.manual_offset ?? 0)))
                    .map((player, index) => (
                    <tr key={player.id}>
                        <td>{index + 1}</td>
                        <td>{player.name}</td>
                        <td>{player.elo + (player.manual_offset ?? 0)}</td>
                        <td>{player.games_played}</td>
                        <td>{player.wins}</td>
                        <td>{player.losses}</td>
                        <td>{player.active ? "Active" : "Inactive"}</td>
                        <td>
                        {player.tags && player.tags.length > 0
                            ? player.tags.join(", ")
                            : "—"}
                        </td>
                        <td>{player.manual_offset}</td>
                        {isAdmin && (
                        <td>
                            <button onClick={() => handleEditPlayer(player)}>Edit</button>
                            <button
                            onClick={() => handleDeletePlayer(player.id)}
                            style={{ marginLeft: "10px" }}
                            >
                            Delete
                            </button>
                        </td>
                        )}
                    </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default PlayersPage;