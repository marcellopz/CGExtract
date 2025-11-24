import type { AllMatchStats, ParticipantStatsRole } from "../role-processing";
import { championNames } from "../../../constants/lcuData";

type PlayedByEntry = {
  summonerId: string;
  gameName: string;
  tagLine: string;
  numberOfGames: number;
  wins: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  visionScore: number;
};

type ChampionStatsEntryRole = {
  championId: string;
  championName: string;
  picks: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  creepsKilled: number;
  playedBy: {
    [summonerId: string]: PlayedByEntry;
  };
};

type ChampionStatsEntryAll = ChampionStatsEntryRole & {
  bans: number;
  presence: number;
};

export type ChampionsAverageRoleStats = {
  top: { [championId: string]: ChampionStatsEntryRole };
  jungle: { [championId: string]: ChampionStatsEntryRole };
  mid: { [championId: string]: ChampionStatsEntryRole };
  adc: { [championId: string]: ChampionStatsEntryRole };
  support: { [championId: string]: ChampionStatsEntryRole };
  all: { [championId: string]: ChampionStatsEntryAll };
};

export function calculateChampionsAverageRoleStats(
  allMatchRoleStats: AllMatchStats
): ChampionsAverageRoleStats {
  const numberOfGames = Object.keys(allMatchRoleStats).length;
  console.log("Calculating champions average role stats...");
  console.log("Total matches:", numberOfGames);

  const championsAverageRoleStats: ChampionsAverageRoleStats = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
    all: {},
  };

  // Collect matches by role and champion
  const matchesByRole: Record<
    keyof Omit<ChampionsAverageRoleStats, "all">,
    Record<string, ParticipantStatsRole[]>
  > = {
    top: {},
    jungle: {},
    mid: {},
    adc: {},
    support: {},
  };

  // Collect all matches for each champion (across all roles)
  const allMatchesByChampion: Record<string, ParticipantStatsRole[]> = {};

  // Track bans and presence for "all" stats
  const championBans: Record<string, number> = {};
  const championPresence: Record<string, Set<string>> = {}; // matchId -> Set of championIds

  for (const [matchId, matchStats] of Object.entries(allMatchRoleStats)) {
    // Track which champions were in this match (for presence calculation)
    const championsInMatch = new Set<string>();

    for (const role of Object.keys(matchStats) as Array<
      keyof Omit<ChampionsAverageRoleStats, "all">
    >) {
      for (const summonerId of Object.keys(matchStats[role])) {
        const participant = matchStats[role][summonerId];
        const championId = participant.championId.toString();

        // Track champion presence
        championsInMatch.add(championId);

        // Collect by role
        if (!matchesByRole[role][championId]) {
          matchesByRole[role][championId] = [];
        }
        matchesByRole[role][championId].push(participant);

        // Collect all matches for this champion (across all roles)
        if (!allMatchesByChampion[championId]) {
          allMatchesByChampion[championId] = [];
        }
        allMatchesByChampion[championId].push(participant);
      }
    }

    // Update presence tracking
    championsInMatch.forEach((championId) => {
      if (!championPresence[championId]) {
        championPresence[championId] = new Set();
      }
      championPresence[championId].add(matchId);
    });
  }

  // Calculate stats for each role
  for (const role of Object.keys(matchesByRole) as Array<
    keyof Omit<ChampionsAverageRoleStats, "all">
  >) {
    for (const [championId, matches] of Object.entries(matchesByRole[role])) {
      if (!matches.length) continue;

      const picks = matches.length;
      const wins = matches.filter((m) => m.win).length;

      // Calculate averages
      const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
      const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
      const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
      const totalCreepsKilled = matches.reduce((sum, m) => sum + m.totalCS, 0);

      const championName =
        championNames[parseInt(championId)] || `Champion ${championId}`;

      // Calculate playedBy stats - group matches by player
      const matchesByPlayer: Record<string, ParticipantStatsRole[]> = {};
      for (const match of matches) {
        const summonerId = match.summonerId;
        if (!matchesByPlayer[summonerId]) {
          matchesByPlayer[summonerId] = [];
        }
        matchesByPlayer[summonerId].push(match);
      }

      const playedBy: { [summonerId: string]: PlayedByEntry } = {};
      for (const [summonerId, playerMatches] of Object.entries(
        matchesByPlayer
      )) {
        const numberOfGames = playerMatches.length;
        const playerWins = playerMatches.filter((m) => m.win).length;

        // Calculate averages for this player
        const totalKills = playerMatches.reduce((sum, m) => sum + m.kills, 0);
        const totalDeaths = playerMatches.reduce((sum, m) => sum + m.deaths, 0);
        const totalAssists = playerMatches.reduce(
          (sum, m) => sum + m.assists,
          0
        );
        const totalCreepScore = playerMatches.reduce(
          (sum, m) => sum + m.totalCS,
          0
        );
        const totalVisionScore = playerMatches.reduce(
          (sum, m) => sum + m.visionScore,
          0
        );

        // Calculate KDA: (kills + assists) / max(deaths, 1)
        const avgKills = totalKills / numberOfGames;
        const avgDeaths = totalDeaths / numberOfGames;
        const avgAssists = totalAssists / numberOfGames;
        const kda = (avgKills + avgAssists) / Math.max(avgDeaths, 1);

        const mostRecentMatch = playerMatches[0];

        playedBy[summonerId] = {
          summonerId,
          gameName: mostRecentMatch.gameName,
          tagLine: mostRecentMatch.tagLine,
          numberOfGames,
          wins: playerWins,
          kda,
          kills: avgKills,
          deaths: avgDeaths,
          assists: avgAssists,
          creepScore: totalCreepScore / numberOfGames,
          visionScore: totalVisionScore / numberOfGames,
        };
      }

      championsAverageRoleStats[role][championId] = {
        championId,
        championName,
        picks,
        wins,
        kills: totalKills / picks,
        deaths: totalDeaths / picks,
        assists: totalAssists / picks,
        creepsKilled: totalCreepsKilled / picks,
        playedBy,
      };
    }
  }

  // Calculate stats for all games (across all roles)
  for (const [championId, matches] of Object.entries(allMatchesByChampion)) {
    if (!matches.length) continue;

    const picks = matches.length;
    const wins = matches.filter((m) => m.win).length;

    // Calculate averages
    const totalKills = matches.reduce((sum, m) => sum + m.kills, 0);
    const totalDeaths = matches.reduce((sum, m) => sum + m.deaths, 0);
    const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);
    const totalCreepsKilled = matches.reduce((sum, m) => sum + m.totalCS, 0);

    const championName =
      championNames[parseInt(championId)] || `Champion ${championId}`;

    // Calculate bans (from championBans if available, otherwise 0)
    const bans = championBans[championId] || 0;

    // Calculate presence (number of matches where champion was picked or banned)
    const presence = championPresence[championId]
      ? championPresence[championId].size
      : picks;

    // Calculate playedBy stats - group matches by player
    const matchesByPlayer: Record<string, ParticipantStatsRole[]> = {};
    for (const match of matches) {
      const summonerId = match.summonerId;
      if (!matchesByPlayer[summonerId]) {
        matchesByPlayer[summonerId] = [];
      }
      matchesByPlayer[summonerId].push(match);
    }

    const playedBy: { [summonerId: string]: PlayedByEntry } = {};
    for (const [summonerId, playerMatches] of Object.entries(matchesByPlayer)) {
      const numberOfGames = playerMatches.length;
      const playerWins = playerMatches.filter((m) => m.win).length;

      // Calculate averages for this player
      const totalKills = playerMatches.reduce((sum, m) => sum + m.kills, 0);
      const totalDeaths = playerMatches.reduce((sum, m) => sum + m.deaths, 0);
      const totalAssists = playerMatches.reduce((sum, m) => sum + m.assists, 0);
      const totalCreepScore = playerMatches.reduce(
        (sum, m) => sum + m.totalCS,
        0
      );
      const totalVisionScore = playerMatches.reduce(
        (sum, m) => sum + m.visionScore,
        0
      );

      // Calculate KDA: (kills + assists) / max(deaths, 1)
      const avgKills = totalKills / numberOfGames;
      const avgDeaths = totalDeaths / numberOfGames;
      const avgAssists = totalAssists / numberOfGames;
      const kda = (avgKills + avgAssists) / Math.max(avgDeaths, 1);

      const mostRecentMatch = playerMatches[0];

      playedBy[summonerId] = {
        summonerId,
        gameName: mostRecentMatch.gameName,
        tagLine: mostRecentMatch.tagLine,
        numberOfGames,
        wins: playerWins,
        kda,
        kills: avgKills,
        deaths: avgDeaths,
        assists: avgAssists,
        creepScore: totalCreepScore / numberOfGames,
        visionScore: totalVisionScore / numberOfGames,
      };
    }

    championsAverageRoleStats.all[championId] = {
      championId,
      championName,
      picks,
      wins,
      kills: totalKills / picks,
      deaths: totalDeaths / picks,
      assists: totalAssists / picks,
      creepsKilled: totalCreepsKilled / picks,
      bans,
      presence,
      playedBy,
    };
  }

  return championsAverageRoleStats;
}
