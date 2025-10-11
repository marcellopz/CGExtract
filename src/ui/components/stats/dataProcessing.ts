/* eslint-disable no-prototype-builtins */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { championNames } from "../../constants/lcuData";

// Process Data Player Functions
const getRecords = (playerMatches: any) => {
  const records = {
    kills: { n: 0, win: null, gameId: null },
    assists: { n: 0, win: null, gameId: null },
    deaths: { n: 0, win: null, gameId: null },
    damage: { n: 0, win: null, gameId: null },
    damageTaken: { n: 0, win: null, gameId: null },
    killingSpree: { n: 0, win: null, gameId: null },
    multiKill: { n: 0, win: null, gameId: null },
    cs: { n: 0, win: null, gameId: null },
    csPerMin: { n: 0, win: null, gameId: null },
    shortestGame: { n: Infinity, win: null, gameId: null },
    longestGame: { n: 0, win: null, gameId: null },
    visionScore: { n: 0, win: null, gameId: null },
  };

  Object.entries(playerMatches).forEach(([k, m]: [string, any]) => {
    if (m.stats.kills > records.kills.n) {
      records.kills.n = m.stats.kills;
      records.kills.win = m.stats.win;
      records.kills.gameId = k;
    }
    if (m.stats.assists > records.assists.n) {
      records.assists.n = m.stats.assists;
      records.assists.win = m.stats.win;
      records.assists.gameId = k;
    }
    if (m.stats.deaths > records.deaths.n) {
      records.deaths.n = m.stats.deaths;
      records.deaths.win = m.stats.win;
      records.deaths.gameId = k;
    }
    if (m.stats.totalDamageDealtToChampions > records.damage.n) {
      records.damage.n = m.stats.totalDamageDealtToChampions;
      records.damage.win = m.stats.win;
      records.damage.gameId = k;
    }
    if (m.stats.totalDamageTaken > records.damageTaken.n) {
      records.damageTaken.n = m.stats.totalDamageTaken;
      records.damageTaken.win = m.stats.win;
      records.damageTaken.gameId = k;
    }
    if (m.stats.largestKillingSpree > records.killingSpree.n) {
      records.killingSpree.n = m.stats.largestKillingSpree;
      records.killingSpree.win = m.stats.win;
      records.killingSpree.gameId = k;
    }
    if (m.stats.largestMultiKill > records.multiKill.n) {
      records.multiKill.n = m.stats.largestMultiKill;
      records.multiKill.win = m.stats.win;
      records.multiKill.gameId = k;
    }
    if (m.stats.visionScore > records.visionScore.n) {
      records.visionScore.n = m.stats.visionScore;
      records.visionScore.win = m.stats.win;
      records.visionScore.gameId = k;
    }
    if (m.stats.totalCs > records.cs.n) {
      records.cs.n = m.stats.totalCs;
      records.cs.win = m.stats.win;
      records.cs.gameId = k;
    }
    if (m.stats.totalCs / (m.gameDuration / 60) > records.csPerMin.n) {
      records.csPerMin.n = m.stats.totalCs / (m.gameDuration / 60);
      records.csPerMin.win = m.stats.win;
      records.csPerMin.gameId = k;
    }
    if (m.gameDuration < records.shortestGame.n) {
      records.shortestGame.n = m.gameDuration;
      records.shortestGame.win = m.stats.win;
      records.shortestGame.gameId = k;
    }
    if (m.gameDuration > records.longestGame.n) {
      records.longestGame.n = m.gameDuration;
      records.longestGame.win = m.stats.win;
      records.longestGame.gameId = k;
    }
  });
  return records;
};

