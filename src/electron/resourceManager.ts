import osUtils from "os-utils";
import fs from "fs";
import os from "os";
import { BrowserWindow } from "electron";

const POLLING_INTERVAL = 1000;

export function pollResource(mainWindow: BrowserWindow) {
  setInterval(async () => {
    const cpuUsage = await getCpuUsage();
    const ramUsage = await getRamUsage();
    const storageUsage = await getStorageUsage();
    mainWindow.webContents.send("statistics", {
      cpuUsage,
      ramUsage,
      storageUsage: storageUsage.usage,
    });
  }, POLLING_INTERVAL);
}

export function getStaticData() {
  const totalStorage = getStorageUsage().total;
  const cpuModel = os.cpus()[0].model;
  const totalMemoryGB = Math.floor(os.totalmem() / 1024); // GB
  return { totalStorage, cpuModel, totalMemoryGB };
}

function getCpuUsage() {
  return new Promise((resolve) => {
    osUtils.cpuUsage((percentage) => {
      resolve(percentage);
    });
  });
}

function getRamUsage() {
  return 1 - osUtils.freememPercentage();
}

function getStorageUsage() {
  const stats = fs.statfsSync(process.platform === "win32" ? "C:/" : "/");
  const total = stats.blocks * stats.bsize;
  const free = stats.bfree * stats.bsize;
  return {
    total: Math.floor(total / 1024 / 1024 / 1024), // GB
    usage: 1 - free / total,
  };
}
