import * as Express from "express";
import {
  Controller,
  Get,
  PathParams,
  Req,
  Res } from "@tsed/common";
import { instrumented } from "monkit";
import { Installer, InstallerStore } from "../installers";
import { Templates } from "../util/services/templates";
import { MetricsStore } from "../util/services/metrics";
import { logger } from "../logger";
import * as requestIP from "request-ip";
import { getExternalAddonVersions, getInstallerVersions } from "../installers/installer-versions";
import { getDistUrl, kurlVersionOrDefault } from "../util/package";

interface ErrorResponse {
  error: any;
}

const notFoundResponse = {
  error: {
    message: "The requested installer does not exist",
  },
};

@Controller("/")
export class Installers {
  private distURL: string;

  constructor (
    private readonly installerStore: InstallerStore,
    private readonly templates: Templates,
    private readonly metricsStore: MetricsStore,
  ) {
    this.distURL = getDistUrl();
  }

  /**
   * /<installerID>/join.sh handler
   *
   * @param response
   * @param installerID
   */
  @Get("/version/:kurlVersion/:installerID/join.sh")
  @Get("/:installerID/join.sh")
  @instrumented()
  public async getJoin(
    @Res() response: Express.Response,
    @PathParams("installerID") installerID: string,
    @PathParams("kurlVersion") kvarg: string|undefined,
  ): Promise<string | ErrorResponse> {

    let kurlVersion = kurlVersionOrDefault(kvarg);
    let installerVersions = await getInstallerVersions(this.distURL, kurlVersion);

    let installer = await this.installerStore.getInstaller(installerID, installerVersions);
    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }

    const externalVersions = getExternalAddonVersions();

    // resolve the correct version if specified in the spec
    kurlVersion = kurlVersionOrDefault(kvarg, installer);
    installerVersions = await getInstallerVersions(this.distURL, kurlVersion);
    installer = installer.resolve(installerVersions, externalVersions);

    response.set("X-Kurl-Hash", installer.hash());
    response.status(200);
    return this.templates.renderJoinScript(installer, installerVersions, kurlVersion);
  }

  /**
   * /<installerID>/upgrade.sh handler
   *
   * @param response
   * @param installerID
   */
  @Get("/version/:kurlVersion/:installerID/upgrade.sh")
  @Get("/:installerID/upgrade.sh")
  @instrumented()
  public async getUpgrade(
    @Res() response: Express.Response,
    @PathParams("installerID") installerID: string,
    @PathParams("kurlVersion") kvarg: string|undefined,
  ): Promise<string | ErrorResponse> {

    let kurlVersion = kurlVersionOrDefault(kvarg);
    let installerVersions = await getInstallerVersions(this.distURL, kurlVersion);

    let installer = await this.installerStore.getInstaller(installerID, installerVersions);
    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }

    const externalVersions = getExternalAddonVersions();

    // resolve the correct version if specified in the spec
    kurlVersion = kurlVersionOrDefault(kvarg, installer);
    installerVersions = await getInstallerVersions(this.distURL, kurlVersion);
    installer = installer.resolve(installerVersions, externalVersions);

    response.set("X-Kurl-Hash", installer.hash());
    response.status(200);
    return this.templates.renderUpgradeScript(installer, installerVersions, kurlVersion);
  }

  @Get("/version/:kurlVersion/:installerID/tasks.sh")
  @Get("/:installerID/tasks.sh")
  @instrumented()
  public async getTasks(
    @Res() response: Express.Response,
    @PathParams("installerID") installerID: string,
    @PathParams("kurlVersion") kvarg: string|undefined,
  ): Promise<string | ErrorResponse> {

    let kurlVersion = kurlVersionOrDefault(kvarg);
    let installerVersions = await getInstallerVersions(this.distURL, kurlVersion);

    let installer = await this.installerStore.getInstaller(installerID, installerVersions);
    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }

    const externalVersions = getExternalAddonVersions();

    // resolve the correct version if specified in the spec
    kurlVersion = kurlVersionOrDefault(kvarg, installer);
    installerVersions = await getInstallerVersions(this.distURL, kurlVersion);
    installer = installer.resolve(installerVersions, externalVersions);

    response.set("X-Kurl-Hash", installer.hash());
    response.status(200);
    return this.templates.renderTasksScript(installer, installerVersions, kurlVersion);
  }

  @Get("/")
  @Get("/version/:kurlVersion")
  public async root(
    @Res() response: Express.Response,
    @PathParams("kurlVersion") kvarg: string|undefined,
  ): Promise<string | ErrorResponse> {

    const kurlVersion = kurlVersionOrDefault(kvarg);
    const installerVersions = await getInstallerVersions(this.distURL, kurlVersion);

    const externalVersions = getExternalAddonVersions();
    const installer = Installer.latest(installerVersions).resolve(installerVersions, externalVersions);

    response.set("X-Kurl-Hash", installer.hash());
    response.status(200);
    return this.templates.renderInstallScript(installer, installerVersions, kurlVersion);
  }

  /**
   * /<installerID> handler
   *
   * @param response
   * @param installerID
   * @returns string
   */
  @Get("/version/:kurlVersion/:installerID/install.sh")
  @Get("/:installerID/install.sh")
  @Get("/version/:kurlVersion/:installerID")
  @Get("/:installerID")
  @instrumented()
  public async getInstaller(
    @Res() response: Express.Response,
    @Req() request: Express.Request,
    @PathParams("installerID") installerID: string,
    @PathParams("kurlVersion") kvarg: string|undefined,
  ): Promise<string | ErrorResponse> {

    let kurlVersion = kurlVersionOrDefault(kvarg);
    let installerVersions = await getInstallerVersions(this.distURL, kurlVersion);

    let installer = await this.installerStore.getInstaller(installerID, installerVersions);
    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }

    const externalVersions = getExternalAddonVersions();

    // resolve the correct version if specified in the spec
    kurlVersion = kurlVersionOrDefault(kvarg, installer);
    installerVersions = await getInstallerVersions(this.distURL, kurlVersion);
    installer = installer.resolve(installerVersions, externalVersions);

    try {
      await this.metricsStore.saveSaasScriptEvent({
        installerID,
        timestamp: new Date(),
        isAirgap: false,
        clientIP: requestIP.getClientIp(request),
        userAgent: request.get("User-Agent"),
      });
    } catch (err) {
      logger.error(`Failed to save saas script event: ${err.message}`);
    }

    response.set("X-Kurl-Hash", installer.hash());
    response.status(200);
    return this.templates.renderInstallScript(installer, installerVersions, kurlVersion);
  }
}
