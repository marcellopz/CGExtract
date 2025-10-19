import { set, child } from "firebase/database";
import { dbRef } from "../firebase/firebaseConfig";
import {
  championNames as championIds,
  summonerSpells,
} from "../constants/lcuData";
import type { GameDetails, RoleAssignments } from "../../../gameTypes";

interface UploadFileData {
  type: "gameDetails" | "timeline" | "unknown";
  gameId: number | null;
  data: unknown;
  roleAssignments?: RoleAssignments;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the match object against required criteria
 */
const validateMatch = (matchObj: GameDetails): ValidationResult => {
  const errors: string[] = [];

  // Check gameType is CUSTOM_GAME
  if (
    matchObj.gameType !== "CUSTOM_GAME" &&
    matchObj.gameType !== "MATCHED_GAME"
  ) {
    errors.push(
      `Invalid gameType: ${matchObj.gameType}. Expected: CUSTOM_GAME or MATCHED_GAME`
    );
  }

  // Check gameId is a number
  if (!matchObj.gameId || typeof matchObj.gameId !== "number") {
    errors.push(`Invalid gameId: ${matchObj.gameId}. Expected a number`);
  }

  // Check participant count is 10
  if (
    !matchObj.participantIdentities ||
    matchObj.participantIdentities.length !== 10
  ) {
    errors.push(
      `Invalid number of participants: ${
        matchObj.participantIdentities?.length || 0
      }. Expected: 10`
    );
  }

  // Check gameMode is CLASSIC
  if (matchObj.gameMode !== "CLASSIC") {
    errors.push(`Invalid gameMode: ${matchObj.gameMode}. Expected: CLASSIC`);
  }

  // Additional checks for required fields
  if (!matchObj.gameCreationDate) {
    errors.push("Missing gameCreationDate");
  }

  if (!matchObj.gameDuration || typeof matchObj.gameDuration !== "number") {
    errors.push(
      `Invalid gameDuration: ${matchObj.gameDuration}. Expected a number`
    );
  }

  if (!matchObj.gameVersion) {
    errors.push("Missing gameVersion");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const reduceFile = (matchObj: GameDetails) => {
  const reduced: Record<string, unknown> = {};
  reduced.gameId = matchObj.gameId;
  reduced.gameMode = matchObj.gameMode;
  reduced.date = matchObj.gameCreationDate;
  reduced.gameDuration = matchObj.gameDuration;
  reduced.gameVersion = matchObj.gameVersion;

  // Calculate total gold earned by each team
  const goldByTeam = matchObj.participants.reduce((acc, p) => {
    acc[p.teamId] = (acc[p.teamId] || 0) + p.stats.goldEarned;
    return acc;
  }, {} as Record<number, number>);

  // Remove unwanted properties from teams
  const teams = matchObj.teams.map((team) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { dominionVictoryScore, vilemawKills, ...cleanTeam } = team;
    return {
      ...cleanTeam,
      goldEarned: goldByTeam[team.teamId] || 0,
    };
  });
  reduced.teams = teams;

  const participantIdentities = matchObj.participantIdentities.map((p) => ({
    participantId: p.participantId,
    summonerId: p.player.summonerId,
    summonerName: p.player.gameName,
    tagLine: p.player.tagLine,
  }));

  const participants = matchObj.participants.map((p) => ({
    championId: p.championId,
    championName: championIds[p.championId] ?? "",
    participantId: p.participantId,
    spellsIds: [p.spell1Id, p.spell2Id],
    spells: [
      summonerSpells[p.spell1Id] || "",
      summonerSpells[p.spell2Id] || "",
    ],
    teamId: p.teamId,
    stats: {
      assists: p.stats.assists,
      champLevel: p.stats.champLevel,
      damageDealtToTurrets: p.stats.damageDealtToTurrets,
      damageSelfMitigated: p.stats.damageSelfMitigated,
      deaths: p.stats.deaths,
      firstBloodKill: p.stats.firstBloodKill,
      goldEarned: p.stats.goldEarned,
      goldSpent: p.stats.goldSpent,
      item0: p.stats.item0,
      item1: p.stats.item1,
      item2: p.stats.item2,
      item3: p.stats.item3,
      item4: p.stats.item4,
      item5: p.stats.item5,
      item6: p.stats.item6,
      kills: p.stats.kills,
      largestKillingSpree: p.stats.largestKillingSpree,
      largestMultiKill: p.stats.largestMultiKill,
      magicDamageDealtToChampions: p.stats.magicDamageDealtToChampions,
      magicalDamageTaken: p.stats.magicalDamageTaken,
      physicalDamageDealtToChampions: p.stats.physicalDamageDealtToChampions,
      physicalDamageTaken: p.stats.physicalDamageTaken,
      totalDamageDealtToChampions: p.stats.totalDamageDealtToChampions,
      totalDamageTaken: p.stats.totalDamageTaken,
      totalCs: p.stats.totalMinionsKilled + p.stats.neutralMinionsKilled,
      trueDamageDealtToChampions: p.stats.trueDamageDealtToChampions,
      visionScore: p.stats.visionScore,
      visionWardsBoughtInGame: p.stats.visionWardsBoughtInGame,
      wardsKilled: p.stats.wardsKilled,
      wardsPlaced: p.stats.wardsPlaced,
      win: p.stats.win,
    },
  }));

  const joinedParticipants = participantIdentities.map((p1) => ({
    ...p1,
    ...participants.find((p2) => p1.participantId === p2.participantId),
  }));

  reduced.participants = joinedParticipants;

  return reduced;
};

export async function sendFullMatchJson(match: GameDetails): Promise<void> {
  await set(child(dbRef, `full-json-matches/match${match.gameId}`), match);
}

export async function sendReducedMatchJson(
  match: Record<string, unknown>
): Promise<void> {
  await set(
    child(dbRef, `pre-processed-data/all-reduced/match${match.gameId}`),
    match
  );

  const participantsArray = match.participants as Array<{
    championId: number;
    championName: string;
    summonerId: number;
    summonerName: string;
    teamId: number;
    tagLine: string;
    [key: string]: unknown;
  }>;

  const participantsReduced = participantsArray.map((p) => ({
    championId: p.championId,
    championName: p.championName,
    summonerId: p.summonerId,
    summonerName: p.summonerName,
    teamId: p.teamId,
    tagLine: p.tagLine,
  }));

  for (const p of participantsArray) {
    await set(
      child(
        dbRef,
        `pre-processed-data/players/${p.summonerId}/matches/match${match.gameId}`
      ),
      {
        ...p,
        date: match.date,
        gameDuration: match.gameDuration,
        participants: participantsReduced,
      }
    );
  }
}

export async function uploadFile(file: UploadFileData): Promise<void> {
  switch (file.type) {
    case "timeline": {
      await set(child(dbRef, `timelines/match${file.gameId}`), file.data);
      break;
    }

    case "gameDetails": {
      if (!file.roleAssignments) {
        alert(`No role assignments found for match ${file.gameId}`);
        return;
      }

      const matchObj = file.data as GameDetails;
      const validation = validateMatch(matchObj);

      if (!validation.isValid) {
        console.error("Match validation failed:", validation.errors);
        throw new Error(`Invalid match data: ${validation.errors.join(", ")}`);
      }

      await set(
        child(dbRef, `pre-processed-data/match-roles/match${file.gameId}`),
        file.roleAssignments
      );
      await sendFullMatchJson(matchObj);
      const reducedMatch = reduceFile(matchObj);
      await sendReducedMatchJson(reducedMatch);

      break;
    }

    default: {
      throw new Error("Unknown file type");
    }
  }
}
