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
