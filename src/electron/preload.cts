const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  // Event subscriptions
  subscribeToLCU: <T extends keyof EventPayloadMapping>(
    event: T,
    callback: (data: EventPayloadMapping[T]) => void
  ) => {
    return ipcOn(event, callback);
  },

  // LCU IPC methods
  getLCUAuth: () => ipcInvoke("getLCUAuth"),
  getCurrentSummoner: () => ipcInvoke("getCurrentSummoner"),
  getRankedStats: (puuid?: string) => ipcInvoke("getRankedStats", puuid),
  getMatchHistory: (puuid?: string, begIndex?: number, endIndex?: number) =>
    ipcInvoke("getMatchHistory", puuid, begIndex, endIndex),
  getDetailedMatch: (gameId: number) => ipcInvoke("getDetailedMatch", gameId),
  getGameTimeline: (gameId: number) => ipcInvoke("getGameTimeline", gameId),
  searchSummoner: (name: string) => ipcInvoke("searchSummoner", name),
  getChampSelect: () => ipcInvoke("getChampSelect"),
  getLiveGame: () => ipcInvoke("getLiveGame"),
  getPlayerCard: (summonerId: number, position: string, teamId: number) =>
    ipcInvoke("getPlayerCard", summonerId, position, teamId),

  // Firebase auth methods
  signInWithEmail: (email: string, password: string) =>
    ipcInvoke("signInWithEmail", email, password),
  signUpWithEmail: (email: string, password: string, displayName?: string) =>
    ipcInvoke("signUpWithEmail", email, password, displayName),
  signInWithGoogle: () => ipcInvoke("signInWithGoogle"),
  signOut: () => ipcInvoke("signOut"),
  getCurrentUser: () => ipcInvoke("getCurrentUser"),

  // Firebase data sync methods
  syncSummonerData: (data: unknown) => ipcInvoke("syncSummonerData", data),
  syncMatchHistory: (data: unknown) => ipcInvoke("syncMatchHistory", data),
  syncRankedStats: (data: unknown) => ipcInvoke("syncRankedStats", data),
  getCloudSummonerData: () => ipcInvoke("getCloudSummonerData"),
  getCloudMatchHistory: () => ipcInvoke("getCloudMatchHistory"),
  getCloudRankedStats: () => ipcInvoke("getCloudRankedStats"),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof IPCHandlerMapping>(
  key: Key,
  ...args: any[]
): Promise<IPCHandlerMapping[Key]> {
  return electron.ipcRenderer.invoke(key, ...args);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (
    _: Electron.IpcRendererEvent,
    payload: EventPayloadMapping[Key]
  ) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}
