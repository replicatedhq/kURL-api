import * as path from "path";
import * as Express from "express";
import * as request from "request-promise";
import {
  Controller,
  Get,
  PathParams,
  Res } from "ts-express-decorators";
import { Templates } from "../util/services/templates";
import { InstallerStore } from "../installers";

interface ErrorResponse {
  error: any;
}

const notFoundResponse = {
  error: {
    message: "The requested installer does not exist",
  },
};

interface FilepathContentsMap {
  [filepath: string]: string;
}

// Manifest for building an airgap bundle.
interface BundleManifest {
  layers: Array<string>;
  files: FilepathContentsMap;
};

@Controller("/bundle")
export class Bundle {
  private distOrigin: string;

  constructor(
    private readonly templates: Templates,
    private readonly installers: InstallerStore,
  ) {
    this.distOrigin = `https://${process.env["KURL_BUCKET"]}.s3.amazonaws.com`;
  }

  /**
   * /bundle/ handler
   *
   * @param response
   * @returns {{id: any, name: string}}
   */
  @Get("/:installerID")
  public async redirect(
    @Res() response: Express.Response,
    @PathParams("installerID") installerID: string,
  ): Promise<BundleManifest|ErrorResponse> {

    let installer = await this.installers.getInstaller(installerID);

    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }
    installer = installer.resolve();

    response.type("application/json");

    const ret: BundleManifest = {layers: [], files: {}};
    ret.layers = installer.packages().map((pkg) => `${this.distOrigin}/dist/${pkg}.tar.gz`);

    if (installer.kotsadmApplicationSlug()) {
      const appMetadata = await request(`https://replicated.app/metadata/${installer.kotsadmApplicationSlug()}`);
      const key = `addons/kotsadm/${installer.kotsadmVersion()}/application.yaml`;

      ret.files[key] = appMetadata;
    }

    ret.files["install.sh"] = this.templates.renderInstallScript(installer);
    ret.files["join.sh"] = this.templates.renderJoinScript(installer);
    ret.files["upgrade.sh"] = this.templates.renderUpgradeScript(installer);

    return ret;
  }
}
