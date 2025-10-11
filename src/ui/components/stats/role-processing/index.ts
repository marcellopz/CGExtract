import type { GameDetails } from "../../../../../gameTypes";
import type { Timeline } from "../timelapse";
import type { PlayerLegend } from "../../../../../gameTypes";
import { validateMatchesData } from "./validation";
import { calculateMatchStats } from "./matchStatsCalculator";
import {
  calculateAverageStats,
  calculateRoleLeaderboardEntry,
  initializeParticipantCalculatedAverageStats,
  organizeStatsByRole,
  type ParticipantCalculatedAverageStats,
} from "./utils";

export type MatchesObj = {
  [matchId: string]: GameDetails;
};

export type TimelineObj = {
  [matchId: string]: Timeline;
};

export type MatchRoles = {
  [summonerId: string]: "top" | "jungle" | "mid" | "adc" | "support";
};

export type MatchRolesObj = {
  [matchId: string]: MatchRoles;
};

export type PlayersObj = {
  [legendId: string]: PlayerLegend;
};

export type ParticipantBasicInfo = {
  summonerId: string;
  gameName: string;
  tagLine: string;
  championId: number;
  role: "top" | "jungle" | "mid" | "adc" | "support";
  win: boolean;
  gameDuration: number; // in seconds
  teamId: number;
  gameDate: number; // in milliseconds
};

export type ParticipantCalculatedStats = {
  // Core stats
  kills: number;
  deaths: number;
  assists: number;
  kda: number; // (kills + assists) / max(deaths, 1)

  // Farm stats
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  totalCS: number; // totalMinionsKilled + neutralMinionsKilled
  csPerMinute: number;

  // Gold stats
  goldEarned: number;
  goldPerMinute: number;

  // Damage stats
  totalDamageDealtToChampions: number;
  damagePerMinute: number;
  physicalDamageDealtToChampions: number;
  magicDamageDealtToChampions: number;
  trueDamageDealtToChampions: number;

  // Vision stats
  visionScore: number;
  visionScorePerMinute: number;
  wardsPlaced: number;
  wardsKilled: number;
  visionWardsBoughtInGame: number;

  // Objective stats
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;

  // Tank/Survivability stats
  totalDamageTaken: number;
  damageSelfMitigated: number;

  // Utility stats
  totalHeal: number;
  timeCCingOthers: number; // in seconds
  totalTimeCrowdControlDealt: number;

  // Team contribution stats
  teamKills: number; // total kills by the team
  teamDamage: number; // total damage to champions by the team
  killParticipation: number; // (kills + assists) / teamKills
  damageShare: number; // totalDamageDealtToChampions / teamDamage

  // Early game stats (@10 min)
  goldAt10: number;
  xpAt10: number;
  csAt10: number;
  levelAt10: number;
  goldDiffAt10: number; // vs lane opponent (same role, enemy team)
  xpDiffAt10: number;
  csDiffAt10: number;

  // Mid-early game stats (@15 min)
  goldAt15: number;
  xpAt15: number;
  csAt15: number;
  levelAt15: number;
  goldDiffAt15: number; // vs lane opponent (same role, enemy team)
  xpDiffAt15: number;
  csDiffAt15: number;

  // Mid game stats (@20 min)
  goldAt20: number;
  xpAt20: number;
  csAt20: number;
  levelAt20: number;
  goldDiffAt20: number; // vs lane opponent (same role, enemy team)
  xpDiffAt20: number;
  csDiffAt20: number;

  // Advanced/derived stats
  soloKills: number; // kills with no assists from teammates
  firstBlood: boolean;
  firstBloodKill: boolean;
  firstBloodAssist: boolean;

  // Multikills
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;

  // Turret/Structure stats
  turretKills: number;
  inhibitorKills: number;
  firstTowerKill: boolean;
  firstTowerAssist: boolean;

  // Kill participation breakdown (for roaming detection)
  killsAndAssistsPre15: number; // for early game playmaker
  teamKillsPre15: number;
  earlyGameKP: number; // killsAndAssistsPre15 / teamKillsPre15

  // Death efficiency (for ADC)
  damagePerDeath: number; // totalDamageDealtToChampions / max(deaths, 1)

  // Gold efficiency (for ADC)
  damagePerGold: number; // totalDamageDealtToChampions / goldEarned

  // Advanced stats that require timeline processing
  // These will be calculated from timeline events and need special processing
  objectiveControlRate?: number; // For jungle - % of major objectives secured by team when player is alive
  roamsSuccessful?: number; // For mid/support - kills/assists outside of primary lane
};

export type ParticipantStatsRole = ParticipantBasicInfo &
  ParticipantCalculatedStats;

