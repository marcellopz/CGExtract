import type { MatchRolesObj, MatchesObj, PlayersObj } from "../role-processing";
import type {
  PlayersInitialRanks,
  PlayersRankChangeLog,
  RankChangeEntry,
  Role,
} from "./calculate-rank-change-stats";

export type MatchRanks = {
  [matchId: string]: {
    [summonerId: string]: number | null;
  };
};

function buildAccountIdToNameIdMap(
  playersInitialRanks: PlayersInitialRanks | null,
  legends: PlayersObj
): Record<string, string> {
  const accountIdToNameId: Record<string, string> = {};

  if (playersInitialRanks) {
    for (const [nameId, initialRanks] of Object.entries(playersInitialRanks)) {
      if (typeof initialRanks?.accountId === "number") {
        accountIdToNameId[initialRanks.accountId.toString()] = nameId;
      } else {
        console.warn(
          `Skipping player-initial-ranks entry without accountId for ${nameId}`
        );
      }
    }
  }

  for (const legend of Object.values(legends)) {
    if (legend.name_id && typeof legend.account_id === "number") {
      accountIdToNameId[legend.account_id.toString()] ??= legend.name_id;
    }
  }

  return accountIdToNameId;
}

function getSortedRankChanges(
  playersRankChangeLog: PlayersRankChangeLog | null,
  nameId: string,
  role: Role
): RankChangeEntry[] {
  const roleChanges = playersRankChangeLog?.[nameId]?.[role];

  if (!roleChanges) {
    return [];
  }

  return Object.values(roleChanges).sort((a, b) => a.timestamp - b.timestamp);
}

function getRankAtMatchTime(
  playersInitialRanks: PlayersInitialRanks | null,
  playersRankChangeLog: PlayersRankChangeLog | null,
  nameId: string,
  role: Role,
  matchTimestamp: number
): number | null {
  let rank = playersInitialRanks?.[nameId]?.[role] ?? null;

  for (const rankChange of getSortedRankChanges(
    playersRankChangeLog,
    nameId,
    role
  )) {
    if (rankChange.timestamp > matchTimestamp) {
      break;
    }

    rank = rankChange.newRank;
  }

  return rank;
}

export function calculateMatchRanks(
  fullMatches: MatchesObj,
  matchRoles: MatchRolesObj,
  playersRankChangeLog: PlayersRankChangeLog | null,
  playersInitialRanks: PlayersInitialRanks | null,
  legends: PlayersObj
): MatchRanks {
  const accountIdToNameId = buildAccountIdToNameIdMap(
    playersInitialRanks,
    legends
  );
  const matchRanks: MatchRanks = {};

  for (const [matchId, match] of Object.entries(fullMatches)) {
    const rolesForMatch = matchRoles[matchId];

    if (!rolesForMatch) {
      continue;
    }

    matchRanks[matchId] = {};

    for (const [summonerId, role] of Object.entries(rolesForMatch)) {
      const nameId = accountIdToNameId[summonerId];

      if (!nameId) {
        console.warn(
          `No name_id found for summoner ${summonerId} in match ${matchId}`
        );
        matchRanks[matchId][summonerId] = null;
        continue;
      }

      matchRanks[matchId][summonerId] = getRankAtMatchTime(
        playersInitialRanks,
        playersRankChangeLog,
        nameId,
        role,
        match.gameCreation
      );
    }
  }

  return matchRanks;
}
