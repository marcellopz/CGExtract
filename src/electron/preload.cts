const electron = require("electron");

type Statistics = {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
};

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeStatistics: (callback: (statistics: Statistics) => void) => {
    electron.ipcRenderer.on("statistics", (event: any, data: Statistics) => {
      callback(data);
    });
  },
  getStaticData: () => {
    return electron.ipcRenderer.invoke("getStaticData");
  },
});