export function processDataPlayer(playerMatches: any, matchRoles: any) {
  let wins = 0;
  let firstBloods = 0;
  let winsArray: number[] = [];
  const blueSide = { wins: 0, games: 0 };
  const redSide = { wins: 0, games: 0 };
  const championMatches: Record<string, any[]> = {};
  const roleMatches = {
    top: { wins: 0, games: 0 },
    jungle: { wins: 0, games: 0 },
    mid: { wins: 0, games: 0 },
    adc: { wins: 0, games: 0 },
    support: { wins: 0, games: 0 },
  };

  const playerMatchesIds = Object.keys(playerMatches);
  const numberOfMatches = playerMatchesIds.length;
  const summonerName =
    playerMatches[playerMatchesIds[numberOfMatches - 1]].summonerName;
  const summonerId =
    playerMatches[playerMatchesIds[numberOfMatches - 1]].summonerId;
  const tagLine = playerMatches[playerMatchesIds[numberOfMatches - 1]].tagLine;

  playerMatchesIds.forEach((matchId) => {
    const matchRole = matchRoles[matchId]?.[summonerId];
    if (matchRole) {
      roleMatches[matchRole as keyof typeof roleMatches].games += 1;
    }

    const match = playerMatches[matchId];
    firstBloods += match.stats.firstBloodKill;
    wins += match.stats.win;
    winsArray = [...winsArray, wins];

    if (match.teamId === 100) {
      blueSide.games += 1;
      blueSide.wins += match.stats.win;
    }

    if (match.teamId === 200) {
      redSide.games += 1;
      redSide.wins += match.stats.win;
    }

    if (matchRole) {
      roleMatches[matchRole as keyof typeof roleMatches].wins +=
        match.stats.win;
    }

    const champions = Object.keys(championMatches);
    const championId = match.championId.toString();
    if (champions.includes(championId)) {
      championMatches[championId] = [...championMatches[championId], match];
    } else {
      championMatches[championId] = [match];
    }
  });

  const championStats: any = {};

  Object.keys(championMatches).forEach((championId) => {
    let champWins = 0;
    let champKills = 0;
    let champDeaths = 0;
    let champAssists = 0;
    let champDamageToTurrets = 0;
    let champGoldEarned = 0;
    let champDamageToChampions = 0;
    let champDamageTaken = 0;
    let champCreepScore = 0;
    let champVisionScore = 0;
    let champVisionWardsBought = 0;
    let champDamageSelfMitigated = 0;
    let numberOfMatches = championMatches[championId].length;

    championMatches[championId].forEach((match: any) => {
      champWins = champWins + match.stats.win;
      champKills = champKills + match.stats.kills;
      champDeaths = champDeaths + match.stats.deaths;
      champAssists = champAssists + match.stats.assists;
      champDamageToTurrets =
        champDamageToTurrets + match.stats.damageDealtToTurrets;
      champGoldEarned = champGoldEarned + match.stats.goldEarned;
      champDamageToChampions =
        champDamageToChampions + match.stats.totalDamageDealtToChampions;
      champDamageTaken = champDamageTaken + match.stats.totalDamageTaken;
      champCreepScore = champCreepScore + match.stats.totalCs;
      champVisionScore = champVisionScore + match.stats.visionScore;
      champVisionWardsBought =
        champVisionWardsBought + match.stats.visionWardsBoughtInGame;
      champDamageSelfMitigated =
        champDamageSelfMitigated + match.stats.damageSelfMitigated;
    });

    championStats[championId] = {
      championName: championMatches[championId][0].championName,
      championId,
      numberOfMatches,
      winRate: champWins / numberOfMatches,
      kda:
        champDeaths === 0
          ? "Infinity"
          : (champKills + champAssists) / champDeaths,
      AveragePerMatch: {
        kills: champKills / numberOfMatches,
        deaths: champDeaths / numberOfMatches,
        assists: champAssists / numberOfMatches,
        damageToTurrets: champDamageToTurrets / numberOfMatches,
        goldEarned: champGoldEarned / numberOfMatches,
        damageToChampions: champDamageToChampions / numberOfMatches,
        damageTaken: champDamageTaken / numberOfMatches,
        creepScore: isNaN(champCreepScore)
          ? 0
          : champCreepScore / numberOfMatches,
        visionScore: champVisionScore / numberOfMatches,
        visionWardsBought: champVisionWardsBought / numberOfMatches,
        damageSelfMitigates: champDamageSelfMitigated / numberOfMatches,
      },
    };
  });

  return {
    summonerName,
    summonerId,
    winRate: wins / numberOfMatches,
    numberOfMatches,
    championStats,
    playerMatchesIds,
    roleMatches,
    statsPerSide: { blueSide, redSide },
    winsArray,
    firstBloods,
    records: getRecords(playerMatches),
    tagLine,
  };
}

