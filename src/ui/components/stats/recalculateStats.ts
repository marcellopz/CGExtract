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
} from "./firebaseUtils";
import {
  processDataPlayer,
  processDataAll,
  processPlayerPairs,
} from "./dataProcessing";
import {
  calculateRoleLeaderboard,
  calculateRoleStats,
} from "./role-processing";

// Main RecalculateStats function
export const recalculateStats = async (): Promise<void> => {
  try {
    console.log("Starting stats recalculation...");

    // Get match roles and player data
    console.log("Fetching match roles and player data...");
    const matchRoles = await getMatchRoles();
    const players = await getMatchesByPlayer();
    const legends = await getPlayers();

    if (!players) {
      throw new Error("No player data found");
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
      await savePlayerStats(player);
    }

    // Get all matches and process overall stats
    console.log("Processing overall statistics...");
    const allMatches = await getMatches();
    if (!allMatches) {
      throw new Error("No match data found");
    }

    const processedDataAll = processDataAll(allMatches, legends);
    await saveOverallStats(processedDataAll);

    // Process and save player pairs
    console.log("Processing player pairs...");
    const processedPairs = processPlayerPairs(allMatches);
    await savePlayerPairs(processedPairs);

    const fullMatches = await getFullMatches();
    const timelines = await getTimelines();

    // Calculate and save role stats
    console.log("Calculating and saving role stats...");
    const result = calculateRoleStats(
      fullMatches,
      timelines,
      matchRoles,
      legends
    );

    await saveRoleStats(result);

    // Calculate and save role leaderboard
    console.log("Calculating and saving role leaderboard...");
    const NUMBER_OF_GAMES_TO_CONSIDER = 10;
    const { roleLeaderboard, averageStatsByRoleAByAccountIdInLastGames } =
      calculateRoleLeaderboard(result, legends, NUMBER_OF_GAMES_TO_CONSIDER);

    await saveRoleLeaderboard(roleLeaderboard);
    await saveAverageStatsByRoleAByAccountIdInLastGames(
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
