import { exec, execFileSync } from "child_process";
import { promises as fs } from "fs";
import { tmpdir, platform, release } from "os";
import { join } from "path";

export interface LCUAuth {
  name: string;
  protocol: string;
  pid: string;
  port: string;
  password: string;
}

interface CachedAuth {
  auth: LCUAuth;
  timestamp: number;
}

let cachedAuth: CachedAuth | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

function isLeagueClientRunning(): Promise<boolean> {
  if (platform() !== "win32") {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const name = "LeagueClientUx";
    let cmd = `Get-Process -Name "${name}" -ErrorAction SilentlyContinue | Select-Object -First 1`;
    let cmdShell = "powershell.exe";

    // Check if we're running an old release of windows (6 == Win7)
    if (parseInt(release().split(".")[0], 10) < 7) {
      cmd = `tasklist /FI "IMAGENAME eq ${name}.exe" | find "${name}.exe"`;
      cmdShell = "cmd.exe";
    }

    exec(cmd, { shell: cmdShell }, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }

      // Check if the output contains the process name
      const isRunning = stdout.includes(name);
      resolve(isRunning);
    });
  });
}

export async function getAuthFromProcess(): Promise<LCUAuth> {
  if (platform() !== "win32") {
    throw new Error("NOTWIN32");
  }

  const portRegex = /--app-port=([0-9]+)/;
  const passwordRegex = /--remoting-auth-token=([\w-_]+)/;
  const pidRegex = /--app-pid=([0-9]+)/;
  const name = "LeagueClientUx";

  let cmd = `Get-WmiObject Win32_Process -Filter "name = '${name}.exe'" | 
    Select-Object -Property CommandLine | ft -HideTableHeaders | out-string -Width 4096`;
  let cmdShell = "powershell.exe";

  // Check if we're running an old release of windows (6 == Win7)
  if (parseInt(release().split(".")[0], 10) < 7) {
    cmd = `wmic process where caption='${name}.exe' get commandline | find /v "CommandLine"`;
    cmdShell = "cmd.exe";
  }

  return new Promise((resolve, reject) => {
    exec(cmd, { shell: cmdShell }, async (error, stdout) => {
      try {
        const pidMatch = stdout.match(pidRegex);
        const passwordMatch = stdout.match(passwordRegex);
        const portMatch = stdout.match(portRegex);

        if (!pidMatch || !passwordMatch || !portMatch) {
          throw new Error("Failed to parse auth info");
        }

        const auth: LCUAuth = {
          name: "riot",
          protocol: "https",
          pid: pidMatch[1],
          port: portMatch[1],
          password: passwordMatch[1],
        };

        resolve(auth);
      } catch (e) {
        console.log("ERR: Failed to parse auth info", e);
        // Attempt to restore from file
        try {
          const authPath = join(tmpdir(), "lcuAuth");
          const data = await fs.readFile(authPath, "utf8");
          const auth = JSON.parse(data) as LCUAuth;
          resolve(auth);
        } catch {
          reject(new Error("Unable to get LCU auth"));
        }
      }
    });
  });
}

export function setAuth(auth: LCUAuth | null): void {
  if (auth) {
    cachedAuth = {
      auth,
      timestamp: Date.now(),
    };
  } else {
    cachedAuth = null;
  }
}

export function invalidateAuth(): void {
  cachedAuth = null;
  console.log("LCU auth cache invalidated");
}

function isCacheValid(): boolean {
  if (!cachedAuth) {
    return false;
  }

  const now = Date.now();
  const cacheAge = now - cachedAuth.timestamp;

  if (cacheAge > CACHE_DURATION) {
    console.log("LCU auth cache expired (older than 10 minutes)");
    invalidateAuth();
    return false;
  }

  return true;
}

export function getRunLevel(): boolean {
  try {
    execFileSync("net", ["session"], { stdio: "ignore" });
    return true;
  } catch (e) {
    console.log("ERR: Game is not running..", e);
    return false;
  }
}

export async function getLCUAuth(): Promise<LCUAuth | null> {
  // Check if League client is running first
  const isRunning = await isLeagueClientRunning();
  if (!isRunning) {
    console.log("League client is not running, invalidating cache");
    invalidateAuth();
    return null;
  }

  if (cachedAuth && isCacheValid()) {
    return cachedAuth.auth;
  }

  try {
    const auth = await getAuthFromProcess();
    setAuth(auth);
    // Save auth in case of failure
    const authPath = join(tmpdir(), "lcuAuth");
    await fs.writeFile(authPath, JSON.stringify(auth));
    return auth;
  } catch (e) {
    console.log("ERR: Game is not running..", e);
    invalidateAuth();
    return null;
  }
}
