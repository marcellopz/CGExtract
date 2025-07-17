import { app, BrowserWindow } from "electron";
import { ipcHandle, isDev } from "./utils.js";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { LCUManager } from "./lcuManager.js";

let lcuManager: LCUManager;

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }

  // Initialize LCU Manager
  lcuManager = new LCUManager(mainWindow);
  lcuManager.startPolling();

  // LCU IPC handlers
  ipcHandle("getLCUAuth", async () => {
    try {
      const { getLCUAuth } = await import("./lcuAuth.js");
      return await getLCUAuth();
    } catch (error) {
      console.error("Error getting LCU auth:", error);
      return null;
    }
  });

  ipcHandle("getCurrentSummoner", async (): Promise<SummonerData> => {
    return await lcuManager.getCurrentSummoner();
  });

  ipcHandle(
    "getRankedStats",
    async (...args: unknown[]): Promise<RankedStats> => {
      const puuid = typeof args[1] === "string" ? args[1] : undefined;
      return await lcuManager.getRankedStats(puuid);
    }
  );

  ipcHandle(
    "getMatchHistory",
    async (...args: unknown[]): Promise<MatchHistory> => {
      const puuid = typeof args[1] === "string" ? args[1] : undefined;
      const begIndex = typeof args[2] === "number" ? args[2] : undefined;
      const endIndex = typeof args[3] === "number" ? args[3] : undefined;
      return await lcuManager.getMatchHistory(puuid, begIndex, endIndex);
    }
  );

  ipcHandle(
    "getDetailedMatch",
    async (...args: unknown[]): Promise<unknown> => {
      console.log("IPC getDetailedMatch called with args:", args);
      const gameId = typeof args[1] === "number" ? args[1] : 0;
      console.log("Extracted gameId:", gameId, "type:", typeof gameId);

      if (gameId === 0) {
        throw new Error(
          "Invalid gameId: Cannot fetch match details for gameId 0"
        );
      }

      return await lcuManager.getDetailedMatch(gameId);
    }
  );

  ipcHandle("getGameTimeline", async (...args: unknown[]): Promise<unknown> => {
    console.log("IPC getGameTimeline called with args:", args);
    const gameId = typeof args[1] === "number" ? args[1] : 0;
    console.log("Extracted gameId:", gameId, "type:", typeof gameId);

    if (gameId === 0) {
      throw new Error(
        "Invalid gameId: Cannot fetch game timeline for gameId 0"
      );
    }

    return await lcuManager.getGameTimeline(gameId);
  });

  ipcHandle(
    "searchSummoner",
    async (...args: unknown[]): Promise<SummonerData> => {
      const name = typeof args[1] === "string" ? args[1] : "";
      return await lcuManager.searchSummoner(name);
    }
  );

  ipcHandle("getChampSelect", async (): Promise<ChampSelectSession> => {
    return await lcuManager.getChampSelect();
  });

  ipcHandle("getLiveGame", async (): Promise<LivePlayer[]> => {
    return await lcuManager.getLiveGame();
  });

  ipcHandle(
    "getPlayerCard",
    async (...args: unknown[]): Promise<LCUPlayerCard> => {
      const summonerId = typeof args[1] === "number" ? args[1] : 0;
      const position = typeof args[2] === "string" ? args[2] : "";
      const teamId = typeof args[3] === "number" ? args[3] : 0;
      return await lcuManager.getPlayerCard(summonerId, position, teamId);
    }
  );
});

app.on("before-quit", () => {
  if (lcuManager) {
    lcuManager.stopPolling();
  }
});
