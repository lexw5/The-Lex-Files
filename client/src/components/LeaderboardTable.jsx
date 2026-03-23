function LeaderboardTable({ players, loading }) {
  if (loading) {
    return <p>Loading players...</p>;
  }

  return (
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
          <th>Tags</th>
        </tr>
      </thead>
      <tbody>
        
        {players
        .filter((player) => player.active) // only active
        .sort((a, b) => (b.elo + (b.manual_offset ?? 0)) - (a.elo + (a.manual_offset ?? 0)))     // highest ELO first
        .slice(0, 25)                      // top 25
        .map((player, index) => (
          <tr key={player.id}>
            <td>{index + 1}</td>
            <td>{player.name}</td>
            <td>{player.elo + (player.manual_offset ?? 0)}</td>
            <td>{player.games_played}</td>
            <td>{player.wins}</td>
            <td>{player.losses}</td>
            <td>
              {player.tags && player.tags.length > 0
                ? player.tags.join(", ")
                : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default LeaderboardTable;