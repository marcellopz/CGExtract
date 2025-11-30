import type { MatchesObj, TimelineObj } from "../role-processing/index";
import type { MonsterSubType } from "../timelapse";

type StatEntry = {
  total: number;
  wins: number;
  winRate: number;
};

type DragonTypeStats = {
  first: StatEntry;
  any: StatEntry;
  multiple: StatEntry;
};

export type VictoryStatistics = {
  firstDragon: StatEntry;
  atakhan: StatEntry;
  firstBlood: StatEntry;
  firstBaron: StatEntry;
  firstTower: StatEntry;
  firstInhibitor: StatEntry;
  riftHerald: StatEntry;
  elderDragon: StatEntry;
  baron: StatEntry;
  voidGrubs: {
    exact: {
      one: StatEntry;
      two: StatEntry;
      three: StatEntry;
    };
    atLeast: {
      one: StatEntry;
      two: StatEntry;
      three: StatEntry;
    };
  };
  dragons: {
    exact: {
      one: StatEntry;
      two: StatEntry;
      three: StatEntry;
      four: StatEntry;
    };
    atLeast: {
      one: StatEntry;
      two: StatEntry;
      three: StatEntry;
      four: StatEntry;
    };
    dragonSoul: StatEntry;
    types: {
      fire: DragonTypeStats;
      water: DragonTypeStats;
      air: DragonTypeStats;
      earth: DragonTypeStats;
      hextech: DragonTypeStats;
      chemtech: DragonTypeStats;
    };
  };
};

function createStatEntry(): StatEntry {
  return { total: 0, wins: 0, winRate: 0 };
}

function createDragonTypeStats(): DragonTypeStats {
  return {
    first: createStatEntry(),
    any: createStatEntry(),
    multiple: createStatEntry(),
  };
}

function initializeVictoryStatistics(): VictoryStatistics {
  return {
    firstDragon: createStatEntry(),
    atakhan: createStatEntry(),
    firstBlood: createStatEntry(),
    firstBaron: createStatEntry(),
    firstTower: createStatEntry(),
    firstInhibitor: createStatEntry(),
    riftHerald: createStatEntry(),
    elderDragon: createStatEntry(),
    baron: createStatEntry(),
    voidGrubs: {
      exact: {
        one: createStatEntry(),
        two: createStatEntry(),
        three: createStatEntry(),
      },
      atLeast: {
        one: createStatEntry(),
        two: createStatEntry(),
        three: createStatEntry(),
      },
    },
    dragons: {
      exact: {
        one: createStatEntry(),
        two: createStatEntry(),
        three: createStatEntry(),
        four: createStatEntry(),
      },
      atLeast: {
        one: createStatEntry(),
        two: createStatEntry(),
        three: createStatEntry(),
        four: createStatEntry(),
      },
      dragonSoul: createStatEntry(),
      types: {
        fire: createDragonTypeStats(),
        water: createDragonTypeStats(),
        air: createDragonTypeStats(),
        earth: createDragonTypeStats(),
        hextech: createDragonTypeStats(),
        chemtech: createDragonTypeStats(),
      },
    },
  };
}

function incrementStat(stat: StatEntry, won: boolean) {
  stat.total++;
  if (won) {
    stat.wins++;
  }
}

function calculateWinRates(stats: VictoryStatistics): void {
  const calculateRate = (entry: StatEntry) => {
    if (entry.total > 0) {
      entry.winRate = Number(((entry.wins / entry.total) * 100).toFixed(2));
    }
  };

  // Simple stats
  calculateRate(stats.firstDragon);
  calculateRate(stats.atakhan);
  calculateRate(stats.firstBlood);
  calculateRate(stats.firstBaron);
  calculateRate(stats.firstTower);
  calculateRate(stats.firstInhibitor);
  calculateRate(stats.riftHerald);
  calculateRate(stats.elderDragon);
  calculateRate(stats.baron);

  // Void grubs
  Object.values(stats.voidGrubs.exact).forEach(calculateRate);
  Object.values(stats.voidGrubs.atLeast).forEach(calculateRate);

  // Dragons
  Object.values(stats.dragons.exact).forEach(calculateRate);
  Object.values(stats.dragons.atLeast).forEach(calculateRate);
  calculateRate(stats.dragons.dragonSoul);

  // Dragon types
  Object.values(stats.dragons.types).forEach((typeStats) => {
    calculateRate(typeStats.first);
    calculateRate(typeStats.any);
    calculateRate(typeStats.multiple);
  });
}

