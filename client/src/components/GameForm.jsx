function GameForm({
  players,
  formData,
  editingGameId,
  onChange,
  onSubmit,
  onCancel
}) {
  const renderPlayerOptions = () =>
    players.map((player) => (
      <option key={player.id} value={player.id}>
        {player.name}
      </option>
    ));

  return (
    <form onSubmit={onSubmit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px",
          alignItems: "start"
        }}
      >
        {/* Team 1 */}
        <div>
          <h3>Team 1</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "12px",
              alignItems: "center"
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <select
                name="team1_player1_id"
                value={formData.team1_player1_id}
                onChange={onChange}
                required
              >
                <option value="">Select Player 1</option>
                {renderPlayerOptions()}
              </select>

              <select
                name="team1_player2_id"
                value={formData.team1_player2_id}
                onChange={onChange}
                required
              >
                <option value="">Select Player 2</option>
                {renderPlayerOptions()}
              </select>
            </div>

            <input
              type="number"
              name="team1_score"
              value={formData.team1_score}
              onChange={onChange}
              placeholder="Score"
              required
              style={{
                width: "90px",
                height: "42px",
                textAlign: "center"
              }}
            />
          </div>
        </div>

        {/* Team 2 */}
        <div>
          <h3>Team 2</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "12px",
              alignItems: "center"
            }}
          >
            <input
              type="number"
              name="team2_score"
              value={formData.team2_score}
              onChange={onChange}
              placeholder="Score"
              required
              style={{
                width: "90px",
                height: "42px",
                textAlign: "center"
              }}
            />

            <div style={{ display: "grid", gap: "10px" }}>
              <select
                name="team2_player1_id"
                value={formData.team2_player1_id}
                onChange={onChange}
                required
              >
                <option value="">Select Player 1</option>
                {renderPlayerOptions()}
              </select>

              <select
                name="team2_player2_id"
                value={formData.team2_player2_id}
                onChange={onChange}
                required
              >
                <option value="">Select Player 2</option>
                {renderPlayerOptions()}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button type="submit">
          {editingGameId ? "Save Changes" : "Submit Game"}
        </button>

        {editingGameId && (
          <button type="button" onClick={onCancel} style={{ marginLeft: "10px" }}>
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}

export default GameForm;