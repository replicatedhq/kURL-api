import * as Express from "express";
import {
  Controller,
  Get,
  PathParams,
  Post,
  Put,
  QueryParams,
  Req,
  Res } from "ts-express-decorators";
import { instrumented } from "monkit";
import { Installer, InstallerStore } from "../installers";
import decode from "../util/jwt";
import { Forbidden } from "../server/errors";
import { Kubernetes } from "../kubernetes";
import { S3Wrapper } from "../util/services/s3";
import { logger } from "../logger";

interface ErrorResponse {
  error: any;
}

const invalidYAMLResponse = {
  error: {
    message: "YAML could not be parsed",
  },
};

const teamWithGeneratedIDResponse = {
  error: {
    message: "Name is indistinguishable from a generated ID."
  },
}

const idNameMismatchResponse = {
  error: {
    message: "URL path ID must match installer name in yaml if provided",
  },
};

const slugCharactersResponse = {
  error: {
    message: "Only base64 URL characters may be used for custom named installers",
  },
};

const slugReservedResponse = {
  error: {
    message: "The requested custom installer name is reserved",
  },
};

const notFoundResponse = {
  error: {
    message: "The requested installer does not exist",
  },
};

const unauthenticatedResponse = {
  error: {
    message: "Authentication required",
  },
};

const forbiddenResponse = {
  error: {
    message: "Forbidden",
  },
};

@Controller("/installer")
export class Installers {

  private kurlURL: string;

  constructor (
    private readonly installerStore: InstallerStore,
    private readonly kubernetes: Kubernetes,
    private readonly s3: S3Wrapper,
  ) {
    this.kurlURL = process.env["KURL_URL"] || "https://kurl.sh";
  }

  private async airgapBundleOK(i: Installer): Promise<boolean> {
    try {
      return await this.s3.objectExists(`bundle/${i.id}.tar.gz`);
    } catch(error) {
      logger.error(error);
      // don't trigger a new airgap build based on a failed call to S3
      return true;
    }
  }

  /**
   * /installer handler for custom configurations by unauthenticated users. Equivalent configs
   * should return identical URLs, which generally part of the SHA of the spec. "latest" is a
   * special case that applies when every component version is specified as "latest".
   *
   * @param response
   * @param request
   * @returns string
   */
  @Post("/")
  @instrumented
  public async createInstaller(
    @Res() response: Express.Response,
    @Req() request: Express.Request,
  ): Promise<string | ErrorResponse> {
    let i: Installer;
    try {
      i = Installer.parse(request.body);
    } catch(error) {
      response.status(400);
      return invalidYAMLResponse;
    }

    if (i.isLatest()) {
      response.contentType("text/plain");
      response.status(201);
      return `${this.kurlURL}/latest`;
    }
    i.id = i.hash();

    const err = i.validate();
    if (err) {
      response.status(400);
      return { error: { message: err } };
    }

    const created = await this.installerStore.saveAnonymousInstaller(i);

    if (created) {
      logger.info(`Building new airgap bundle: ${i.id}`);
      await this.kubernetes.runCreateAirgapBundleJob(i);
    } else if (!(await this.airgapBundleOK(i))) {
      logger.info(`Rebuilding missing airgap bundle: ${i.id}`);
      await this.kubernetes.maybeRunCreateAirgapBundleJob(i); 
    }

    response.contentType("text/plain");
    response.status(201);
    return `${this.kurlURL}/${i.id}`;
  }

  /**
   * authenticated /installer/<id> handler
   *
   * @param request
   * @param response
   * @returns string
   */
  @Put("/:id")
  public async putInstaller(
    @Res() response: Express.Response,
    @Req() request: Express.Request,
    @PathParams("id") id: string,
  ): Promise<string | ErrorResponse> {
    const auth = request.header("Authorization");
    if (!auth) {
      response.status(401);
      return unauthenticatedResponse;
    }

    let teamID: string;
    try {
      teamID = await decode(auth);
    } catch(error) {
      response.status(401);
      return unauthenticatedResponse;
    }

    if (!teamID) {
      response.status(401);
      return unauthenticatedResponse;
    }

    if (Installer.isSHA(id)) {
      response.status(400);
      return teamWithGeneratedIDResponse;
    }
    if (!Installer.isValidSlug(id)) {
      response.status(400);
      return slugCharactersResponse;
    }
    if (Installer.slugIsReserved(id)) {
      response.status(400);
      return slugReservedResponse;
    }

    let i: Installer;
    try {
      i = Installer.parse(request.body, teamID);
    } catch(error) {
      response.status(400);
      return { error };
    }
    if (i.id !== "" && i.id !== id) {
      return idNameMismatchResponse;
    }
    i.id = id;
    const err = i.validate();
    if (err) {
      return err;
    }

    const newOrChanged = await this.installerStore.saveTeamInstaller(i);
    if (newOrChanged) {
      logger.info(`Building new/updated airgap bundle: ${i.id}`);
      await this.kubernetes.runCreateAirgapBundleJob(i);
    } else if (!(await this.airgapBundleOK(i))) {
      logger.info(`Rebuilding missing airgap bundle: ${i.id}`);
      await this.kubernetes.maybeRunCreateAirgapBundleJob(i); 
    }

    response.contentType("text/plain");
    response.status(201);
    return `${this.kurlURL}/${i.id}`;
    return "";
  }

  /**
   * Get installer yaml
   * @param request
   * @param response
   * @param id
   * @returns string
   */
  @Get("/:id")
  public async getInstaller(
    @Res() response: Express.Response,
    @Req() request: Express.Request,
    @PathParams("id") id: string,
    @QueryParams("resolve") resolve: string,
  ): Promise<string | ErrorResponse> {
    let installer = await this.installerStore.getInstaller(id);
    if (!installer) {
      response.status(404);
      return notFoundResponse;
    }
    if (resolve) {
      installer = installer.resolve();
    }
    if (installer.id === "latest") {
      installer.id = "";
    }

    response.contentType("text/yaml");
    response.status(200);
    return installer.toYAML();
  }
}