// Process Data All Functions
export const processPlayerPairs = (matches: any) => {
  const pairs: any = {};
  Object.values(matches).forEach((match: any) => {
    const winnerTeam = match.teams.filter((t: any) => t.win === "Win")[0]
      .teamId;
    match.participants.forEach((p1: any) => {
      let p1id = p1.summonerId;
      if (!pairs.hasOwnProperty(p1id)) {
        pairs[p1id] = {};
      }
      match.participants.forEach((p2: any) => {
        let p2id = p2.summonerId;
        if (p1id === p2id) {
          return;
        }
        if (!pairs[p1id].hasOwnProperty(p2id)) {
          pairs[p1id][p2id] = {
            same_team: { wins: 0, games: 0 },
            opposite_team: { wins: 0, games: 0 },
          };
        }
        if (p1.teamId === p2.teamId) {
          pairs[p1id][p2id].same_team.games += 1;
          pairs[p1id][p2id].same_team.wins += p1.teamId === winnerTeam ? 1 : 0;
        } else {
          pairs[p1id][p2id].opposite_team.games += 1;
          pairs[p1id][p2id].opposite_team.wins +=
            p1.teamId === winnerTeam ? 1 : 0;
        }
      });
    });
  });

  return pairs;
};

const RECENT_MATCHES_COUNT = 10;
const LAST_N_GAMES_FOR_LEADERBOARD = 20;

type LeaderboardEntry = {
  summonerId: string;
  value: number;
  legend_name: string;
  legend_id: string;
};

type OverallPlayerLeaderboard = {
  numberOfGames: LeaderboardEntry[];
  winRate: LeaderboardEntry[];
  winRateLast20Games: LeaderboardEntry[];
  numberOfChampionsPlayed: LeaderboardEntry[];
  killParticipation: LeaderboardEntry[];
};