// match object with player stats separated by role
export type MatchStatsPlayerRole = {
  [role: string]: {
    // "top" | "jungle" | "mid" | "adc" | "support"
    [summonerId: string]: ParticipantStatsRole;
  };
};

// Collection of all match stats
export type AllMatchStats = {
  [matchId: string]: MatchStatsPlayerRole;
};

export function calculateRoleStats(
  fullMatches: MatchesObj,
  timelines: TimelineObj,
  matchRoles: MatchRolesObj,
  legends: PlayersObj
): AllMatchStats {
  console.log("Starting role stats calculation...");
  console.log(`Total matches: ${Object.keys(fullMatches).length}`);
  console.log(`Total timelines: ${Object.keys(timelines).length}`);
  console.log(`Total match roles: ${Object.keys(matchRoles).length}`);
  console.log(`Total legends: ${Object.keys(legends).length}`);

  // Validate data integrity (throws if validation fails)
  validateMatchesData(fullMatches, timelines, matchRoles);

  // Process each match
  const allMatchStats: AllMatchStats = {};
  let processedCount = 0;

  for (const matchId of Object.keys(fullMatches)) {
    const match = fullMatches[matchId];
    const timeline = timelines[matchId];
    const roles = matchRoles[matchId];

    try {
      // Calculate stats for all players in this match
      const matchStats = calculateMatchStats(match, timeline, roles);

      // Organize stats by role
      allMatchStats[matchId] = organizeStatsByRole(matchStats);

      processedCount++;
    } catch (error) {
      console.error(`Error processing match ${matchId}:`, error);
      // Continue with next match
    }
  }

  console.log("\n=== Processing Complete ===");
  console.log(`✓ Successfully processed: ${processedCount} matches`);

  return allMatchStats;
}

export type RoleLeaderboardEntry = {
  summonerId: string;
  value: number;
  legend_name: string;
  legend_id: string;
};

// Final leaderboard structure - for each role, find the best player for each stat
export type RoleLeaderboard = {
  [role: string]: {
    [statName in keyof ParticipantCalculatedStats]: RoleLeaderboardEntry;
  };
};

export type AverageStatsByRoleAByAccountIdInLastGames = {
  [accountId: string]: {
    [role: string]: ParticipantCalculatedAverageStats | null;
  };
};

export function calculateRoleLeaderboard(
  allMatchStats: AllMatchStats,
  legends: PlayersObj,
  numberOfGamesToConsider: number
): {
  roleLeaderboard: RoleLeaderboard;
  averageStatsByRoleAByAccountIdInLastGames: AverageStatsByRoleAByAccountIdInLastGames;
} {
  const roleLeaderboard = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
  };

  const matchesByRoleAByAccountId: Record<
    string, // accountId
    Record<
      string, // role
      ParticipantStatsRole[]
    >
  > = {};

  for (const matchStats of Object.values(allMatchStats)) {
    for (const role of Object.keys(matchStats)) {
      for (const accountId of Object.keys(matchStats[role])) {
        if (!matchesByRoleAByAccountId[accountId]) {
          matchesByRoleAByAccountId[accountId] = {};
        }
        if (!matchesByRoleAByAccountId[accountId][role]) {
          matchesByRoleAByAccountId[accountId][role] = [];
        }
        matchesByRoleAByAccountId[accountId][role].push(
          matchStats[role][accountId]
        );
      }
    }
  }

  // Calculate average stats for each role by accountId in the last NUMBER_OF_GAMES_TO_CONSIDER games
  const averageStatsByRoleAByAccountIdInLastGames: AverageStatsByRoleAByAccountIdInLastGames =
    {};

  for (const accountId of Object.keys(matchesByRoleAByAccountId)) {
    for (const role of Object.keys(matchesByRoleAByAccountId[accountId])) {
      if (
        matchesByRoleAByAccountId[accountId][role].length <
        numberOfGamesToConsider
      ) {
        continue;
      }
      if (!averageStatsByRoleAByAccountIdInLastGames[accountId]) {
        averageStatsByRoleAByAccountIdInLastGames[accountId] = {};
      }
      averageStatsByRoleAByAccountIdInLastGames[accountId][role] =
        calculateAverageStats(
          matchesByRoleAByAccountId[accountId][role],
          numberOfGamesToConsider
        );
    }
  }

  for (const role of Object.keys(roleLeaderboard)) {
    for (const stat of Object.keys(
      initializeParticipantCalculatedAverageStats
    )) {
      roleLeaderboard[role][stat] = calculateRoleLeaderboardEntry(
        averageStatsByRoleAByAccountIdInLastGames,
        role,
        stat as keyof ParticipantCalculatedStats,
        legends
      );
    }
  }

  return {
    roleLeaderboard: roleLeaderboard as unknown as RoleLeaderboard,
    averageStatsByRoleAByAccountIdInLastGames,
  };
}
