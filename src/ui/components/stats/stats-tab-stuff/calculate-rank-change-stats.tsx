export type Role = "top" | "jungle" | "mid" | "adc" | "support";

export interface RankChangeEntry {
  name_id: string;
  newRank: number;
  oldRank: number;
  player: string;
  role: Role;
  timestamp: number;
  type: "rank_change";
  batch_description?: string;
}

export type PlayersRankChangeLog = {
  [nameId: string]: {
    [role in Role]?: {
      [firebaseKey: string]: RankChangeEntry;
    };
  };
};

export interface PlayerInitialRanks {
  accountId: number;
  adc: number;
  jungle: number;
  mid: number;
  name: string;
  name_id: string;
  support: number;
  timestamp: number;
  top: number;
}

export type PlayersInitialRanks = {
  [nameId: string]: PlayerInitialRanks;
};

type WinLoseSinceLastChange = {
  wins: number;
  loses: number;
  rank: number;
};

export type PlayerRankChangeStats = {
  number_of_changes: {
    [name_id: string]: number;
  };
  win_loses_since_last_change: {
    top: {
      [name_id: string]: WinLoseSinceLastChange;
    };
    jungle: {
      [name_id: string]: WinLoseSinceLastChange;
    };
    mid: {
      [name_id: string]: WinLoseSinceLastChange;
    };
    adc: {
      [name_id: string]: WinLoseSinceLastChange;
    };
    support: {
      [name_id: string]: WinLoseSinceLastChange;
    };
  };
};

import type { AllMatchStats, PlayersObj } from "../role-processing/index";

export function calculatePlayerRankChangeStats(
  playersRankChangeLog: PlayersRankChangeLog | null,
  _playersInitialRanks: PlayersInitialRanks | null,
  allMatchRoleStats: AllMatchStats,
  legends: PlayersObj
): PlayerRankChangeStats {
  // Step 1: Create name_id to accountId mapping
  const nameIdToAccountId: { [name_id: string]: number } = {};
  for (const legend of Object.values(legends)) {
    if (legend.name_id) {
      nameIdToAccountId[legend.name_id] = legend.account_id;
    }
  }

  // Step 2: Initialize result structure
  const result: PlayerRankChangeStats = {
    number_of_changes: {},
    win_loses_since_last_change: {
      top: {},
      jungle: {},
      mid: {},
      adc: {},
      support: {},
    },
  };

  // Step 4: Find earliest match timestamp
  let earliestMatchTimestamp = Infinity;
  for (const matchStats of Object.values(allMatchRoleStats)) {
    for (const roleStats of Object.values(matchStats)) {
      for (const participantStats of Object.values(roleStats)) {
        if (participantStats.gameDate < earliestMatchTimestamp) {
          earliestMatchTimestamp = participantStats.gameDate;
        }
      }
    }
  }
  // If no matches found, use 0 as fallback
  if (earliestMatchTimestamp === Infinity) {
    earliestMatchTimestamp = 0;
  }

  // Step 3: Process rank changes for number_of_changes
  if (playersRankChangeLog) {
    for (const [nameId, roleChanges] of Object.entries(playersRankChangeLog)) {
      const accountId = nameIdToAccountId[nameId];
      if (!accountId) {
        console.warn(
          `No accountId found for name_id: ${nameId}, skipping rank change count`
        );
        continue;
      }

      // Initialize if not exists
      if (!result.number_of_changes[nameId]) {
        result.number_of_changes[nameId] = 0;
      }

      // Count changes across all roles for this player
      for (const roleChangesByRole of Object.values(roleChanges)) {
        if (roleChangesByRole) {
          result.number_of_changes[nameId] +=
            Object.keys(roleChangesByRole).length;
        }
      }
    }
  }

  // Step 5: Calculate wins/losses since last change per role
  const roles: Role[] = ["top", "jungle", "mid", "adc", "support"];

  // Get all players to process from initialRanks
  const playersToProcess = new Set<string>();
  if (_playersInitialRanks) {
    for (const nameId of Object.keys(_playersInitialRanks)) {
      playersToProcess.add(nameId);
    }
  } else {
    // Fallback to legends if initialRanks is not available
    for (const legend of Object.values(legends)) {
      if (legend.name_id) {
        playersToProcess.add(legend.name_id);
      }
    }
  }

  for (const nameId of playersToProcess) {
    const accountId = nameIdToAccountId[nameId];
    if (!accountId) {
      console.warn(
        `No accountId found for name_id: ${nameId}, skipping win/loss calculation`
      );
      continue;
    }
    const summonerId = accountId.toString();

    for (const role of roles) {
      // Find the most recent rank change timestamp for this player/role
      let lastChangeTimestamp = earliestMatchTimestamp;
      let currentRank: number | null = null;

      if (playersRankChangeLog?.[nameId]?.[role]) {
        const roleChanges = playersRankChangeLog[nameId][role];
        if (roleChanges) {
          // Find maximum timestamp and corresponding newRank from all rank change entries
          let mostRecentTimestamp = 0;
          for (const changeEntry of Object.values(roleChanges)) {
            if (changeEntry.timestamp > lastChangeTimestamp) {
              lastChangeTimestamp = changeEntry.timestamp;
            }
            if (changeEntry.timestamp > mostRecentTimestamp) {
              mostRecentTimestamp = changeEntry.timestamp;
              currentRank = changeEntry.newRank;
            }
          }
        }
      }

      // If no rank change exists, use initial rank from playersInitialRanks
      if (currentRank === null && _playersInitialRanks?.[nameId]) {
        currentRank = _playersInitialRanks[nameId][role];
      }

      // Initialize wins/losses
      let wins = 0;
      let loses = 0;

      // Iterate through allMatchRoleStats to find matches after lastChangeTimestamp
      for (const matchStats of Object.values(allMatchRoleStats)) {
        const roleStats = matchStats[role];
        if (roleStats && roleStats[summonerId]) {
          const participantStats = roleStats[summonerId];
          if (participantStats.gameDate > lastChangeTimestamp) {
            if (participantStats.win) {
              wins++;
            } else {
              loses++;
            }
          }
        }
      }

      // Store result using name_id as key (only if player has played matches)
      if (wins > 0 || loses > 0) {
        result.win_loses_since_last_change[role][nameId] = {
          wins,
          loses,
          rank: currentRank ?? 0, // Fallback to 0 if rank is still null
        };
      }
    }
  }

  // Step 7: Return result
  return result;
}
