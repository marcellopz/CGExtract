// LCU Types
type LCUAuth = {
  name: string;
  protocol: string;
  pid: string;
  port: string;
  password: string;
} | null;

type SummonerData = {
  summonerId: number;
  displayName: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  accountId: number;
};

type RankedStats = {
  queueMap: {
    RANKED_SOLO_5x5: {
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    };
    RANKED_FLEX_SR: {
      tier: string;
      division: string;
      leaguePoints: number;
      wins: number;
      losses: number;
    };
  };
  summonerData?: SummonerData;
  username?: string;
};

type MatchParticipant = {
  championId: number;
  spell1Id: number;
  spell2Id: number;
  stats: {
    champLevel: number;
    kills: number;
    deaths: number;
    assists: number;
    totalMinionsKilled: number;
    neutralMinionsKilled: number;
    item0: number;
    item1: number;
    item2: number;
    item3: number;
    item4: number;
    item5: number;
    item6: number;
    totalDamageDealtToChampions: number;
    visionWardsBoughtInGame: number;
    win: boolean;
    perk0: number;
    perkSubStyle: number;
  };
};

type MatchData = {
  gameId: number;
  gameCreation: number;
  gameDuration: number;
  queueId: number;
  gameType?: string;
  participants: MatchParticipant[];
};

type MatchHistory = {
  games: {
    games: MatchData[];
  };
};

type LobbyPlayer = {
  summonerId: number;
  assignedPosition: string;
};

type ChampSelectSession = {
  gameId: number;
  myTeam: LobbyPlayer[];
};

type LivePlayer = {
  summonerName: string;
  championName: string;
  position: string;
  team: string;
};

type LCUPlayerCard = {
  queueMap: RankedStats["queueMap"];
  matchHistory: MatchHistory;
  username: string;
  teamId: number;
  position: string;
  championId?: number;
};

// Events sent from main to renderer
type EventPayloadMapping = {
  // LCU status events (sent automatically)
  "lcu-auth-status": { connected: boolean; auth: LCUAuth };
  "lcu-error": { error: string; code?: string };
};

// IPC invoke handlers (renderer calls main)
type IPCHandlerMapping = {
  // LCU handlers
  getLCUAuth: LCUAuth;
  getCurrentSummoner: SummonerData;
  getRankedStats: RankedStats;
  getMatchHistory: MatchHistory;
  getDetailedMatch: unknown;
  getGameTimeline: unknown;
  searchSummoner: SummonerData;
  getChampSelect: ChampSelectSession;
  getLiveGame: LivePlayer[];
  getPlayerCard: LCUPlayerCard;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    // Event subscriptions
    subscribeToLCU: <T extends keyof EventPayloadMapping>(
      event: T,
      callback: (data: EventPayloadMapping[T]) => void
    ) => UnsubscribeFunction;

    // LCU methods (IPC invoke calls)
    getLCUAuth: () => Promise<LCUAuth>;
    getCurrentSummoner: () => Promise<SummonerData>;
    getRankedStats: (puuid?: string) => Promise<RankedStats>;
    getMatchHistory: (
      puuid?: string,
      begIndex?: number,
      endIndex?: number
    ) => Promise<MatchHistory>;
    getDetailedMatch: (gameId: number) => Promise<unknown>;
    getGameTimeline: (gameId: number) => Promise<unknown>;
    searchSummoner: (name: string) => Promise<SummonerData>;
    getChampSelect: () => Promise<ChampSelectSession>;
    getLiveGame: () => Promise<LivePlayer[]>;
    getPlayerCard: (
      summonerId: number,
      position: string,
      teamId: number
    ) => Promise<LCUPlayerCard>;
  };
}
