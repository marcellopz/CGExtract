import type {
  AverageStatsByRoleAByAccountIdInLastGames,
  MatchRoles,
  MatchStatsPlayerRole,
  ParticipantCalculatedStats,
  ParticipantStatsRole,
  PlayersObj,
  RoleLeaderboardEntry,
} from ".";
import type { GameDetails } from "../../../../../gameTypes";
import type { Timeline } from "../timelapse";

// ============================================================
// TYPES
// ============================================================

export interface TeamTotals {
  [teamId: number]: {
    kills: number;
    damage: number;
  };
}

export interface TimelineStatsAtValue {
  goldAtValue: number;
  xpAtValue: number;
  csAtValue: number;
  levelAtValue: number;
  goldDiffAtValue: number;
  xpDiffAtValue: number;
  csDiffAtValue: number;
}

// ============================================================
// TEAM LEVEL CALCULATIONS
// ============================================================

export function calculateTeamTotals(match: GameDetails): TeamTotals {
  const totals: TeamTotals = {
    100: { kills: 0, damage: 0 },
    200: { kills: 0, damage: 0 },
  };

  for (const participant of match.participants) {
    totals[participant.teamId].kills += participant.stats.kills;
    totals[participant.teamId].damage +=
      participant.stats.totalDamageDealtToChampions;
  }

  return totals;
}

export function calculateTeamKillsPreValue(
  timeline: Timeline,
  value: number
): { [teamId: number]: number } {
  const teamKills = { 100: 0, 200: 0 };

  for (const frame of timeline.frames) {
    if (frame.events) {
      for (const event of frame.events) {
        if (event.type === "CHAMPION_KILL") {
          const teamId = event.killerId > 5 ? 200 : 100;
          teamKills[teamId]++;
        }
      }
    }
    if (frame.timestamp > value) {
      // value in milliseconds
      break;
    }
  }

  return teamKills;
}

// ============================================================
// PLAYER IDENTIFICATION
// ============================================================

export function getSummonerIdFromParticipant(
  match: GameDetails,
  participantId: number
): string {
  const identity = match.participantIdentities.find(
    (id) => id.participantId === participantId
  );
  return identity?.player.summonerId.toString() || "";
}

export function getSummonerNameFromParticipant(
  match: GameDetails,
  participantId: number
): {
  gameName: string;
  tagLine: string;
} {
  const identity = match.participantIdentities.find(
    (id) => id.participantId === participantId
  );
  return {
    gameName: identity?.player.gameName || "",
    tagLine: identity?.player.tagLine || "",
  };
}

export function findLaneOpponent(
  match: GameDetails,
  matchRoles: MatchRoles,
  summonerId: string
): { participantId: number; summonerId: string } | null {
  const role = matchRoles[summonerId];
  if (!role) return null;
  const opponentSummonerId = Object.keys(matchRoles).find(
    (id) => matchRoles[id] === role && id !== summonerId
  );
  if (!opponentSummonerId) return null;
  const opponentParticipant = match.participantIdentities.find(
    (p) => p.player.summonerId === Number(opponentSummonerId)
  );
  if (!opponentParticipant) return null;
  return {
    participantId: opponentParticipant.participantId,
    summonerId: opponentSummonerId,
  };
}

// ============================================================
// BASIC CALCULATIONS
// ============================================================

export function calculateKDA(
  kills: number,
  deaths: number,
  assists: number
): number {
  return deaths === 0 ? kills + assists : (kills + assists) / deaths;
}

export function calculateKillParticipation(
  kills: number,
  assists: number,
  teamKills: number
): number {
  if (teamKills === 0) return 0;
  return (kills + assists) / teamKills;
}

export function calculateDamageShare(
  playerDamage: number,
  teamDamage: number
): number {
  if (teamDamage === 0) return 0;
  return playerDamage / teamDamage;
}

