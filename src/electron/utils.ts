import { ipcMain, WebContents } from "electron";

export function isDev() {
  return process.env.NODE_ENV === "development";
}

export function ipcHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key]
): void {
  ipcMain.handle(key, handler);
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
): void {
  webContents.send(key, payload);
}
