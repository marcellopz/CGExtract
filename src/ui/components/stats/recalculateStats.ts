import {
  getMatchRoles,
  getMatchesByPlayer,
  getMatches,
  savePlayerStats,
  saveOverallStats,
  savePlayerPairs,
  getFullMatches,
  getPlayers,
  getTimelines,
  saveAverageStatsByRoleAByAccountIdInLastGames,
  saveRoleLeaderboard,
  saveRoleStats,
  saveRoleOnAllReducedParticipant,
  saveMVPPlayers,
  savePlayersAverageRoleStats,
} from "./firebaseUtils";
import {
  processDataPlayer,
  processDataAll,
  processPlayerPairs,
} from "./dataProcessing";
import {
  calculateRoleLeaderboard,
  calculateRoleStats,
  type MatchRolesObj,
} from "./role-processing";
import { calculateMVP } from "./stats-tab-stuff/calculate-mvp";
import { calculatePlayersAverageRoleStats } from "./stats-tab-stuff/calculate-average-role-stats";

// Main RecalculateStats function
export const recalculateStats = async (): Promise<void> => {
  try {
    console.log("Starting stats recalculation...");

    // Get match roles and player data
    console.log("Fetching match roles and player data...");
    const [matchRoles, players, legends, fullMatches, timelines, allMatches] =
      await Promise.all([
        getMatchRoles(),
        getMatchesByPlayer(),
        getPlayers(),
        getFullMatches(),
        getTimelines(),
        getMatches(),
      ]);

    if (!players || !fullMatches || !timelines || !allMatches) {
      throw new Error("No player data found");
    }

    for (const [matchId, roles] of Object.entries(
      matchRoles as MatchRolesObj
    )) {
      const match = allMatches[matchId];
      for (const [summonerId, role] of Object.entries(roles)) {
        const playerParticipant = match.participants.find(
          (participant) => participant.summonerId === Number(summonerId)
        );
        if (
          playerParticipant &&
          role &&
          playerParticipant.participantId &&
          matchId
        ) {
          saveRoleOnAllReducedParticipant(
            matchId,
            Number(playerParticipant.participantId) - 1,
            role
          );
        }
      }
    }

    const playerIds = Object.keys(players);
    console.log(`Processing ${playerIds.length} players...`);

    // Process data for each player
    const processedDataPerPlayer = playerIds.map((playerId) =>
      processDataPlayer(players[playerId].matches, matchRoles)
    );

    // Save individual player stats
    console.log("Saving individual player stats...");
    for (const player of processedDataPerPlayer) {
      savePlayerStats(player);
    }

    // Get all matches and process overall stats
    console.log("Processing overall statistics...");

    const processedDataAll = processDataAll(allMatches, legends);
    saveOverallStats(processedDataAll);

    // Process and save player pairs
    console.log("Processing player pairs...");
    const processedPairs = processPlayerPairs(allMatches);
    savePlayerPairs(processedPairs);

    // Calculate and save role stats
    console.log("Calculating and saving role stats...");
    const allMatchRoleStats = calculateRoleStats(
      fullMatches,
      timelines,
      matchRoles,
      legends
    );

    saveRoleStats(allMatchRoleStats);

    console.log("Calculating and saving players average role stats...");
    const playersAverageRoleStats =
      calculatePlayersAverageRoleStats(allMatchRoleStats);
    savePlayersAverageRoleStats(playersAverageRoleStats);

    console.log("Calculating and saving MVP players...");
    const mvpPlayers = calculateMVP(allMatchRoleStats);
    saveMVPPlayers(mvpPlayers);

    // Calculate and save role leaderboard
    console.log("Calculating and saving role leaderboard...");
    const NUMBER_OF_GAMES_TO_CONSIDER = 10;
    const { roleLeaderboard, averageStatsByRoleAByAccountIdInLastGames } =
      calculateRoleLeaderboard(
        allMatchRoleStats,
        legends,
        NUMBER_OF_GAMES_TO_CONSIDER
      );

    console.log("Saving role leaderboard...");
    saveRoleLeaderboard(roleLeaderboard);
    console.log(
      "Saving average stats by role A by account ID in last games..."
    );
    saveAverageStatsByRoleAByAccountIdInLastGames(
      averageStatsByRoleAByAccountIdInLastGames
    );

    console.log("Stats recalculation completed successfully!");
    alert("Stats saved successfully!");
  } catch (error) {
    console.error("Error during stats recalculation:", error);
    alert(
      `Error recalculating stats: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    throw error;
  }
};