function getDragonTypeKey(
  subType: MonsterSubType
): keyof VictoryStatistics["dragons"]["types"] | null {
  switch (subType) {
    case "FIRE_DRAGON":
      return "fire";
    case "WATER_DRAGON":
      return "water";
    case "AIR_DRAGON":
      return "air";
    case "EARTH_DRAGON":
      return "earth";
    case "HEXTECH_DRAGON":
      return "hextech";
    case "CHEMTECH_DRAGON":
      return "chemtech";
    default:
      return null;
  }
}

export function calculateVictoryStatistics(
  allMatches: MatchesObj,
  timelines: TimelineObj
): VictoryStatistics {
  const stats = initializeVictoryStatistics();

  // Iterate through all matches
  for (const [matchId, match] of Object.entries(allMatches)) {
    if (!match.teams || match.teams.length < 2) continue;

    const blue = match.teams.find((t) => t.teamId === 100);
    const red = match.teams.find((t) => t.teamId === 200);

    if (!blue || !red) continue;

    const blueWon = blue.win === "Win";
    const redWon = red.win === "Win";

    // Process team objectives from match.teams
    // First Dragon (note: typo in code uses firstDargon)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blueAny = blue as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const redAny = red as any;
    if (blueAny.firstDragon || blueAny.firstDargon) {
      incrementStat(stats.firstDragon, blueWon);
    }
    if (redAny.firstDragon || redAny.firstDargon) {
      incrementStat(stats.firstDragon, redWon);
    }

    // First Blood
    if (blue.firstBlood) {
      incrementStat(stats.firstBlood, blueWon);
    }
    if (red.firstBlood) {
      incrementStat(stats.firstBlood, redWon);
    }

    // First Baron
    if (blue.firstBaron) {
      incrementStat(stats.firstBaron, blueWon);
    }
    if (red.firstBaron) {
      incrementStat(stats.firstBaron, redWon);
    }

    // First Tower
    if (blue.firstTower) {
      incrementStat(stats.firstTower, blueWon);
    }
    if (red.firstTower) {
      incrementStat(stats.firstTower, redWon);
    }

    // First Inhibitor
    if (blue.firstInhibitor) {
      incrementStat(stats.firstInhibitor, blueWon);
    }
    if (red.firstInhibitor) {
      incrementStat(stats.firstInhibitor, redWon);
    }

    // Rift Herald
    if ((blue.riftHeraldKills || 0) > 0) {
      incrementStat(stats.riftHerald, blueWon);
    }
    if ((red.riftHeraldKills || 0) > 0) {
      incrementStat(stats.riftHerald, redWon);
    }

    // Baron
    if ((blue.baronKills || 0) > 0) {
      incrementStat(stats.baron, blueWon);
    }
    if ((red.baronKills || 0) > 0) {
      incrementStat(stats.baron, redWon);
    }

    // Dragons - count from team.dragonKills
    const blueDragons = blue.dragonKills || 0;
    const redDragons = red.dragonKills || 0;

    // Exact dragon counts
    if (blueDragons === 1) incrementStat(stats.dragons.exact.one, blueWon);
    if (blueDragons === 2) incrementStat(stats.dragons.exact.two, blueWon);
    if (blueDragons === 3) incrementStat(stats.dragons.exact.three, blueWon);
    if (blueDragons >= 4) incrementStat(stats.dragons.exact.four, blueWon);

    if (redDragons === 1) incrementStat(stats.dragons.exact.one, redWon);
    if (redDragons === 2) incrementStat(stats.dragons.exact.two, redWon);
    if (redDragons === 3) incrementStat(stats.dragons.exact.three, redWon);
    if (redDragons >= 4) incrementStat(stats.dragons.exact.four, redWon);

    // At-least dragon counts
    if (blueDragons >= 1) incrementStat(stats.dragons.atLeast.one, blueWon);
    if (blueDragons >= 2) incrementStat(stats.dragons.atLeast.two, blueWon);
    if (blueDragons >= 3) incrementStat(stats.dragons.atLeast.three, blueWon);
    if (blueDragons >= 4) incrementStat(stats.dragons.atLeast.four, blueWon);

    if (redDragons >= 1) incrementStat(stats.dragons.atLeast.one, redWon);
    if (redDragons >= 2) incrementStat(stats.dragons.atLeast.two, redWon);
    if (redDragons >= 3) incrementStat(stats.dragons.atLeast.three, redWon);
    if (redDragons >= 4) incrementStat(stats.dragons.atLeast.four, redWon);

    // Dragon Soul (4 dragons)
    if (blueDragons >= 4) incrementStat(stats.dragons.dragonSoul, blueWon);
    if (redDragons >= 4) incrementStat(stats.dragons.dragonSoul, redWon);

    // Void Grubs - use hordeKills from team object
    const blueGrubs = blue.hordeKills || 0;
    const redGrubs = red.hordeKills || 0;

    // Exact grub counts
    if (blueGrubs === 1) incrementStat(stats.voidGrubs.exact.one, blueWon);
    if (blueGrubs === 2) incrementStat(stats.voidGrubs.exact.two, blueWon);
    if (blueGrubs === 3) incrementStat(stats.voidGrubs.exact.three, blueWon);

    if (redGrubs === 1) incrementStat(stats.voidGrubs.exact.one, redWon);
    if (redGrubs === 2) incrementStat(stats.voidGrubs.exact.two, redWon);
    if (redGrubs === 3) incrementStat(stats.voidGrubs.exact.three, redWon);

    // At-least grub counts
    if (blueGrubs >= 1) incrementStat(stats.voidGrubs.atLeast.one, blueWon);
    if (blueGrubs >= 2) incrementStat(stats.voidGrubs.atLeast.two, blueWon);
    if (blueGrubs >= 3) incrementStat(stats.voidGrubs.atLeast.three, blueWon);

    if (redGrubs >= 1) incrementStat(stats.voidGrubs.atLeast.one, redWon);
    if (redGrubs >= 2) incrementStat(stats.voidGrubs.atLeast.two, redWon);
    if (redGrubs >= 3) incrementStat(stats.voidGrubs.atLeast.three, redWon);

    // Process timeline-based objectives
    const timeline =
      timelines[matchId] ||
      timelines[`match${matchId}`] ||
      timelines[match.gameId?.toString()] ||
      timelines[match.gameId];

    if (timeline && timeline.frames) {
      // Track dragon types per team
      const blueDragonTypes: Record<string, number> = {};
      const redDragonTypes: Record<string, number> = {};
      // Track first dragon of each type (typeKey -> teamId that got it first)
      const firstDragonOfType: Record<string, 100 | 200> = {};

      for (const frame of timeline.frames) {
        if (frame.events) {
          for (const event of frame.events) {
            if (event.type === "ELITE_MONSTER_KILL") {
              // Participants 1-5 are team 100 (blue), 6-10 are team 200 (red)
              const teamId = event.killerId > 5 ? 200 : 100;

              // Atakhan
              if (event.monsterType === "ATAKHAN") {
                if (teamId === 100) {
                  incrementStat(stats.atakhan, blueWon);
                } else {
                  incrementStat(stats.atakhan, redWon);
                }
              }

              // Elder Dragon
              if (
                event.monsterType === "DRAGON" &&
                event.monsterSubType === "ELDER_DRAGON"
              ) {
                if (teamId === 100) {
                  incrementStat(stats.elderDragon, blueWon);
                } else {
                  incrementStat(stats.elderDragon, redWon);
                }
              }

              // Dragon types (excluding elder)
              if (
                event.monsterType === "DRAGON" &&
                event.monsterSubType !== "ELDER_DRAGON" &&
                event.monsterSubType !== ""
              ) {
                const typeKey = getDragonTypeKey(event.monsterSubType);
                if (typeKey) {
                  // Track first dragon of this type
                  if (!firstDragonOfType[typeKey]) {
                    firstDragonOfType[typeKey] = teamId;
                  }

                  if (teamId === 100) {
                    blueDragonTypes[typeKey] =
                      (blueDragonTypes[typeKey] || 0) + 1;
                  } else {
                    redDragonTypes[typeKey] =
                      (redDragonTypes[typeKey] || 0) + 1;
                  }
                }
              }
            }
          }
        }
      }

      // Process dragon type statistics
      const processDragonTypes = (
        dragonTypes: Record<string, number>,
        won: boolean
      ) => {
        for (const [typeKey, count] of Object.entries(dragonTypes)) {
          const typeStats =
            stats.dragons.types[typeKey as keyof typeof stats.dragons.types];
          if (typeStats) {
            // Any dragon of this type
            if (count >= 1) {
              incrementStat(typeStats.any, won);
            }
            // Multiple dragons of this type
            if (count >= 2) {
              incrementStat(typeStats.multiple, won);
            }
          }
        }
      };

      processDragonTypes(blueDragonTypes, blueWon);
      processDragonTypes(redDragonTypes, redWon);

      // First dragon of each type
      for (const [typeKey, teamId] of Object.entries(firstDragonOfType)) {
        const typeStats =
          stats.dragons.types[typeKey as keyof typeof stats.dragons.types];
        if (typeStats) {
          incrementStat(typeStats.first, teamId === 100 ? blueWon : redWon);
        }
      }
    }
  }

  // Calculate win rates
  calculateWinRates(stats);

  return stats;
}