export function calculateDamagePerDeath(
  damage: number,
  deaths: number
): number {
  return deaths === 0 ? damage : damage / deaths;
}

export function calculateDamagePerGold(damage: number, gold: number): number {
  return gold === 0 ? 0 : damage / gold;
}

export function calculateEarlyGameKP(
  killsAndAssists: number,
  teamKills: number
): number {
  if (teamKills === 0) return 0;
  return killsAndAssists / teamKills;
}

// ============================================================
// TIMELINE STATS EXTRACTION (at any value)
// ============================================================

const defaultTimelineStatsAtValue: TimelineStatsAtValue = {
  goldAtValue: 0,
  xpAtValue: 0,
  csAtValue: 0,
  levelAtValue: 0,
  goldDiffAtValue: 0,
  xpDiffAtValue: 0,
  csDiffAtValue: 0,
};

export function extractTimelineStatsAtValue(
  timeline: Timeline,
  participantId: number,
  opponentParticipantId: number,
  value: number // in milliseconds
): TimelineStatsAtValue {
  const lastFrameBeforeValue = timeline.frames.find(
    (frame) => frame.timestamp > value && frame.timestamp <= value + 60000
  );

  if (!lastFrameBeforeValue) return defaultTimelineStatsAtValue;

  const participantFrame =
    lastFrameBeforeValue.participantFrames[participantId];
  const opponentFrame =
    lastFrameBeforeValue.participantFrames[opponentParticipantId];

  if (!participantFrame || !opponentFrame) return defaultTimelineStatsAtValue;

  const csAtValue =
    participantFrame.minionsKilled + participantFrame.jungleMinionsKilled;
  const opponentCsAtValue =
    opponentFrame.minionsKilled + opponentFrame.jungleMinionsKilled;

  return {
    goldAtValue: participantFrame.totalGold,
    xpAtValue: participantFrame.xp,
    csAtValue: csAtValue,
    levelAtValue: participantFrame.level,
    goldDiffAtValue: participantFrame.totalGold - opponentFrame.totalGold,
    xpDiffAtValue: participantFrame.xp - opponentFrame.xp,
    csDiffAtValue: csAtValue - opponentCsAtValue,
  };
}

// ============================================================
// TIMELINE EVENT-BASED STATS
// ============================================================

export function calculateSoloKills(
  timeline: Timeline,
  participantId: number
): number {
  let count = 0;

  for (const frame of timeline.frames) {
    if (frame.events) {
      for (const event of frame.events) {
        if (
          event.type === "CHAMPION_KILL" &&
          event.killerId === participantId &&
          (!event.assistingParticipantIds ||
            event.assistingParticipantIds?.length === 0)
        ) {
          count++;
        }
      }
    }
  }

  return count;
}

export function calculateKillsAndAssistsPreValue(
  timeline: Timeline,
  participantId: number,
  value: number // in milliseconds
): number {
  let count = 0;

  for (const frame of timeline.frames) {
    if (frame.events) {
      for (const event of frame.events) {
        if (
          event.type === "CHAMPION_KILL" &&
          (event.killerId === participantId ||
            event.assistingParticipantIds?.includes(participantId))
        ) {
          count++;
        }
      }
    }
    if (frame.timestamp > value) {
      break;
    }
  }

  return count;
}

export function calculateEpicMonsterKills(timeline: Timeline): {
  [teamId: number]: number;
} {
  const count = {
    100: 0,
    200: 0,
  };

  for (const frame of timeline.frames) {
    if (frame.events) {
      for (const event of frame.events) {
        if (event.type === "ELITE_MONSTER_KILL") {
          count[event.killerId > 5 ? 200 : 100]++;
        }
      }
    }
  }

  return count;
}

export function isInMidLane(x: number, y: number) {
  const LANE_WIDTH_THRESHOLD = 1300; // Adjust this value to make the lane wider or narrower

  // Check if the point is close to the main y = x diagonal
  const isAlongDiagonal = Math.abs(x - y) < LANE_WIDTH_THRESHOLD;

  return isAlongDiagonal;
}

