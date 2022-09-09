import fetch from "node-fetch";
import * as _ from "lodash";
import { HTTPError } from "../server/errors";
import { getPackageUrl } from "../util/package";
import * as semver from "semver";
import { logger } from "../logger";

export interface IInstallerVersions {
  [addon: string]: string[];
}

const installerVersionsCache: { [url: string]: IInstallerVersions } = {};
let externalAddons = {};
let externalAddonTimer: NodeJS.Timer;

function mergeAddonVersions(internalAddonVersions: IInstallerVersions, kurlVersion: string) {
  const addons: IInstallerVersions = {};
  Object.keys(externalAddons).forEach(externalAddonName => {
    const fileName = externalAddonName.slice(0, externalAddonName.length - 7); // trim off .tar.gz
    const [name, version] = fileName.split("-");
    if (!kurlVersion || semver.gte(version, kurlVersion, true)) {
      if(!addons[name]) {
        addons[name] = [version]
      } else {
        addons[name].unshift(version);
      }
    }
  });
  Object.keys(internalAddonVersions).forEach(internalAddonName => {
    if (!addons[internalAddonName]) {
      addons[internalAddonName] = internalAddonVersions[internalAddonName];
    } else {
      addons[internalAddonName].push(...internalAddonVersions[internalAddonName]);
    }
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
  return mergeAddonVersions(internalAddonVersions, kurlVersion);
}
