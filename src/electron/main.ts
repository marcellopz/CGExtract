import { app, BrowserWindow } from "electron";
import path from "path";
import { ipcHandle, isDev } from "./utils.js";
import { getStaticData, pollResource } from "./resourceManager.js";
import { getPreloadPath } from "./pathResolver.js";

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });
  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), "dist-react", "index.html")
    );
  }

  pollResource(mainWindow);

  ipcHandle("getStaticData", getStaticData);
});
