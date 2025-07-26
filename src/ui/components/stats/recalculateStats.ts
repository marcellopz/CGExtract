import {
  getMatchRoles,
  getMatchesByPlayer,
  getMatches,
  savePlayerStats,
  saveOverallStats,
  savePlayerPairs,
} from "./firebaseUtils";
import {
  processDataPlayer,
  processDataAll,
  processPlayerPairs,
} from "./dataProcessing";

// Main RecalculateStats function
export const recalculateStats = async (): Promise<void> => {
  try {
    console.log("Starting stats recalculation...");

    // Get match roles and player data
    console.log("Fetching match roles and player data...");
    const matchRoles = await getMatchRoles();
    const players = await getMatchesByPlayer();

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

    const processedDataAll = processDataAll(allMatches);
    await saveOverallStats(processedDataAll);

    // Process and save player pairs
    console.log("Processing player pairs...");
    const processedPairs = processPlayerPairs(allMatches);
    await savePlayerPairs(processedPairs);

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
