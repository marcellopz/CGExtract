// League of Legends Game Details Type Definitions

export interface Player {
  accountId: number;
  currentAccountId: number;
  currentPlatformId: string;
  gameName: string;
  matchHistoryUri: string;
  platformId: string;
  profileIcon: number;
  puuid: string;
  summonerId: number;
  summonerName: string;
  tagLine: string;
}

export interface PlayerIdentity {
  participantId: number;
  player: Player;
}

export interface ParticipantStats {
  assists: number;
  causedEarlySurrender: boolean;
  champLevel: number;
  combatPlayerScore: number;
  damageDealtToObjectives: number;
  damageDealtToTurrets: number;
  damageSelfMitigated: number;
  deaths: number;
  doubleKills: number;
  earlySurrenderAccomplice: boolean;
  firstBloodAssist: boolean;
  firstBloodKill: boolean;
  firstInhibitorAssist: boolean;
  firstInhibitorKill: boolean;
  firstTowerAssist: boolean;
  firstTowerKill: boolean;
  gameEndedInEarlySurrender: boolean;
  gameEndedInSurrender: boolean;
  goldEarned: number;
  goldSpent: number;
  inhibitorKills: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  killingSprees: number;
  kills: number;
  largestCriticalStrike: number;
  largestKillingSpree: number;
  largestMultiKill: number;
  longestTimeSpentLiving: number;
  magicDamageDealt: number;
  magicDamageDealtToChampions: number;
  magicalDamageTaken: number;
  neutralMinionsKilled: number;
  neutralMinionsKilledEnemyJungle: number;
  neutralMinionsKilledTeamJungle: number;
  objectivePlayerScore: number;
  participantId: number;
  pentaKills: number;
  perk0: number;
  perk0Var1: number;
  perk0Var2: number;
  perk0Var3: number;
  perk1: number;
  perk1Var1: number;
  perk1Var2: number;
  perk1Var3: number;
  perk2: number;
  perk2Var1: number;
  perk2Var2: number;
  perk2Var3: number;
  perk3: number;
  perk3Var1: number;
  perk3Var2: number;
  perk3Var3: number;
  perk4: number;
  perk4Var1: number;
  perk4Var2: number;
  perk4Var3: number;
  perk5: number;
  perk5Var1: number;
  perk5Var2: number;
  perk5Var3: number;
  perkPrimaryStyle: number;
  perkSubStyle: number;
  physicalDamageDealt: number;
  physicalDamageDealtToChampions: number;
  physicalDamageTaken: number;
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;
  playerAugment5: number;
  playerAugment6: number;
  playerScore0: number;
  playerScore1: number;
  playerScore2: number;
  playerScore3: number;
  playerScore4: number;
  playerScore5: number;
  playerScore6: number;
  playerScore7: number;
  playerScore8: number;
  playerScore9: number;
  playerSubteamId: number;
  quadraKills: number;
  sightWardsBoughtInGame: number;
  subteamPlacement: number;
  teamEarlySurrendered: boolean;
  timeCCingOthers: number;
  totalDamageDealt: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  totalHeal: number;
  totalMinionsKilled: number;
  totalPlayerScore: number;
  totalScoreRank: number;
  totalTimeCrowdControlDealt: number;
  totalUnitsHealed: number;
  tripleKills: number;
  trueDamageDealt: number;
  trueDamageDealtToChampions: number;
  trueDamageTaken: number;
  turretKills: number;
  unrealKills: number;
  visionScore: number;
  visionWardsBoughtInGame: number;
  wardsKilled: number;
  wardsPlaced: number;
  win: boolean;
}

export interface ParticipantTimeline {
  creepsPerMinDeltas: Record<string, number>;
  csDiffPerMinDeltas: Record<string, number>;
  damageTakenDiffPerMinDeltas: Record<string, number>;
  damageTakenPerMinDeltas: Record<string, number>;
  goldPerMinDeltas: Record<string, number>;
  lane: string;
  participantId: number;
  role: string;
  xpDiffPerMinDeltas: Record<string, number>;
  xpPerMinDeltas: Record<string, number>;
}

export interface Participant {
  championId: number;
  highestAchievedSeasonTier: string;
  participantId: number;
  spell1Id: number;
  spell2Id: number;
  stats: ParticipantStats;
  teamId: number;
  timeline: ParticipantTimeline;
}

export interface TeamBan {
  championId: number;
  pickTurn: number;
}

export interface Team {
  bans: TeamBan[];
  baronKills: number;
  dominionVictoryScore: number;
  dragonKills: number;
  firstBaron: boolean;
  firstBlood: boolean;
  firstDargon: boolean;
  firstInhibitor: boolean;
  firstTower: boolean;
  hordeKills: number;
  inhibitorKills: number;
  riftHeraldKills: number;
  teamId: number;
  towerKills: number;
  vilemawKills: number;
  win: string; // "Win" | "Fail"
}

export interface GameDetails {
  endOfGameResult: string;
  gameCreation: number;
  gameCreationDate: string;
  gameDuration: number;
  gameId: number;
  gameMode: string;
  gameModeMutators: unknown[];
  gameType: string;
  gameVersion: string;
  mapId: number;
  participantIdentities: PlayerIdentity[];
  participants: Participant[];
  platformId: string;
  queueId: number;
  seasonId: number;
  teams: Team[];
  reply_type: string;
}

// Role assignment types
export type Role = "top" | "jungle" | "mid" | "adc" | "support";

export interface RoleAssignments {
  [participantId: number]: Role;
}

// Utility types for role assignment
export interface PlayerForRoleAssignment {
  participantId: number;
  summonerName: string;
  championId: number;
  championName?: string;
  teamId: number;
  position: number; // 0-4 representing top, jungle, mid, adc, support
}
