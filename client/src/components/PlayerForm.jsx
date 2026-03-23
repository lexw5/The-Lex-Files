import { useEffect, useState } from "react";

const TAG_OPTIONS = ["UMD", "Alumni", "Other"];
const API_BASE = import.meta.env.VITE_API_BASE_URL;

function PlayerForm({ editingPlayer, onPlayerSaved, onCancelEdit, adminCredentials, isAdmin }) {  
  const [name, setName] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editingPlayer) {
      setName(editingPlayer.name || "");
      setSelectedTags(editingPlayer.tags || []);
      setError("");
      setMessage("");
    } else {
      setName("");
      setSelectedTags([]);
    }
  }, [editingPlayer]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const headers = {
      "Content-Type": "application/json"
    };

    const isEditing = !!editingPlayer;


    if (isEditing && isAdmin) {
      headers["x-admin-username"] = adminCredentials.username;
      headers["x-admin-password"] = adminCredentials.password;
    }

    const url = isEditing
      ? `${API_BASE}/api/players/${editingPlayer.id}`
      : `${API_BASE}/api/players`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name,
          tags: selectedTags
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save player.");
      }

      setMessage(
        isEditing ? "Player updated successfully." : "Player created successfully."
      );

      if (!isEditing) {
        setName("");
        setSelectedTags([]);
      }

      if (onPlayerSaved) {
        onPlayerSaved();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: "12px" }}>
        <input
          type="text"
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <strong>Tags</strong>
        <div style={{ marginTop: "8px", display: "grid", gap: "6px" }}>
          {TAG_OPTIONS.map((tag) => (
            <label key={tag}>
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />{" "}
              {tag}
            </label>
          ))}
        </div>
      </div>

      <button type="submit">
        {editingPlayer ? "Save Player" : "Add Player"}
      </button>

      {editingPlayer && (
        <button
          type="button"
          onClick={onCancelEdit}
          style={{ marginLeft: "10px" }}
        >
          Cancel Edit
        </button>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}
    </form>
  );
}

export default PlayerForm;