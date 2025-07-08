const electron = require("electron");

type Statistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback: (statistics: Statistics) => void) => {
    ipcOn("statistics", (data: Statistics) => {
      callback(data);
    });
  },
  getStaticData: () => ipcInvoke("getStaticData"),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  electron.ipcRenderer.on(key, (_: any, payload: EventPayloadMapping[Key]) =>
    callback(payload)
  );
}
