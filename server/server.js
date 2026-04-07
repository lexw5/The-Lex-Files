import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import supabase from "./supabaseClient.js";
import { recalculateAllStats } from "./recalculateStats.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    }
  })
);

app.use(express.json());

function requireAdmin(req, res, next) {
  const adminUser = req.headers["x-admin-username"];
  const adminPass = req.headers["x-admin-password"];

  if (adminUser === ADMIN_USERNAME && adminPass === ADMIN_PASSWORD) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized admin action." });
}

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  return res.status(401).json({ error: "Invalid username or password." });
});

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

app.get("/api/players", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("elo", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/api/games", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("games")
      .select(`
        id,
        team1_player1_id,
        team1_player2_id,
        team2_player1_id,
        team2_player2_id,
        team1_score,
        team2_score,
        created_at,
        team1_player1:team1_player1_id(name),
        team1_player2:team1_player2_id(name),
        team2_player1:team2_player1_id(name),
        team2_player2:team2_player2_id(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/games", async (req, res) => {
  try {
    const {
      team1_player1_id,
      team1_player2_id,
      team2_player1_id,
      team2_player2_id,
      team1_score,
      team2_score
    } = req.body;

    const selectedIds = [
      Number(team1_player1_id),
      Number(team1_player2_id),
      Number(team2_player1_id),
      Number(team2_player2_id)
    ];

    if (selectedIds.some((id) => !id)) {
      return res.status(400).json({ error: "All 4 players are required." });
    }

    if (new Set(selectedIds).size < 4) {
      return res.status(400).json({ error: "All 4 players must be different." });
    }

    const t1 = Number(team1_score);
    const t2 = Number(team2_score);

    if (!Number.isInteger(t1) || !Number.isInteger(t2) || t1 < 0 || t2 < 0) {
      return res.status(400).json({ error: "Scores must be non-negative integers." });
    }

    const winnerScore = Math.max(t1, t2);
    const loserScore = Math.min(t1, t2);

    if (winnerScore < 11 || winnerScore - loserScore < 2) {
      return res.status(400).json({ error: "Invalid score." });
    }

    const { error: insertError } = await supabase
      .from("games")
      .insert([
        {
          team1_player1_id: selectedIds[0],
          team1_player2_id: selectedIds[1],
          team2_player1_id: selectedIds[2],
          team2_player2_id: selectedIds[3],
          team1_score: t1,
          team2_score: t2
        }
      ]);

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    const updatedPlayers = await recalculateAllStats();

    res.status(201).json({
      message: "Game added and stats recalculated.",
      players: updatedPlayers
    });
  } catch (err) {
    console.error("POST /api/games error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/games/:id", requireAdmin, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({ error: "Invalid game id." });
    }

    const { error: deleteError } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    const updatedPlayers = await recalculateAllStats();

    res.json({
      message: "Game deleted and stats recalculated.",
      players: updatedPlayers
    });
  } catch (err) {
    console.error("DELETE /api/games/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/games/:id", requireAdmin, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return res.status(400).json({ error: "Invalid game id." });
    }

    const {
      team1_player1_id,
      team1_player2_id,
      team2_player1_id,
      team2_player2_id,
      team1_score,
      team2_score
    } = req.body;

    const selectedIds = [
      Number(team1_player1_id),
      Number(team1_player2_id),
      Number(team2_player1_id),
      Number(team2_player2_id)
    ];

    if (selectedIds.some((id) => !id)) {
      return res.status(400).json({ error: "All 4 players are required." });
    }

    if (new Set(selectedIds).size < 4) {
      return res.status(400).json({ error: "All 4 players must be different." });
    }

    const t1 = Number(team1_score);
    const t2 = Number(team2_score);

    if (!Number.isInteger(t1) || !Number.isInteger(t2) || t1 < 0 || t2 < 0) {
      return res.status(400).json({ error: "Scores must be non-negative integers." });
    }

    const winnerScore = Math.max(t1, t2);
    const loserScore = Math.min(t1, t2);

    if (winnerScore < 11 || winnerScore - loserScore < 2) {
      return res.status(400).json({ error: "Invalid score." });
    }

    const { error: updateError } = await supabase
      .from("games")
      .update({
        team1_player1_id: selectedIds[0],
        team1_player2_id: selectedIds[1],
        team2_player1_id: selectedIds[2],
        team2_player2_id: selectedIds[3],
        team1_score: t1,
        team2_score: t2
      })
      .eq("id", gameId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    const updatedPlayers = await recalculateAllStats();

    res.json({
      message: "Game updated and stats recalculated.",
      players: updatedPlayers
    });
  } catch (err) {
    console.error("PUT /api/games/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/players", async (req, res) => {
  try {
    const { name, tags, active, manual_offset } = req.body;
    const normalizedActive = active === undefined ? true : !!active;

    const normalizedManualOffset =
    manual_offset === undefined || manual_offset === null || manual_offset === ""
        ? 0
        : Number(manual_offset);

    if (Number.isNaN(normalizedManualOffset)) {
        return res.status(400).json({ error: "manual_offset must be a number." });
    }

    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "Player name is required." });
    }

    const allowedTags = ["UMD", "Alumni", "Other"];
    const safeTags = Array.isArray(tags)
      ? tags.filter((tag) => allowedTags.includes(tag))
      : [];

    const { data, error } = await supabase
      .from("players")
      .insert([
        {
          name: trimmedName,
          games_played: 0,
          wins: 0,
          losses: 0,
          elo: 1000,
          tags: safeTags,
          active: normalizedActive,
          manual_offset: normalizedManualOffset
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (err) {
    console.error("POST /api/players error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/players/:id", requireAdmin, async (req, res) => {
  try {
    const playerId = Number(req.params.id);
    const { name, tags, active, manual_offset } = req.body;

    const normalizedManualOffset =
    manual_offset === undefined || manual_offset === null || manual_offset === ""
        ? 0
        : Number(manual_offset);

    if (Number.isNaN(normalizedManualOffset)) {
        return res.status(400).json({ error: "manual_offset must be a number." });
    }

    if (!Number.isInteger(playerId) || playerId <= 0) {
      return res.status(400).json({ error: "Invalid player id." });
    }

    const trimmedName = String(name || "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "Player name is required." });
    }

    const allowedTags = ["UMD", "Alumni", "Other"];
    const safeTags = Array.isArray(tags)
      ? tags.filter((tag) => allowedTags.includes(tag))
      : [];


    const updateFields = {
        name: trimmedName,
        tags: safeTags,
        active: active,
        manual_offset: normalizedManualOffset
    };

    if (active !== undefined) {
        updateFields.active = !!active;
    }

    const { data, error } = await supabase
        .from("players")
        .update(updateFields)
        .eq("id", playerId)
        .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json(data[0]);
  } catch (err) {
    console.error("PUT /api/players/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/players/:id", requireAdmin, async (req, res) => {
  try {
    const playerId = Number(req.params.id);

    if (!Number.isInteger(playerId) || playerId <= 0) {
      return res.status(400).json({ error: "Invalid player id." });
    }

    const { data: gameReference, error: gameCheckError } = await supabase
      .from("games")
      .select("id")
      .or(
        `team1_player1_id.eq.${playerId},team1_player2_id.eq.${playerId},team2_player1_id.eq.${playerId},team2_player2_id.eq.${playerId}`
      )
      .limit(1);

    if (gameCheckError) {
      return res.status(500).json({ error: gameCheckError.message });
    }

    if (gameReference && gameReference.length > 0) {
      return res.status(400).json({
        error: "Cannot delete a player who appears in saved games."
      });
    }

    const { data, error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Player not found." });
    }

    res.json({ message: "Player deleted successfully." });
  } catch (err) {
    console.error("DELETE /api/players/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});