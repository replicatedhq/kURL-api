import {describe, it} from "mocha";
import {expect} from "chai";
import { Installer } from "../../installers";
import { installerVersions } from "../fixtures/installer-versions";

describe("Resolve version", () => {

  it("resolves correct version without .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "rook", "1.0.4");
    expect(version).to.equal("1.0.4");
  });

  it("resolves correct version with .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "kubernetes", "1.18.x");
    expect(version).to.equal("1.18.20");
  });

  it("resolves correct rook 1.0 version with .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "rook", "1.0.x");
    expect(version).to.equal("1.0.4-14.2.21");
  });

  it("resolves latest", async () => {
    const version = await Installer.resolveVersion(installerVersions, "rook", "latest");
    expect(version).to.equal("1.0.4");
  });

  it("resolves correct weave 2.6 version without .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "weave", "2.6.5");
    expect(version).to.equal("2.6.5");
  });

  it("resolves correct weave 2.6 version with .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "weave", "2.6.x");
    expect(version).to.equal("2.6.5-20220825");
  });

  it("resolves correct weave 2.8 version without .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "weave", "2.8.1");
    expect(version).to.equal("2.8.1");
  });

  it("resolves correct weave 2.8 version with .x", async () => {
    const version = await Installer.resolveVersion(installerVersions, "weave", "2.8.x");
    expect(version).to.equal("2.8.1-20220825");
  });

  it("resolves weave latest", async () => {
    const version = await Installer.resolveVersion(installerVersions, "weave", "latest");
    expect(version).to.equal("2.6.5-20220825");
  });

});

describe("greatest", () => {

  it("resolves greatest openebs", () => {
    const version = Installer.greatest(["1.12.0", "1.6.0", "3.2.0", "2.12.9", "2.6.0"]);
    expect(version).to.equal("3.2.0");
  });

});
