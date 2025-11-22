import type { AllMatchStats } from "../role-processing";

const numberOfGamesToConsider = 10;

type RoleWins = {
  wins: number;
  numberOfGames: number;
};

export type PlayerMvpPerformanceInGames = {
  wins: number;
  rolesWins: {
    top: RoleWins;
    jungle: RoleWins;
    mid: RoleWins;
    adc: RoleWins;
    support: RoleWins;
  };
  meanScore: number;
  numberOfGames: number;
  gameName: string;
  summonerId: string;
};

export type MvpPlayers = {
  [playerId: string]: PlayerMvpPerformanceInGames;
};

export function calculateMVP(allMatchStats: AllMatchStats) {
  console.log("Calculating MVPs...");
  const gameList = Object.values(allMatchStats).splice(
    Object.keys(allMatchStats).length - numberOfGamesToConsider,
    Object.keys(allMatchStats).length
  );
  const players: MvpPlayers = {};
  for (const game of gameList) {
    for (const [role, rolePlayers] of Object.entries(game)) {
      for (const [playerId, playerStats] of Object.entries(rolePlayers)) {
        if (!players[playerId]) {
          players[playerId] = {
            wins: 0,
            rolesWins: {
              top: { wins: 0, numberOfGames: 0 },
              jungle: { wins: 0, numberOfGames: 0 },
              mid: { wins: 0, numberOfGames: 0 },
              adc: { wins: 0, numberOfGames: 0 },
              support: { wins: 0, numberOfGames: 0 },
            },
            meanScore: 0,
            numberOfGames: 0,
            gameName: playerStats.gameName,
            summonerId: playerStats.summonerId,
          };
        }
        players[playerId].wins += playerStats.win ? 1 : 0;
        players[playerId].rolesWins[
          role as "top" | "jungle" | "mid" | "adc" | "support"
        ].wins += playerStats.win ? 1 : 0;
        players[playerId].rolesWins[
          role as "top" | "jungle" | "mid" | "adc" | "support"
        ].numberOfGames += 1;
        players[playerId].meanScore += playerStats.score;
        players[playerId].numberOfGames += 1;
      }
    }
  }
  for (const [playerId, playerStats] of Object.entries(players)) {
    players[playerId].meanScore /= playerStats.numberOfGames;
  }
  return players;
}
