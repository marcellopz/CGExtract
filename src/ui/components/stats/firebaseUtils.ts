/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatabase, ref, get, child, set } from "firebase/database";
import type { MvpPlayers } from "./stats-tab-stuff/calculate-mvp";

// Get database instance (using existing Firebase config)
const db = getDatabase();
const dbRef = ref(db);

// Firebase Database Functions
export async function getMatchRoles(match = "") {
  const re = await get(child(dbRef, `pre-processed-data/match-roles/${match}`));
  const roles = await re.val();
  return roles;
}

export async function getMatches() {
  const re = await get(child(dbRef, `pre-processed-data/all-reduced`));
  const matches = await re.val();
  return matches;
}

export async function getFullMatches() {
  const re = await get(child(dbRef, `full-json-matches`));
  const matches = await re.val();
  return matches;
}

export async function getTimelines() {
  const re = await get(child(dbRef, `timelines`));
  const timelines = await re.val();
  return timelines;
}

export async function getMatchesByPlayer() {
  const re = await get(child(dbRef, `pre-processed-data/players`));
  const players = await re.val();
  return players;
}

export async function saveOverallStats(stats: unknown) {
  await set(child(dbRef, "pre-processed-data/overall-stats"), stats);
}

export async function savePlayerPairs(pairs: unknown) {
  await set(child(dbRef, `pre-processed-data/pairs`), pairs);
}

export async function saveRoleStats(stats: unknown) {
  await set(child(dbRef, `pre-processed-data/role-stats`), stats);
}

export async function saveMVPPlayers(players: MvpPlayers) {
  await set(child(dbRef, `pre-processed-data/mvp-players`), players);
}

export async function saveRoleOnAllReducedParticipant(
  matchId: string,
  participantId: number,
  role: "top" | "jungle" | "mid" | "adc" | "support"
) {
  console.log(matchId, participantId, role);
  await set(
    child(
      dbRef,
      `pre-processed-data/all-reduced/${matchId}/participants/${participantId}/role`
    ),
    role
  );
}

export async function saveRoleLeaderboard(stats: unknown) {
  await set(child(dbRef, `pre-processed-data/role-leaderboard`), stats);
}

export async function saveAverageStatsByRoleAByAccountIdInLastGames(
  stats: unknown
) {
  await set(
    child(
      dbRef,
      `pre-processed-data/average-stats-by-role-and-by-account-id-in-last-games`
    ),
    stats
  );
}

export async function savePlayerStats(player: any) {
  Object.keys(player).forEach(async (tag) => {
    await set(
      child(dbRef, `pre-processed-data/players/${player.summonerId}/${tag}`),
      player[tag]
    );
  });
  await set(
    child(dbRef, `pre-processed-data/player-summary/${player.summonerId}`),
    {
      winRate: player.winRate,
      summonerName: player.summonerName,
      numberOfMatches: player.numberOfMatches,
      tagLine: player.tagLine,
    }
  );
}

export async function getPlayers() {
  const re = await get(child(dbRef, `players`));
  const players = await re.val();
  return players;
}

// Overview data functions
export async function getTotalPlayers(): Promise<number> {
  try {
    const re = await get(child(dbRef, `players`));
    const players = await re.val();
    return players ? Object.keys(players).length : 0;
  } catch (error) {
    console.error("Error fetching total players:", error);
    return 0;
  }
}

export async function getNumberOfGames(): Promise<number> {
  try {
    const re = await get(
      child(dbRef, `pre-processed-data/overall-stats/numberOfGames`)
    );
    const numberOfGames = await re.val();
    return numberOfGames || 0;
  } catch (error) {
    console.error("Error fetching number of games:", error);
    return 0;
  }
}

export async function getLastGameDate(): Promise<string | null> {
  try {
    const re = await get(
      child(dbRef, `pre-processed-data/overall-stats/lastGame`)
    );
    const lastGame = await re.val();
    return lastGame || null;
  } catch (error) {
    console.error("Error fetching last game date:", error);
    return null;
  }
}

export async function getOverviewData() {
  try {
    const [totalPlayers, numberOfGames, lastGameDate] = await Promise.all([
      getTotalPlayers(),
      getNumberOfGames(),
      getLastGameDate(),
    ]);

    return {
      totalPlayers,
      numberOfGames,
      lastGameDate,
    };
  } catch (error) {
    console.error("Error fetching overview data:", error);
    return {
      totalPlayers: 0,
      numberOfGames: 0,
      lastGameDate: null,
    };
  }
}

export async function saveGoldEarnedByTeam(
  matchId: string,
  teamId: number,
  goldEarned: number
) {
  await set(
    child(
      dbRef,
      `pre-processed-data/all-reduced/${matchId}/teams/${teamId}/goldEarned`
    ),
    goldEarned
  );
}