export function isInBotLane(x: number, y: number) {
  // Define the horizontal part of the lane (Blue Side's half)
  const isHorizontalPart = y < 3000;

  // Define the vertical part of the lane (Red Side's half)
  const isVerticalPart = x > 12000;

  return isHorizontalPart || isVerticalPart;
}

export function calculateRoamsSuccessful(
  timeline: Timeline,
  participantId: number,
  role: string
) {
  // Only mid and support roam effectively
  if (role !== "mid" && role !== "support") {
    return 0;
  }

  const isInHomeLane = role === "mid" ? isInMidLane : isInBotLane;
  let count = 0;

  for (const frame of timeline.frames) {
    // Only look at first 15 minutes
    if (frame.timestamp > 900000) break;

    if (!frame.events) continue;

    for (const event of frame.events) {
      // Only count kills and epic monsters
      const isRelevantEvent =
        event.type === "CHAMPION_KILL" || event.type === "ELITE_MONSTER_KILL";
      if (!isRelevantEvent) continue;

      // Check if player participated (kill or assist)
      const playerParticipated =
        event.killerId === participantId ||
        event.assistingParticipantIds?.includes(participantId);
      if (!playerParticipated) continue;

      // Check if event happened outside their home lane (= successful roam)
      const isOutsideLane = !isInHomeLane(event.position.x, event.position.y);
      if (isOutsideLane) {
        count++;
      }
    }
  }

  return count;
}

export function organizeStatsByRole(
  matchStats: ParticipantStatsRole[]
): MatchStatsPlayerRole {
  const organizedStats: MatchStatsPlayerRole = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
  };
  for (const stat of matchStats) {
    organizedStats[stat.role][stat.summonerId] = stat;
  }
  return organizedStats;
}

export type ParticipantCalculatedAverageStats = {
  wins: number;
} & { [key in keyof ParticipantCalculatedStats]: number };

export const initializeParticipantCalculatedAverageStats: ParticipantCalculatedAverageStats =
  {
    wins: 0,
    kills: 0,
    deaths: 0,
    assists: 0,
    kda: 0,
    totalMinionsKilled: 0,
    neutralMinionsKilled: 0,
    totalCS: 0,
    csPerMinute: 0,
    goldEarned: 0,
    goldPerMinute: 0,
    totalDamageDealtToChampions: 0,
    damagePerMinute: 0,
    physicalDamageDealtToChampions: 0,
    magicDamageDealtToChampions: 0,
    trueDamageDealtToChampions: 0,
    visionScore: 0,
    visionScorePerMinute: 0,
    wardsPlaced: 0,
    wardsKilled: 0,
    visionWardsBoughtInGame: 0,
    damageDealtToObjectives: 0,
    damageDealtToTurrets: 0,
    totalDamageTaken: 0,
    damageSelfMitigated: 0,
    totalHeal: 0,
    timeCCingOthers: 0,
    totalTimeCrowdControlDealt: 0,
    teamKills: 0,
    teamDamage: 0,
    killParticipation: 0,
    damageShare: 0,
    goldAt10: 0,
    xpAt10: 0,
    csAt10: 0,
    levelAt10: 0,
    goldDiffAt10: 0,
    xpDiffAt10: 0,
    csDiffAt10: 0,
    goldAt15: 0,
    xpAt15: 0,
    csAt15: 0,
    levelAt15: 0,
    goldDiffAt15: 0,
    xpDiffAt15: 0,
    csDiffAt15: 0,
    goldAt20: 0,
    xpAt20: 0,
    csAt20: 0,
    levelAt20: 0,
    goldDiffAt20: 0,
    xpDiffAt20: 0,
    csDiffAt20: 0,
    soloKills: 0,
    firstBlood: 0, // Will be ratio 0-1
    firstBloodKill: 0, // Will be ratio 0-1
    firstBloodAssist: 0, // Will be ratio 0-1
    doubleKills: 0,
    tripleKills: 0,
    quadraKills: 0,
    pentaKills: 0,
    turretKills: 0,
    inhibitorKills: 0,
    firstTowerKill: 0, // Will be ratio 0-1
    firstTowerAssist: 0, // Will be ratio 0-1
    killsAndAssistsPre15: 0,
    teamKillsPre15: 0,
    earlyGameKP: 0,
    damagePerDeath: 0,
    damagePerGold: 0,
    objectiveControlRate: 0,
    roamsSuccessful: 0,
  };

