import supabase from "./supabaseClient.js";

const STARTING_ELO = 1000;
const BASE_K = 30;

function expectedScore(teamElo, opponentElo) {
  return 1 / (1 + 10 ** ((opponentElo - teamElo) / 400));
}

export async function recalculateAllStats() {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("*")
    .order("id", { ascending: true });

  if (playersError) {
    throw new Error(playersError.message);
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .order("id", { ascending: true });

  if (gamesError) {
    throw new Error(gamesError.message);
  }

  const playerMap = {};

  for (const player of players) {
    playerMap[player.id] = {
      ...player,
      games_played: 0,
      wins: 0,
      losses: 0,
      elo: STARTING_ELO
    };
  }

  for (const game of games) {
    const p1 = playerMap[game.team1_player1_id];
    const p2 = playerMap[game.team1_player2_id];
    const p3 = playerMap[game.team2_player1_id];
    const p4 = playerMap[game.team2_player2_id];

    if (!p1 || !p2 || !p3 || !p4) {
      continue;
    }

    const team1AvgElo = (p1.elo + p2.elo) / 2;
    const team2AvgElo = (p3.elo + p4.elo) / 2;

    const team1Expected = expectedScore(team1AvgElo, team2AvgElo);
    const team2Expected = 1 - team1Expected;

    const scoreDiff = Math.abs(game.team1_score - game.team2_score);
    const kFactor = BASE_K + scoreDiff;

    const team1Won = game.team1_score > game.team2_score;

    const team1Actual = team1Won ? 1 : 0;
    const team2Actual = team1Won ? 0 : 1;

    const team1Change = Number(
      (kFactor * (team1Actual - team1Expected)).toFixed(2)
    );
    const team2Change = Number(
      (kFactor * (team2Actual - team2Expected)).toFixed(2)
    );

    p1.games_played += 1;
    p2.games_played += 1;
    p3.games_played += 1;
    p4.games_played += 1;

    if (team1Won) {
      p1.wins += 1;
      p2.wins += 1;
      p3.losses += 1;
      p4.losses += 1;
    } else {
      p3.wins += 1;
      p4.wins += 1;
      p1.losses += 1;
      p2.losses += 1;
    }

    p1.elo = max(0, Number((p1.elo + team1Change).toFixed(2)));
    p2.elo = max(0, Number((p2.elo + team1Change).toFixed(2)));
    p3.elo = max(0, Number((p3.elo + team2Change).toFixed(2)));
    p4.elo = max(0, Number((p4.elo + team2Change).toFixed(2)));
  }

  const updatedPlayers = Object.values(playerMap).map((player) => ({
    id: player.id,
    name: player.name,
    games_played: player.games_played,
    wins: player.wins,
    losses: player.losses,
    elo: player.elo
  }));

  for (const player of updatedPlayers) {
    const { error } = await supabase
      .from("players")
      .update({
        games_played: player.games_played,
        wins: player.wins,
        losses: player.losses,
        elo: player.elo
      })
      .eq("id", player.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  return updatedPlayers;
}