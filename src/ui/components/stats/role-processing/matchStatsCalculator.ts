import type { GameDetails } from "../../../../../gameTypes";
import type { Timeline } from "../timelapse";
import type { ParticipantStatsRole, MatchRoles } from "./index";
import {
  calculateTeamTotals,
  getSummonerIdFromParticipant,
  getSummonerNameFromParticipant,
  calculateKDA,
  calculateKillParticipation,
  calculateDamageShare,
  calculateTeamKillsPreValue,
  extractTimelineStatsAtValue,
  findLaneOpponent,
  calculateSoloKills,
  calculateKillsAndAssistsPreValue,
  calculateEarlyGameKP,
  calculateDamagePerDeath,
  calculateDamagePerGold,
  calculateEpicMonsterKills,
  calculateRoamsSuccessful,
} from "./utils";

/**
 * Calculate comprehensive stats for all players in a single match
 *
 * @param match - The full match data from API
 * @param timeline - The timeline data for the match
 * @param matchRoles - Role assignments for this match
 * @returns Array of ParticipantStatsRole objects
 */
export function calculateMatchStats(
  match: GameDetails,
  timeline: Timeline,
  matchRoles: MatchRoles
): ParticipantStatsRole[] {
  const gameDurationMinutes = match.gameDuration / 60;
  const playerStats: ParticipantStatsRole[] = [];

  // Calculate team totals first (needed for kill participation, damage share, etc.)
  const teamTotals = calculateTeamTotals(match);
  const teamKillsPre15 = calculateTeamKillsPreValue(timeline, 900000); // 900000ms = 15 minutes

  // Process each participant
  for (const participant of match.participants) {
    const stats = participant.stats;
    const summonerId = getSummonerIdFromParticipant(
      match,
      participant.participantId
    );
    const { gameName, tagLine } = getSummonerNameFromParticipant(
      match,
      participant.participantId
    );
    const role = matchRoles[summonerId];

    if (!role) {
      console.warn(
        `No role found for summoner ${summonerId} in match ${match.gameId}`
      );
      continue;
    }

    // Get lane opponent for diff calculations
    const laneOpponent = findLaneOpponent(match, matchRoles, summonerId);

    const timelineStatsAt10 = extractTimelineStatsAtValue(
      timeline,
      participant.participantId,
      laneOpponent.participantId,
      600000 // 600000ms = 10 minutes
    );

    const timelineStatsAt15 = extractTimelineStatsAtValue(
      timeline,
      participant.participantId,
      laneOpponent.participantId,
      900000 // 900000ms = 15 minutes
    );

    const timelineStatsAt20 = extractTimelineStatsAtValue(
      timeline,
      participant.participantId,
      laneOpponent.participantId,
      1200000 // 1200000ms = 20 minutes
    );

    const killsAndAssistsPre15 = calculateKillsAndAssistsPreValue(
      timeline,
      participant.participantId,
      900000 // 900000ms = 15 minutes
    );

    const epicMonsterKills = calculateEpicMonsterKills(timeline);

    const participantStats: Partial<ParticipantStatsRole> = {
      // ============================================================
      // SECTION 1: Basic Match Info
      // ============================================================
      summonerId,
      gameName,
      tagLine,
      championId: participant.championId,
      role,
      win: stats.win,
      gameDuration: match.gameDuration,
      teamId: participant.teamId,
      gameDate: match.gameCreation,

      // ============================================================
      // SECTION 2: Core Stats (Direct from API)
      // ============================================================
      kills: stats.kills,
      deaths: stats.deaths,
      assists: stats.assists,
      kda: calculateKDA(stats.kills, stats.deaths, stats.assists),

      // ============================================================
      // SECTION 3: Farm Stats
      // ============================================================
      totalMinionsKilled: stats.totalMinionsKilled,
      neutralMinionsKilled: stats.neutralMinionsKilled,
      totalCS: stats.totalMinionsKilled + stats.neutralMinionsKilled,
      csPerMinute:
        (stats.totalMinionsKilled + stats.neutralMinionsKilled) /
        gameDurationMinutes,

      // ============================================================
      // SECTION 4: Gold Stats
      // ============================================================
      goldEarned: stats.goldEarned,
      goldPerMinute: stats.goldEarned / gameDurationMinutes,

      // ============================================================
      // SECTION 5: Damage Stats
      // ============================================================
      totalDamageDealtToChampions: stats.totalDamageDealtToChampions,
      damagePerMinute: stats.totalDamageDealtToChampions / gameDurationMinutes,
      physicalDamageDealtToChampions: stats.physicalDamageDealtToChampions,
      magicDamageDealtToChampions: stats.magicDamageDealtToChampions,
      trueDamageDealtToChampions: stats.trueDamageDealtToChampions,

      // ============================================================
      // SECTION 6: Vision Stats
      // ============================================================
      visionScore: stats.visionScore,
      visionScorePerMinute: stats.visionScore / gameDurationMinutes,
      wardsPlaced: stats.wardsPlaced,
      wardsKilled: stats.wardsKilled,
      visionWardsBoughtInGame: stats.visionWardsBoughtInGame,

      // ============================================================
      // SECTION 7: Objective Stats
      // ============================================================
      damageDealtToObjectives: stats.damageDealtToObjectives,
      damageDealtToTurrets: stats.damageDealtToTurrets,

      // ============================================================
      // SECTION 8: Tank/Survivability Stats
      // ============================================================
      totalDamageTaken: stats.totalDamageTaken,
      damageSelfMitigated: stats.damageSelfMitigated,

      // ============================================================
      // SECTION 9: Utility Stats
      // ============================================================
      totalHeal: stats.totalHeal,
      timeCCingOthers: stats.timeCCingOthers,
      totalTimeCrowdControlDealt: stats.totalTimeCrowdControlDealt,

      // ============================================================
      // SECTION 10: Team Contribution Stats
      // ============================================================
      teamKills: teamTotals[participant.teamId].kills,
      teamDamage: teamTotals[participant.teamId].damage,
      killParticipation: calculateKillParticipation(
        stats.kills,
        stats.assists,
        teamTotals[participant.teamId].kills
      ),
      damageShare: calculateDamageShare(
        stats.totalDamageDealtToChampions,
        teamTotals[participant.teamId].damage
      ),

      // ============================================================
      // SECTION 11: Early Game Stats (@10 min) - FROM TIMELINE
      // ============================================================

      goldAt10: timelineStatsAt10.goldAtValue,
      xpAt10: timelineStatsAt10.xpAtValue,
      csAt10: timelineStatsAt10.csAtValue,
      levelAt10: timelineStatsAt10.levelAtValue,
      goldDiffAt10: timelineStatsAt10.goldDiffAtValue, // vs lane opponent (same role, enemy team)
      xpDiffAt10: timelineStatsAt10.xpDiffAtValue,
      csDiffAt10: timelineStatsAt10.csDiffAtValue,

      // ============================================================
      // SECTION 12: Mid-Early Game Stats (@15 min) - FROM TIMELINE
      // ============================================================

      goldAt15: timelineStatsAt15.goldAtValue,
      xpAt15: timelineStatsAt15.xpAtValue,
      csAt15: timelineStatsAt15.csAtValue,
      levelAt15: timelineStatsAt15.levelAtValue,
      goldDiffAt15: timelineStatsAt15.goldDiffAtValue, // vs lane opponent (same role, enemy team)
      xpDiffAt15: timelineStatsAt15.xpDiffAtValue,
      csDiffAt15: timelineStatsAt15.csDiffAtValue,

      // ============================================================
      // SECTION 13: Mid Game Stats (@20 min) - FROM TIMELINE
      // ============================================================
      goldAt20: timelineStatsAt20.goldAtValue,
      xpAt20: timelineStatsAt20.xpAtValue,
      csAt20: timelineStatsAt20.csAtValue,
      levelAt20: timelineStatsAt20.levelAtValue,
      goldDiffAt20: timelineStatsAt20.goldDiffAtValue, // vs lane opponent (same role, enemy team)
      xpDiffAt20: timelineStatsAt20.xpDiffAtValue,
      csDiffAt20: timelineStatsAt20.csDiffAtValue,

      // ============================================================
      // SECTION 14: Advanced/Derived Stats - FROM TIMELINE EVENTS
      // ============================================================
      soloKills: calculateSoloKills(timeline, participant.participantId),
      firstBlood: stats.firstBloodKill || stats.firstBloodAssist,
      firstBloodKill: stats.firstBloodKill,
      firstBloodAssist: stats.firstBloodAssist,

      // ============================================================
      // SECTION 15: Multikills
      // ============================================================
      doubleKills: stats.doubleKills,
      tripleKills: stats.tripleKills,
      quadraKills: stats.quadraKills,
      pentaKills: stats.pentaKills,

      // ============================================================
      // SECTION 16: Turret/Structure Stats
      // ============================================================
      turretKills: stats.turretKills,
      inhibitorKills: stats.inhibitorKills,
      firstTowerKill: stats.firstTowerKill,
      firstTowerAssist: stats.firstTowerAssist,

      // ============================================================
      // SECTION 17: Kill Participation Breakdown (for Early Game Playmaker)
      // ============================================================
      killsAndAssistsPre15: killsAndAssistsPre15,
      teamKillsPre15: teamKillsPre15[participant.teamId],
      earlyGameKP: calculateEarlyGameKP(
        killsAndAssistsPre15,
        teamKillsPre15[participant.teamId]
      ),

      // ============================================================
      // SECTION 18: Efficiency Stats (for ADC)
      // ============================================================
      damagePerDeath: calculateDamagePerDeath(
        stats.totalDamageDealtToChampions,
        stats.deaths
      ),
      damagePerGold: calculateDamagePerGold(
        stats.totalDamageDealtToChampions,
        stats.goldEarned
      ),

      // ============================================================
      // SECTION 19: Advanced Timeline-Based Stats (Optional)
      // ============================================================
      objectiveControlRate:
        epicMonsterKills[participant.teamId] /
        (epicMonsterKills[100] + epicMonsterKills[200]),
      roamsSuccessful: calculateRoamsSuccessful(
        timeline,
        participant.participantId,
        role
      ),
    };

    playerStats.push(participantStats as ParticipantStatsRole);
  }

  return playerStats;
}
