import { useEffect, useMemo, useState } from "react";
import LeaderboardTable from "../components/LeaderboardTable";
import RecentGamesList from "../components/RecentGamesList";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TAG_FILTERS = ["All", "UMD", "Alumni", "Other"];
const SORT_OPTIONS = [
  { value: "elo", label: "ELO" },
  { value: "games_played", label: "Games Played" },
  { value: "wins", label: "Wins" },
  { value: "losses", label: "Losses" }
];

function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [games, setGames] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [selectedSort, setSelectedSort] = useState("elo");

  useEffect(() => {
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
        setGames(data.slice(0, 5));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingGames(false);
      }
    };

    fetchPlayers();
    fetchGames();
  }, []);

  const filteredAndSortedPlayers = useMemo(() => {
    let result =
      selectedTag === "All"
        ? [...players]
        : players.filter(
            (player) =>
              Array.isArray(player.tags) && player.tags.includes(selectedTag)
          );

    result.sort((a, b) => {
      if (selectedSort === "games_played") {
        return b.games_played - a.games_played || b.elo - a.elo || a.name.localeCompare(b.name);
      }

      if (selectedSort === "wins") {
        return b.wins - a.wins || b.elo - a.elo || a.name.localeCompare(b.name);
      }

      if (selectedSort === "losses") {
        return b.losses - a.losses || b.elo - a.elo || a.name.localeCompare(b.name);
      }

      return b.elo - a.elo || b.games_played - a.games_played || a.name.localeCompare(b.name);
    });

    return result;
  }, [players, selectedTag, selectedSort]);

  return (
    <div>
      <h1>Leaderboard</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: "20px" }}>
        <h2>Filters</h2>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <label htmlFor="sortMode" style={{ display: "block", marginBottom: "6px" }}>
              Sort By
            </label>
            <select
              id="sortMode"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>    


          <div>
            <label htmlFor="tagFilter" style={{ display: "block", marginBottom: "6px" }}>
              Tag
            </label>
            <select
              id="tagFilter"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              {TAG_FILTERS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: "32px" }}>
        
        <LeaderboardTable
          players={filteredAndSortedPlayers}
          loading={loadingPlayers}
        />
      </section>

      <section>
        <h2>5 Most Recent Games</h2>
        <RecentGamesList
          games={games}
          loading={loadingGames}
          onEdit={null}
          onDelete={null}
          showActions={false}
        />
      </section>
    </div>
  );
}

export default LeaderboardPage;