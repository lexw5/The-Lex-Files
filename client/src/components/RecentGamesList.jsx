function RecentGamesList({
  games,
  loading,
  onEdit,
  onDelete,
  showActions = true,
  limit = null
}) {
  if (loading) {
    return <p>Loading games...</p>;
  }

  const displayedGames = limit ? games.slice(0, limit) : games;

  if (displayedGames.length === 0) {
    return <p>No games yet.</p>;
  }

  return (
    <div style={{ display: "grid", gap: "10px" }}>
      {displayedGames.map((game) => (
        <div
          key={game.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "12px"
          }}
        >
          <div>
            <strong>
              {game.team1_player1?.name} &amp; {game.team1_player2?.name}
            </strong>{" "}
            ({game.team1_score})
          </div>

          <div>
            <strong>
              {game.team2_player1?.name} &amp; {game.team2_player2?.name}
            </strong>{" "}
            ({game.team2_score})
          </div>

          <div
            style={{
              fontSize: "0.9rem",
              color: "#666",
              marginTop: "6px"
            }}
          >
            {new Date(game.created_at).toLocaleString()}
          </div>

          {showActions && (
            <div style={{ marginTop: "10px" }}>
              <button onClick={() => onEdit(game)}>Edit</button>
              <button
                onClick={() => onDelete(game.id)}
                style={{ marginLeft: "10px" }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default RecentGamesList;