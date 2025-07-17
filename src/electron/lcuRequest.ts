import * as https from "https";
import { LCUAuth } from "./lcuAuth.js";

const badStatusCodes = [400, 403, 404];

export interface RequestOptions {
  hostname?: string;
  port: string;
  path: string;
  method: "GET" | "POST";
  password: string;
  protocol?: string;
}

export async function requestURL(
  auth: LCUAuth | RequestOptions,
  path: string,
  postData?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (auth === null) {
      reject(new Error("NULLAUTH"));
      return;
    }

    const options: https.RequestOptions = {
      hostname: "127.0.0.1",
      port: auth.port,
      path,
      method: postData === undefined ? "GET" : "POST",
      rejectUnauthorized: false,
      agent: false,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`riot:${auth.password}`).toString(
          "base64"
        )}`,
      },
    };

    console.log(
      options.method,
      `https://${options.hostname}:${options.port}${options.path}`
    );

    let body = "";

    const req = https.request(options, (res) => {
      // Error code handling
      if (res.statusCode && badStatusCodes.includes(res.statusCode)) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve(body);
      });
    });

    req.on("error", (error: NodeJS.ErrnoException) => {
      reject(new Error(error.code || "REQUEST_ERROR"));
    });

    if (postData !== undefined) {
      console.log("POSTDATA:", postData);
      req.write(postData);
    }

    req.end();
  });
}

// Live Client API for in-game data (different endpoint)
export async function requestLiveClientAPI(path: string): Promise<string> {
  const config = {
    port: "2999",
    password: "", // Live client API doesn't need auth
  };

  const options: https.RequestOptions = {
    hostname: "127.0.0.1",
    port: config.port,
    path,
    method: "GET",
    rejectUnauthorized: false,
    agent: false,
  };

  return new Promise((resolve, reject) => {
    let body = "";

    const req = https.request(options, (res) => {
      if (res.statusCode && badStatusCodes.includes(res.statusCode)) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve(body);
      });
    });

    req.on("error", (error: NodeJS.ErrnoException) => {
      reject(new Error(error.code || "REQUEST_ERROR"));
    });

    req.end();
  });
}
