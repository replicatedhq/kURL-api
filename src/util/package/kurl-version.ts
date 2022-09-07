import fetch from "node-fetch";
import { getDistUrl } from ".";
import { logger } from "../../logger";

let kurlVersion = "";
let kurlVersionTimer: NodeJS.Timer;

const pollingInterval = 60 * 1000; // 1 minute

export function getDefaultKurlVersion(): string {
  return kurlVersion;
}

export async function startKurlVersionPolling() {
  const distUrl = getDistUrl();
  if (!kurlVersionTimer) {
    await kurlVersionHandler(distUrl);
    kurlVersionTimer = setInterval(() => {
      kurlVersionHandler(distUrl)
    }, pollingInterval);
  }
}

async function kurlVersionHandler(distUrl: string) {
  try {
    const url = `${distUrl}/VERSION`
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`failed to fetch versions file from url ${url} with status ${res.status}`);
    }
    kurlVersion = (await res.text()).trim();
  } catch (error) {
    logger.error(error, "failed to pull external addon registry");
  }
}
