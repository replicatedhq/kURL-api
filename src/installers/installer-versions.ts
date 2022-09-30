import fetch from "node-fetch";
import * as _ from "lodash";
import { HTTPError } from "../server/errors";
import { getPackageUrl } from "../util/package";
import * as semver from "semver";
import { logger } from "../logger";

export interface IInstallerVersions {
  [addon: string]: string[];
}

export interface IExternalInstallerVersions {
  [addon: string]: IExternalInstallerVersion[];
}

export interface IExternalInstallerVersion {
  version: string;
  kurlVersionCompatibilityRange?: string;
  sha256Sum?: string;
}

let externalAddons: IExternalInstallerVersions = {};
let externalAddonTimer: NodeJS.Timer;

interface CachedIIinstallerVersions {
  fetchTime: Date,
  versions: IInstallerVersions,
}

const installerVersionsCache: { [url: string]: CachedIIinstallerVersions } = {};

export function mergeAddonVersions(internalAddonVersions: IInstallerVersions, externalAddons: IExternalInstallerVersions, kurlVersion: string) {
  const addons: IInstallerVersions = {};
  Object.keys(externalAddons).forEach(externalAddonName => {
    externalAddons[externalAddonName].forEach(externalAddon => {
      let satisfies = false;
      if (externalAddon.kurlVersionCompatibilityRange) {
        satisfies = semver.satisfies(kurlVersion, externalAddon.kurlVersionCompatibilityRange, {includePrerelease: true, loose: true});
      }
      if (satisfies) {
        if(!(externalAddonName in addons)) {
          addons[externalAddonName] = [];
        }
        addons[externalAddonName].push(externalAddon.version);
      }
    });
  });
  Object.keys(internalAddonVersions).forEach(internalAddonName => {
    if(!(internalAddonName in addons)) {
      addons[internalAddonName] = [];
    }
    addons[internalAddonName].push(...internalAddonVersions[internalAddonName]);
  });
  return addons;
}

async function getInternalAddonVersions(distUrl: string, kurlVersion: string) {
  const url = getPackageUrl(distUrl, kurlVersion, "supported-versions-gen.json");
  if (url in installerVersionsCache && installerVersionsCache[url]) {
    const elapsed = Date.now() - installerVersionsCache[url].fetchTime.valueOf()
    // if a version has been in the cache for more than 60 seconds, fetch it again.
    // unless the environment is production, in which case use the cached version anyways.
    if (elapsed < 60 * 1000 && process.env["NODE_ENV"] !== "production") {
      return installerVersionsCache[url].versions;
    }
  }

  const res = await fetch(url);
  if (res.status === 404 || res.status === 403) {
    throw new HTTPError(404, `supported versions file not found for ${url}`);
  } else if (res.status !== 200) {
    throw new HTTPError(500, `unexpected addon supported versions http status ${res.statusText} from url ${url}`);
  }
  const body = (await res.json()) as {supportedVersions: IInstallerVersions};
  const installerVersions = body.supportedVersions;
  Object.keys(installerVersions).map((addon: string) => {
    installerVersions[addon] = installerVersions[addon].filter((version: string) => version !== "latest");
    // converts kebab case add-ons to camel case
    // e.g. cert-manager => certManager
    if (addon.includes("-")) {
      installerVersions[_.camelCase(addon)] = installerVersions[addon];
    }
  });
  installerVersionsCache[url] = { fetchTime: new Date(), versions: installerVersions};
  return installerVersionsCache[url].versions;
}

async function externalAddonHandler() {
  try {
    const res = await fetch("https://kurl-sh.s3.amazonaws.com/external/addon-registry.json");
    if (!res.ok) {
      throw new Error(`failed to fetch addon-registry.json with status ${res.status}`);
    }
    externalAddons = await res.json();
  } catch (error) {
    logger.error(error, "failed to pull external addon registry.");
  }
}

export async function startExternalAddonPolling() {
  if (!externalAddonTimer) {
    await externalAddonHandler();
    externalAddonTimer = setInterval(externalAddonHandler, 5 * 60 * 1000); // 5 minutes
  }
}

export async function getInstallerVersions(distUrl: string, kurlVersion: string): Promise<IInstallerVersions> {
  const internalAddonVersions = await getInternalAddonVersions(distUrl, kurlVersion);
  if (process.env.EXCLUDE_EXTERNAL_ADDONS) {
    return internalAddonVersions;
  }
  return mergeAddonVersions(internalAddonVersions, externalAddons, kurlVersion);
}

export function getExternalAddonVersions(): IExternalInstallerVersions {
  return externalAddons;
}