export function processDataAll(matches: any, legends: any) {
  let gameDurationTotal = 0;
  const blueSide = {
    baronKills: 0,
    dragonKills: 0,
    firstBaron: 0,
    firstBlood: 0,
    firstDragon: 0,
    firstInhibitor: 0,
    firstTower: 0,
    riftHeraldKills: 0,
    towerKills: 0,
    wins: 0,
  };
  const redSide = {
    baronKills: 0,
    dragonKills: 0,
    firstBaron: 0,
    firstBlood: 0,
    firstDragon: 0,
    firstInhibitor: 0,
    firstTower: 0,
    riftHeraldKills: 0,
    towerKills: 0,
    wins: 0,
  };

  // Track player statistics for leaderboard
  const playerStats: Record<
    string,
    {
      games: number;
      wins: number;
      champions: Set<string>;
      killParticipation: number[];
      recentGames: boolean[]; // Track last 20 games wins
    }
  > = {};

  const championNamesArray = Object.keys(championNames);
  const champions: any = {};
  championNamesArray.forEach(
    (id) =>
      (champions[id] = {
        championId: id,
        championName: championNames[parseInt(id)],
        picks: 0,
        bans: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        creepsKilled: 0,
      })
  );
  const gamesPerMonth: any = {};
  // Initialize weekDayDistribution object to track games by day of week
  const weekDayDistribution: any = {
    0: 0, // Sunday
    1: 0, // Monday
    2: 0, // Tuesday
    3: 0, // Wednesday
    4: 0, // Thursday
    5: 0, // Friday
    6: 0, // Saturday
  };
  // Initialize game duration histogram (grouped in 3-minute intervals)
  const gameDurationHistogram: any = {};
  // Initialize hourly distribution to track games by hour of day (0-23)
  const hourlyDistribution: any = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    11: 0,
    12: 0,
    13: 0,
    14: 0,
    15: 0,
    16: 0,
    17: 0,
    18: 0,
    19: 0,
    20: 0,
    21: 0,
    22: 0,
    23: 0,
  };
  let earliestDate: Date | null = null;
  let latestDate: Date | null = null;
  let mostRecentGameTimestamp: number | null = null;

  // Convert matches object to array and sort by date to find recent matches
  const matchesArray = Object.values(matches);
  const sortedMatches = matchesArray
    .filter(
      (match: any) => match.date && !isNaN(new Date(match.date).getTime())
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  // Get the most recent matches for player win tracking
  const recentMatches = sortedMatches.slice(0, RECENT_MATCHES_COUNT);
  const playerWinsInRecentMatches: Record<string, number> = {};

  // Process recent matches to track player wins
  recentMatches.forEach((match: any) => {
    const winnerTeam = match.teams.filter((t: any) => t.win === "Win")[0]
      ?.teamId;
    if (winnerTeam) {
      match.participants.forEach((participant: any) => {
        if (participant.teamId === winnerTeam) {
          const playerId = participant.summonerId;
          playerWinsInRecentMatches[playerId] =
            (playerWinsInRecentMatches[playerId] || 0) + 1;
        }
      });
    }
  });

  // Find player with most wins in recent matches
  let topRecentPlayer = null;
  let maxRecentWins = 0;
  Object.entries(playerWinsInRecentMatches).forEach(
    ([playerId, wins]: [string, number]) => {
      if (wins > maxRecentWins) {
        maxRecentWins = wins;
        topRecentPlayer = playerId;
      }
    }
  );

  // Set most recent game timestamp
  if (sortedMatches.length > 0) {
    mostRecentGameTimestamp = new Date(
      (sortedMatches[0] as any).date
    ).getTime();
  }

  Object.values(matches).forEach((match: any) => {
    gameDurationTotal += match.gameDuration;

    // Update game duration histogram (group in 3-minute intervals)
    // Convert seconds to minutes and find the 3-minute interval
    const durationMinutes = Math.floor(match.gameDuration / 60);
    const intervalKey = Math.floor(durationMinutes / 3) * 3;
    const intervalLabel = `${intervalKey}-${intervalKey + 3}`;
    gameDurationHistogram[intervalLabel] =
      (gameDurationHistogram[intervalLabel] || 0) + 1;

    // Calculate team kills for kill participation
    const teamKills: Record<number, number> = {};
    match.participants.forEach((p: any) => {
      teamKills[p.teamId] = (teamKills[p.teamId] || 0) + p.stats.kills;
    });

    match.participants.forEach((p: any) => {
      const playerId = p.summonerId.toString();

      // Initialize player stats if not exists
      if (!playerStats[playerId]) {
        playerStats[playerId] = {
          games: 0,
          wins: 0,
          champions: new Set(),
          killParticipation: [],
          recentGames: [],
        };
      }

      // Update player stats
      playerStats[playerId].games += 1;
      playerStats[playerId].wins += p.stats.win;
      playerStats[playerId].champions.add(p.championId.toString());

      // Calculate kill participation for this game
      const teamKillsForPlayer = teamKills[p.teamId] || 1;
      const kp =
        (p.stats.kills + p.stats.assists) / Math.max(teamKillsForPlayer, 1);
      playerStats[playerId].killParticipation.push(kp);

      champions[p.championId].picks += 1;
      champions[p.championId].wins += p.stats.win;
      champions[p.championId].kills += p.stats.kills;
      champions[p.championId].deaths += p.stats.deaths;
      champions[p.championId].assists += p.stats.assists;
      champions[p.championId].creepsKilled += p.stats.totalCs;
    });
    const blue = match.teams.filter((t: any) => t.teamId === 100)[0];
    blueSide.baronKills += blue.baronKills;
    blueSide.dragonKills += blue.dragonKills;
    blueSide.firstBlood += blue.firstBlood;
    blueSide.firstBaron += blue.firstBaron;
    blueSide.firstDragon += blue.firstDargon;
    blueSide.firstTower += blue.firstTower;
    blueSide.firstInhibitor += blue.firstInhibitor;
    blueSide.riftHeraldKills += blue.riftHeraldKills;
    blueSide.towerKills += blue.towerKills;
    blueSide.wins += blue.win === "Win" ? 1 : 0;
    blue.bans?.forEach((b: any) => {
      if (b.championId < 0) return;
      champions[b.championId].bans += 1;
    });

    const red = match.teams.filter((t: any) => t.teamId === 200)[0];
    redSide.baronKills += red.baronKills;
    redSide.dragonKills += red.dragonKills;
    redSide.firstBlood += red.firstBlood;
    redSide.firstBaron += red.firstBaron;
    redSide.firstDragon += red.firstDargon;
    redSide.firstTower += red.firstTower;
    redSide.firstInhibitor += red.firstInhibitor;
    redSide.riftHeraldKills += red.riftHeraldKills;
    redSide.towerKills += red.towerKills;
    redSide.wins += red.win === "Win" ? 1 : 0;
    red.bans?.forEach((b: any) => {
      if (b.championId < 0) return;
      champions[b.championId].bans += 1;
    });

    const gameDateString = match?.date;

    if (gameDateString) {
      try {
        const date = new Date(gameDateString);

        // Check if the date is valid
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth() + 1; // getMonth() is 0-indexed
          const monthYear = `${year}-${month.toString().padStart(2, "0")}`; // Format as YYYY-MM

          gamesPerMonth[monthYear] = (gamesPerMonth[monthYear] || 0) + 1;

          // Update earliest and latest date (using timestamps for comparison)
          if (!earliestDate || date.getTime() < earliestDate.getTime()) {
            earliestDate = date;
          }
          if (!latestDate || date.getTime() > latestDate.getTime()) {
            latestDate = date;
          }

          // Update the weekday distribution
          const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
          weekDayDistribution[dayOfWeek] += 1;

          // Update the hourly distribution
          const hourOfDay = date.getHours(); // 0-23
          hourlyDistribution[hourOfDay] += 1;
        } else {
          console.error(
            `Invalid date string for match ${match.gameId}: ${gameDateString}`
          );
        }
      } catch (error) {
        console.error(
          `Error processing date for match ${match.gameId}: ${gameDateString}`,
          error
        );
      }
    } else {
      console.error(
        `No gameCreationDate for match ${match.gameId} - ${match.gameDateString}`
      );
    }
  });

  // Now that playerStats is initialized, populate recentGames for leaderboard
  const lastNGamesForLeaderboard = sortedMatches.slice(
    0,
    LAST_N_GAMES_FOR_LEADERBOARD
  );

  lastNGamesForLeaderboard.forEach((match: any) => {
    match.participants.forEach((participant: any) => {
      const playerId = participant.summonerId.toString();

      // Track last N games for each player (for leaderboard)
      if (playerStats[playerId]) {
        // stats.win can be boolean (true/false) or number (1/0)
        playerStats[playerId].recentGames.push(!!participant.stats.win);
      }
    });
  });

  // Fill in missing months and add padding
  const paddedGamesPerMonth: any = {};

  if (
    earliestDate &&
    latestDate &&
    !isNaN(earliestDate.getTime()) &&
    !isNaN(latestDate.getTime())
  ) {
    // Get the year and month of the earliest and latest months
    const earliestYear = earliestDate.getFullYear();
    const earliestMonthIndex = earliestDate.getMonth(); // 0-indexed

    const latestYear = latestDate.getFullYear();
    const latestMonthIndex = latestDate.getMonth(); // 0-indexed

    let startYear = earliestYear;
    let startMonthIndex = earliestMonthIndex - 1;
    if (startMonthIndex < 0) {
      startYear--;
      startMonthIndex = 11; // December
    }

    let endYear = latestYear;
    let endMonthIndex = latestMonthIndex + 1;
    if (endMonthIndex > 11) {
      endYear++;
      endMonthIndex = 0; // January
    }

    let currentYear = startYear;
    let currentMonthIndex = startMonthIndex;

    // Iterate through all months in the padded range
    while (
      currentYear < endYear ||
      (currentYear === endYear && currentMonthIndex <= endMonthIndex)
    ) {
      const monthYear = `${currentYear}-${(currentMonthIndex + 1)
        .toString()
        .padStart(2, "0")}`;

      // Use the count from gamesPerMonth, default to 0 if missing
      paddedGamesPerMonth[monthYear] = gamesPerMonth[monthYear] || 0;

      // Move to the next month
      currentMonthIndex++;
      if (currentMonthIndex > 11) {
        currentYear++;
        currentMonthIndex = 0;
      }
    }
  } else {
    console.error("No valid dates found for padding.");
  }

  // Sort game duration histogram keys numerically
  const sortedGameDurationHistogram: any = {};
  Object.keys(gameDurationHistogram)
    .map((key) => {
      // Extract the first number from the interval (e.g., "6-9" becomes 6)
      return parseInt(key.split("-")[0]);
    })
    .sort((a, b) => a - b)
    .forEach((intervalStart) => {
      const key = `${intervalStart}-${intervalStart + 3}`;
      sortedGameDurationHistogram[key] = gameDurationHistogram[key];
    });

  // Calculate leaderboards
  const createLeaderboardEntry = (
    playerId: string,
    value: number
  ): LeaderboardEntry => {
    const legend = legends
      ? Object.values(legends).find(
          (l: any) => l.account_id === Number(playerId)
        )
      : null;
    return {
      summonerId: playerId,
      value,
      legend_name: legend ? (legend as any).name : "",
      legend_id: legend ? (legend as any).name_id : "",
    };
  };

  // Number of games leaderboard
  const numberOfGamesLeaderboard = Object.entries(playerStats)
    .map(([playerId, stats]) => createLeaderboardEntry(playerId, stats.games))
    .sort((a, b) => b.value - a.value);

  // Win rate leaderboard (minimum 5 games)
  const winRateLeaderboard = Object.entries(playerStats)
    .filter(([, stats]) => stats.games >= 5)
    .map(([playerId, stats]) =>
      createLeaderboardEntry(playerId, stats.wins / stats.games)
    )
    .sort((a, b) => b.value - a.value);

  // Win rate last N games leaderboard (minimum half of N games required)
  const winRateLast20GamesLeaderboard = Object.entries(playerStats)
    .filter(
      ([, stats]) =>
        stats.recentGames.length >= LAST_N_GAMES_FOR_LEADERBOARD / 2
    )
    .map(([playerId, stats]) => {
      const lastNGames = stats.recentGames.slice(
        0,
        LAST_N_GAMES_FOR_LEADERBOARD
      );
      const wins = lastNGames.filter((w) => w).length;
      return createLeaderboardEntry(playerId, wins / lastNGames.length);
    })
    .sort((a, b) => b.value - a.value);

  // Number of champions played leaderboard
  const numberOfChampionsPlayedLeaderboard = Object.entries(playerStats)
    .map(([playerId, stats]) =>
      createLeaderboardEntry(playerId, stats.champions.size)
    )
    .sort((a, b) => b.value - a.value);

  // Kill participation leaderboard (minimum 5 games)
  const killParticipationLeaderboard = Object.entries(playerStats)
    .filter(([, stats]) => stats.games >= 5)
    .map(([playerId, stats]) => {
      const avgKP =
        stats.killParticipation.reduce((sum, kp) => sum + kp, 0) /
        stats.killParticipation.length;
      return createLeaderboardEntry(playerId, avgKP);
    })
    .sort((a, b) => b.value - a.value);

  const leaderboard: OverallPlayerLeaderboard = {
    numberOfGames: numberOfGamesLeaderboard,
    winRate: winRateLeaderboard,
    winRateLast20Games: winRateLast20GamesLeaderboard,
    numberOfChampionsPlayed: numberOfChampionsPlayedLeaderboard,
    killParticipation: killParticipationLeaderboard,
  };

  return {
    gamesPerMonth: paddedGamesPerMonth,
    blueSide,
    redSide,
    champions,
    gameDurationTotal,
    numberOfGames: Object.keys(matches).length,
    weekDayDistribution, // Include the weekday distribution in the return value
    gameDurationHistogram: sortedGameDurationHistogram, // Include sorted game duration histogram
    hourlyDistribution, // Include games played per hour of day
    lastGame: latestDate ? latestDate.toISOString() : null, // Latest game date as string (YYYY-MM-DD)
    mostRecentGameTimestamp, // Timestamp of the most recent game
    topRecentPlayer: topRecentPlayer ? Number(topRecentPlayer) : null, // Player ID with most wins in recent matches
    leaderboard, // Include the leaderboard data
  };
}
