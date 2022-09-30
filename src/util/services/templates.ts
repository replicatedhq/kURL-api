import fetch from "node-fetch";
import * as _ from "lodash";
import { Service } from "@tsed/common";
import { Installer } from "../../installers";
import { IInstallerVersions } from "../../installers/installer-versions";
import { HTTPError } from "../../server/errors";
import {getDistUrl, getFallbackUrl, getPackageUrl, kurlVersionOrDefault} from "../package";

@Service()
export class Templates {

  private kurlURL: string;
  private distURL: string;
  private fallbackURL: string;
  private replicatedAppURL: string;
  private templateOpts = {
    // HACK: do not hijack these from user facing go text template
    escape: /{{--unsupported--([\s\S]+?)}}/g, // do not use this
    evaluate: /{{-unsupported-([\s\S]+?)}}/g, // do not use this
    interpolate: /{{=([\s\S]+?)}}/g,
  };

  constructor() {
    this.kurlURL = process.env["KURL_URL"] || "https://kurl.sh";
    this.replicatedAppURL = process.env["REPLICATED_APP_URL"] || "https://replicated.app";

    this.distURL = getDistUrl();
    this.fallbackURL = getFallbackUrl();
  }

  public async renderInstallScript(i: Installer, installerVersions: IInstallerVersions, kurlVersion: string): Promise<string> {
    return await this.renderScriptFromUpstream(i, installerVersions, kurlVersion, "install.tmpl");
  }

  public async renderJoinScript(i: Installer, installerVersions: IInstallerVersions, kurlVersion: string): Promise<string> {
    return await this.renderScriptFromUpstream(i, installerVersions, kurlVersion, "join.tmpl");
  }

  public async renderUpgradeScript(i: Installer, installerVersions: IInstallerVersions, kurlVersion: string): Promise<string> {
    return await this.renderScriptFromUpstream(i, installerVersions, kurlVersion, "upgrade.tmpl");
  }

  public async renderTasksScript(i: Installer, installerVersions: IInstallerVersions, kurlVersion: string): Promise<string> {
    return await this.renderScriptFromUpstream(i, installerVersions, kurlVersion, "tasks.tmpl");
  }

  public async renderScriptFromUpstream(i: Installer, installerVersions: IInstallerVersions, kurlVersion: string, script: string): Promise<string> {
    const tmpl = await this.tmplFromUpstream(kurlVersion, script);
    return tmpl(manifestFromInstaller(i, this.kurlURL, this.replicatedAppURL, installerVersions, this.distURL, this.fallbackURL, kurlVersion));
  }

  public async tmplFromUpstream(kurlVersion: string, script: string): Promise<((data?: Manifest) => string)> {
    const body = await this.fetchScriptTemplate(kurlVersion, script);
    return _.template(body, this.templateOpts);
  }

  public async fetchScriptTemplate(kurlVersion: string, script: string): Promise<string> {
    const res = await fetch(getPackageUrl(this.distURL, kurlVersion, script));
    if (res.status === 404) {
      throw new HTTPError(404, "version not found");
    } else if (res.status !== 200) {
      throw new HTTPError(500, `unexpected http status ${res.statusText}`);
    }
    return await res.text();
  }
}

interface Manifest {
  KURL_URL: string;
  DIST_URL: string;
  FALLBACK_URL: string;
  INSTALLER_ID: string;
  KURL_VERSION: string;
  REPLICATED_APP_URL: string;
  KURL_UTIL_IMAGE: string;
  KURL_BIN_UTILS_FILE: string;
  STEP_VERSIONS: string;
  INSTALLER_YAML: string;
}

export function bashStringEscape( unescaped : string): string {
  return unescaped.replace(/[!"\\]/g, "\\$&");
}

export function manifestFromInstaller(i: Installer, kurlUrl: string, replicatedAppURL: string, installerVersions: IInstallerVersions, distUrl: string, fallbackUrl: string, kurlVersion: string): Manifest {
  let kurlUtilImage = "replicated/kurl-util:alpha";
  let kurlBinUtils = "kurl-bin-utils-latest.tar.gz";
  if (kurlVersion) {
    kurlUtilImage = `replicated/kurl-util:${kurlVersion}`;
    kurlBinUtils = `kurl-bin-utils-${kurlVersion}.tar.gz`;
    i.setKurlVersion(kurlVersion);
  }
  return {
    KURL_URL: kurlUrl,
    DIST_URL: distUrl,
    FALLBACK_URL: fallbackUrl,
    INSTALLER_ID: i.id,
    KURL_VERSION: kurlVersion,
    REPLICATED_APP_URL: replicatedAppURL,
    KURL_UTIL_IMAGE: kurlUtilImage,
    KURL_BIN_UTILS_FILE: kurlBinUtils,
    STEP_VERSIONS: `(${Installer.latestMinors(installerVersions["kubernetes"]).join(" ")})`,
    INSTALLER_YAML: bashStringEscape(i.toYAML()),
  };
}
