import { BrowserWindow, ipcMain, WebContents } from "electron";

const isDevelopment = process.env.NODE_ENV === "development";

export function isDev(): boolean {
  return isDevelopment;
}

export function ipcHandle<Key extends keyof IPCHandlerMapping>(
  key: Key,
  handler: (
    ...args: unknown[]
  ) => Promise<IPCHandlerMapping[Key]> | IPCHandlerMapping[Key]
) {
  ipcMain.handle(key, (event, ...args) => handler(event, ...args));
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  channel: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(channel, payload);
}

export function getUIPath() {
  return "index.html";
}

export function subscribeResource<ResourceType, PayloadType = ResourceType>(
  window: BrowserWindow,
  getResourceFn: () => ResourceType | Promise<ResourceType>,
  responseName: keyof EventPayloadMapping,
  transform?: (value: ResourceType) => PayloadType
) {
  const getResourceWrapper = async () => {
    try {
      const data = await Promise.resolve(getResourceFn());
      const payload = transform ? transform(data) : (data as PayloadType);
      window.webContents.send(responseName, payload);
    } catch (error) {
      console.error("Error in subscribeResource:", error);
    }
  };

  setInterval(getResourceWrapper, 1000);
  getResourceWrapper();
}
