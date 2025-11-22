import type { AllMatchStats, ParticipantStatsRole } from "../role-processing";
import type { ParticipantCalculatedAverageStats } from "../role-processing/utils";
import { calculateAverageStats } from "../role-processing/utils";

/**
 * Average role stats for a single player in a specific role.
 * Combines basic player information with averaged calculated statistics.
 */
export type PlayerAverageRoleStats = {
  playerInfo: {
    summonerId: string;
    gameName: string;
    tagLine: string;
    numberOfGames: number;
  };
  averageStats: ParticipantCalculatedAverageStats;
};

export type PlayersAverageRoleStats = {
  top: { [summonerId: string]: PlayerAverageRoleStats };
  jungle: { [summonerId: string]: PlayerAverageRoleStats };
  mid: { [summonerId: string]: PlayerAverageRoleStats };
  adc: { [summonerId: string]: PlayerAverageRoleStats };
  support: { [summonerId: string]: PlayerAverageRoleStats };
};

export function calculatePlayersAverageRoleStats(
  allMatchRoleStats: AllMatchStats
) {
  const playersAverageRoleStats: PlayersAverageRoleStats = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
  };

  // Collect matches by role and player
  const matchesByRole: Record<
    keyof PlayersAverageRoleStats,
    Record<string, ParticipantStatsRole[]>
  > = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
  };

  for (const matchStats of Object.values(allMatchRoleStats)) {
    for (const role of Object.keys(matchStats) as Array<
      keyof PlayersAverageRoleStats
    >) {
      for (const summonerId of Object.keys(matchStats[role])) {
        if (!matchesByRole[role][summonerId]) {
          matchesByRole[role][summonerId] = [];
        }
        matchesByRole[role][summonerId].push(matchStats[role][summonerId]);
      }
    }
  }

  for (const role of Object.keys(matchesByRole) as Array<
    keyof PlayersAverageRoleStats
  >) {
    for (const [summonerId, matches] of Object.entries(matchesByRole[role])) {
      if (!matches.length) continue;

      const sortedMatches = [...matches].sort(
        (a, b) => b.gameDate - a.gameDate
      );
      const averageStats =
        calculateAverageStats(sortedMatches, -1) ||
        (null as ParticipantCalculatedAverageStats | null);

      if (!averageStats) continue;

      const mostRecentMatch = sortedMatches[0];

      playersAverageRoleStats[role][summonerId] = {
        playerInfo: {
          summonerId: mostRecentMatch.summonerId,
          gameName: mostRecentMatch.gameName,
          tagLine: mostRecentMatch.tagLine,
          numberOfGames: sortedMatches.length,
        },
        averageStats,
      };
    }
  }

  return playersAverageRoleStats;
}
