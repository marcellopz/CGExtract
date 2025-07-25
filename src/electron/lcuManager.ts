import { getLCUAuth, invalidateAuth } from "./lcuAuth.js";
import { requestURL, requestLiveClientAPI } from "./lcuRequest.js";
import { BrowserWindow } from "electron";

// Cache for summoner data to reduce API calls
const summonerCache = new Map<string, unknown>();

export class LCUManager {
  private window: BrowserWindow;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  // Start polling for LCU connection
  startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      await this.checkConnection();
    }, 5000);
    this.checkConnection(); // Initial check
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkConnection(): Promise<void> {
    try {
      const auth = await getLCUAuth();
      const wasConnected = this.isConnected;
      this.isConnected = auth !== null;

      if (this.isConnected !== wasConnected) {
        this.window.webContents.send("lcu-auth-status", {
          connected: this.isConnected,
          auth,
        });
      }
    } catch (error) {
      console.log("ERR: Failed to check connection", error);
      if (this.isConnected) {
        this.isConnected = false;
        this.window.webContents.send("lcu-auth-status", {
          connected: false,
          auth: null,
        });
      }
    }
  }

  // Get current summoner info
  async getCurrentSummoner(): Promise<SummonerData> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    const cacheKey = "current-summoner";
    if (summonerCache.has(cacheKey)) {
      return summonerCache.get(cacheKey) as SummonerData;
    }

    try {
      const response = await requestURL(
        auth,
        "/lol-summoner/v1/current-summoner"
      );
      const summoner = JSON.parse(response);
      summonerCache.set(cacheKey, summoner);
      return summoner;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Search for summoner by name
  async searchSummoner(name: string): Promise<SummonerData> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    const cacheKey = `summoner-${name}`;
    if (summonerCache.has(cacheKey)) {
      return summonerCache.get(cacheKey) as SummonerData;
    }

    try {
      const encodedName = encodeURI(name.replace(/\s/g, ""));
      const response = await requestURL(
        auth,
        `/lol-summoner/v1/summoners?name=${encodedName}`
      );
      const summoner = JSON.parse(response);
      summonerCache.set(cacheKey, summoner);
      return summoner;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get summoner by ID
  async getSummonerById(id: number): Promise<SummonerData> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    const cacheKey = `summoner-id-${id}`;
    if (summonerCache.has(cacheKey)) {
      return summonerCache.get(cacheKey) as SummonerData;
    }

    try {
      const response = await requestURL(
        auth,
        `/lol-summoner/v1/summoners/${id}`
      );
      const summoner = JSON.parse(response);
      summonerCache.set(cacheKey, summoner);
      return summoner;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get ranked statistics
  async getRankedStats(puuid?: string): Promise<RankedStats> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    try {
      let endpoint: string;
      if (puuid) {
        endpoint = `/lol-ranked/v1/ranked-stats/${puuid}`;
      } else {
        endpoint = "/lol-ranked/v1/current-ranked-stats";
      }

      const response = await requestURL(auth, endpoint);
      return JSON.parse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get match history
  async getMatchHistory(
    puuid?: string,
    begIndex = 0,
    endIndex = 9
  ): Promise<MatchHistory> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    try {
      let endpoint: string;
      if (puuid) {
        endpoint = `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=${begIndex}&endIndex=${endIndex}`;
      } else {
        endpoint = `/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=${begIndex}&endIndex=${endIndex}`;
      }

      const response = await requestURL(auth, endpoint);
      return JSON.parse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get champion select session
  async getChampSelect(): Promise<ChampSelectSession> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    try {
      const response = await requestURL(auth, "/lol-champ-select/v1/session");
      return JSON.parse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get live game data
  async getLiveGame(): Promise<LivePlayer[]> {
    const response = await requestLiveClientAPI("/liveclientdata/playerlist");
    return JSON.parse(response);
  }

  // Get detailed match info
  async getMatchDetails(gameId: number): Promise<MatchData> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    try {
      const response = await requestURL(
        auth,
        `/lol-match-history/v1/games/${gameId}`
      );
      return JSON.parse(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Get extended detailed match info with full data
  async getDetailedMatch(gameId: number): Promise<unknown> {
    console.log("LCUManager.getDetailedMatch called with gameId:", gameId);

    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    if (!gameId || gameId === 0) {
      throw new Error(`Invalid gameId: ${gameId}`);
    }

    try {
      const url = `/lol-match-history/v1/games/${gameId}`;
      console.log("Making LCU request to:", url);

      const response = await requestURL(auth, url);
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to fetch detailed match:", error);
      this.handleError(error);
      throw error;
    }
  }

  // Get game timeline data
  async getGameTimeline(gameId: number): Promise<unknown> {
    console.log("LCUManager.getGameTimeline called with gameId:", gameId);

    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    if (!gameId || gameId === 0) {
      throw new Error(`Invalid gameId: ${gameId}`);
    }

    try {
      const url = `/lol-match-history/v1/game-timelines/${gameId}`;
      console.log("Making LCU request to:", url);

      const response = await requestURL(auth, url);
      return JSON.parse(response);
    } catch (error) {
      console.error("Failed to fetch game timeline:", error);
      this.handleError(error);
      throw error;
    }
  }

  // Get player card data for lobby
  async getPlayerCard(
    summonerId: number,
    position: string,
    teamId: number
  ): Promise<LCUPlayerCard> {
    const auth = await getLCUAuth();
    if (!auth) throw new Error("LCU not connected");

    try {
      const summoner = await this.getSummonerById(summonerId);
      const rankedStats = await this.getRankedStats(summoner.puuid as string);
      const matchHistory = await this.getMatchHistory(
        summoner.puuid as string,
        0,
        9
      );

      return {
        queueMap: rankedStats.queueMap,
        matchHistory,
        username: summoner.displayName,
        teamId,
        position: position.toUpperCase(),
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  private handleError(error: unknown): void {
    console.error("LCU Error:", error);

    const errorCode = error instanceof Error ? error.message : "Unknown error";
    switch (errorCode) {
      case "HTTP 400":
      case "HTTP 404":
        // Good request, bad response (e.g., no lobby exists)
        this.window.webContents.send("lcu-error", {
          error: "No data available",
          code: errorCode,
        });
        break;
      case "HTTP 403":
      case "0":
      default:
        // Connection issues
        invalidateAuth();
        this.isConnected = false;
        this.window.webContents.send("lcu-auth-status", {
          connected: false,
          auth: null,
        });
        this.window.webContents.send("lcu-error", {
          error: "LCU disconnected",
          code: errorCode,
        });
        break;
    }
  }
}
