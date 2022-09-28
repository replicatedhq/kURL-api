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

const installerVersionsCache: { [url: string]: IInstallerVersions } = {};
let externalAddons: IExternalInstallerVersions = {};
let externalAddonTimer: NodeJS.Timer;

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
    return installerVersionsCache[url];
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
  installerVersionsCache[url] = installerVersions;
  return installerVersionsCache[url];
}

async function externalAddonHandler() {
  try {
    const response = await fetch("https://kurl-sh.s3.amazonaws.com/external/addon-registry.json");
    externalAddons = await response.json();
  } catch (error) {
    logger.error(error, "failed to pull external addon registry.");
  }
}

export async function startExternalAddonPolling() {
  if (!externalAddonTimer) {
    await externalAddonHandler();
    externalAddonTimer = setInterval(externalAddonHandler, 15 * 60 * 1000);
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