export function calculateAverageStats(
  matchStats: ParticipantStatsRole[],
  numberOfGames: number
): ParticipantCalculatedAverageStats | null {
  const sortedMatchStats = matchStats.sort((a, b) => b.gameDate - a.gameDate);
  const lastMatches = sortedMatchStats.slice(0, numberOfGames);

  if (lastMatches.length < numberOfGames) return null;

  // Initialize with zeros - create a NEW object for each calculation
  const averageStats: ParticipantCalculatedAverageStats = {
    ...initializeParticipantCalculatedAverageStats,
  };

  // Sum all numeric stats
  for (const stat of lastMatches) {
    averageStats.wins += stat.win ? 1 : 0;
    averageStats.kills += stat.kills;
    averageStats.deaths += stat.deaths;
    averageStats.assists += stat.assists;
    averageStats.kda += stat.kda;
    averageStats.totalMinionsKilled += stat.totalMinionsKilled;
    averageStats.neutralMinionsKilled += stat.neutralMinionsKilled;
    averageStats.totalCS += stat.totalCS;
    averageStats.csPerMinute += stat.csPerMinute;
    averageStats.goldEarned += stat.goldEarned;
    averageStats.goldPerMinute += stat.goldPerMinute;
    averageStats.totalDamageDealtToChampions +=
      stat.totalDamageDealtToChampions;
    averageStats.damagePerMinute += stat.damagePerMinute;
    averageStats.physicalDamageDealtToChampions +=
      stat.physicalDamageDealtToChampions;
    averageStats.magicDamageDealtToChampions +=
      stat.magicDamageDealtToChampions;
    averageStats.trueDamageDealtToChampions += stat.trueDamageDealtToChampions;
    averageStats.visionScore += stat.visionScore;
    averageStats.visionScorePerMinute += stat.visionScorePerMinute;
    averageStats.wardsPlaced += stat.wardsPlaced;
    averageStats.wardsKilled += stat.wardsKilled;
    averageStats.visionWardsBoughtInGame += stat.visionWardsBoughtInGame;
    averageStats.damageDealtToObjectives += stat.damageDealtToObjectives;
    averageStats.damageDealtToTurrets += stat.damageDealtToTurrets;
    averageStats.totalDamageTaken += stat.totalDamageTaken;
    averageStats.damageSelfMitigated += stat.damageSelfMitigated;
    averageStats.totalHeal += stat.totalHeal;
    averageStats.timeCCingOthers += stat.timeCCingOthers;
    averageStats.totalTimeCrowdControlDealt += stat.totalTimeCrowdControlDealt;
    averageStats.teamKills += stat.teamKills;
    averageStats.teamDamage += stat.teamDamage;
    averageStats.killParticipation += stat.killParticipation;
    averageStats.damageShare += stat.damageShare;
    averageStats.goldAt10 += stat.goldAt10;
    averageStats.xpAt10 += stat.xpAt10;
    averageStats.csAt10 += stat.csAt10;
    averageStats.levelAt10 += stat.levelAt10;
    averageStats.goldDiffAt10 += stat.goldDiffAt10;
    averageStats.xpDiffAt10 += stat.xpDiffAt10;
    averageStats.csDiffAt10 += stat.csDiffAt10;
    averageStats.goldAt15 += stat.goldAt15;
    averageStats.xpAt15 += stat.xpAt15;
    averageStats.csAt15 += stat.csAt15;
    averageStats.levelAt15 += stat.levelAt15;
    averageStats.goldDiffAt15 += stat.goldDiffAt15;
    averageStats.xpDiffAt15 += stat.xpDiffAt15;
    averageStats.csDiffAt15 += stat.csDiffAt15;
    averageStats.goldAt20 += stat.goldAt20;
    averageStats.xpAt20 += stat.xpAt20;
    averageStats.csAt20 += stat.csAt20;
    averageStats.levelAt20 += stat.levelAt20;
    averageStats.goldDiffAt20 += stat.goldDiffAt20;
    averageStats.xpDiffAt20 += stat.xpDiffAt20;
    averageStats.csDiffAt20 += stat.csDiffAt20;
    averageStats.soloKills += stat.soloKills;
    // Boolean stats - count occurrences (will convert to ratio later)
    if (stat.firstBlood) averageStats.firstBlood++;
    if (stat.firstBloodKill) averageStats.firstBloodKill++;
    if (stat.firstBloodAssist) averageStats.firstBloodAssist++;
    averageStats.doubleKills += stat.doubleKills;
    averageStats.tripleKills += stat.tripleKills;
    averageStats.quadraKills += stat.quadraKills;
    averageStats.pentaKills += stat.pentaKills;
    averageStats.turretKills += stat.turretKills;
    averageStats.inhibitorKills += stat.inhibitorKills;
    if (stat.firstTowerKill) averageStats.firstTowerKill++;
    if (stat.firstTowerAssist) averageStats.firstTowerAssist++;
    averageStats.killsAndAssistsPre15 += stat.killsAndAssistsPre15;
    averageStats.teamKillsPre15 += stat.teamKillsPre15;
    averageStats.earlyGameKP += stat.earlyGameKP;
    averageStats.damagePerDeath += stat.damagePerDeath;
    averageStats.damagePerGold += stat.damagePerGold;
    averageStats.objectiveControlRate += stat.objectiveControlRate ?? 0;
    averageStats.roamsSuccessful += stat.roamsSuccessful ?? 0;
  }

  // Calculate averages (divide by number of games)
  averageStats.wins /= numberOfGames;
  averageStats.kills /= numberOfGames;
  averageStats.deaths /= numberOfGames;
  averageStats.assists /= numberOfGames;
  averageStats.kda /= numberOfGames;
  averageStats.totalMinionsKilled /= numberOfGames;
  averageStats.neutralMinionsKilled /= numberOfGames;
  averageStats.totalCS /= numberOfGames;
  averageStats.csPerMinute /= numberOfGames;
  averageStats.goldEarned /= numberOfGames;
  averageStats.goldPerMinute /= numberOfGames;
  averageStats.totalDamageDealtToChampions /= numberOfGames;
  averageStats.damagePerMinute /= numberOfGames;
  averageStats.physicalDamageDealtToChampions /= numberOfGames;
  averageStats.magicDamageDealtToChampions /= numberOfGames;
  averageStats.trueDamageDealtToChampions /= numberOfGames;
  averageStats.visionScore /= numberOfGames;
  averageStats.visionScorePerMinute /= numberOfGames;
  averageStats.wardsPlaced /= numberOfGames;
  averageStats.wardsKilled /= numberOfGames;
  averageStats.visionWardsBoughtInGame /= numberOfGames;
  averageStats.damageDealtToObjectives /= numberOfGames;
  averageStats.damageDealtToTurrets /= numberOfGames;
  averageStats.totalDamageTaken /= numberOfGames;
  averageStats.damageSelfMitigated /= numberOfGames;
  averageStats.totalHeal /= numberOfGames;
  averageStats.timeCCingOthers /= numberOfGames;
  averageStats.totalTimeCrowdControlDealt /= numberOfGames;
  averageStats.teamKills /= numberOfGames;
  averageStats.teamDamage /= numberOfGames;
  averageStats.killParticipation /= numberOfGames;
  averageStats.damageShare /= numberOfGames;
  averageStats.goldAt10 /= numberOfGames;
  averageStats.xpAt10 /= numberOfGames;
  averageStats.csAt10 /= numberOfGames;
  averageStats.levelAt10 /= numberOfGames;
  averageStats.goldDiffAt10 /= numberOfGames;
  averageStats.xpDiffAt10 /= numberOfGames;
  averageStats.csDiffAt10 /= numberOfGames;
  averageStats.goldAt15 /= numberOfGames;
  averageStats.xpAt15 /= numberOfGames;
  averageStats.csAt15 /= numberOfGames;
  averageStats.levelAt15 /= numberOfGames;
  averageStats.goldDiffAt15 /= numberOfGames;
  averageStats.xpDiffAt15 /= numberOfGames;
  averageStats.csDiffAt15 /= numberOfGames;
  averageStats.goldAt20 /= numberOfGames;
  averageStats.xpAt20 /= numberOfGames;
  averageStats.csAt20 /= numberOfGames;
  averageStats.levelAt20 /= numberOfGames;
  averageStats.goldDiffAt20 /= numberOfGames;
  averageStats.xpDiffAt20 /= numberOfGames;
  averageStats.csDiffAt20 /= numberOfGames;
  averageStats.soloKills /= numberOfGames;
  // Convert boolean counts to ratios (0-1 representing percentage of games)
  averageStats.firstBlood /= numberOfGames;
  averageStats.firstBloodKill /= numberOfGames;
  averageStats.firstBloodAssist /= numberOfGames;
  averageStats.doubleKills /= numberOfGames;
  averageStats.tripleKills /= numberOfGames;
  averageStats.quadraKills /= numberOfGames;
  averageStats.pentaKills /= numberOfGames;
  averageStats.turretKills /= numberOfGames;
  averageStats.inhibitorKills /= numberOfGames;
  averageStats.firstTowerKill /= numberOfGames;
  averageStats.firstTowerAssist /= numberOfGames;
  averageStats.killsAndAssistsPre15 /= numberOfGames;
  averageStats.teamKillsPre15 /= numberOfGames;
  averageStats.earlyGameKP /= numberOfGames;
  averageStats.damagePerDeath /= numberOfGames;
  averageStats.damagePerGold /= numberOfGames;
  averageStats.objectiveControlRate /= numberOfGames;
  averageStats.roamsSuccessful /= numberOfGames;

  return averageStats;
}

export function calculateRoleLeaderboardEntry(
  averageStatsByRoleAByAccountIdInLastGames: AverageStatsByRoleAByAccountIdInLastGames,
  role: string,
  stat: keyof ParticipantCalculatedStats,
  legends: PlayersObj
): RoleLeaderboardEntry | null {
  // Filter to only include accounts that have played this role
  const accountsWithRole = Object.entries(
    averageStatsByRoleAByAccountIdInLastGames
  ).filter(([, roleStats]) => roleStats[role] !== undefined);

  // If no one has played this role, return null
  if (accountsWithRole.length === 0) {
    return null;
  }

  // Sort by the specified stat (highest first)
  const sortedAccounts = accountsWithRole.sort(
    (a, b) => b[1][role][stat] - a[1][role][stat]
  );

  const [bestAccountId, bestRoleStats] = sortedAccounts[0];
  const bestLegend = Object.values(legends).find(
    (legend) => legend.account_id === Number(bestAccountId)
  );

  const best: RoleLeaderboardEntry = {
    summonerId: bestAccountId ?? "",
    value: bestRoleStats[role][stat],
    legend_name: bestLegend?.name ?? "",
    legend_id: bestLegend?.name_id ?? "",
  };

  return best;
}
