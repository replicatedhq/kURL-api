import { describe, it } from "mocha";
import { expect } from "chai";
import { mergeAddonVersions, IInstallerVersions, IExternalInstallerVersions } from "../../installers/installer-versions";

describe("mergeAddonVersions", () => {
  it("successfully merges external version ranges", async () => {
    const internalAddonVersions: IInstallerVersions = {
      kotsadm: ["1.83.1", "1.83.0", "alpha", "nightly"],
      another: ["1.1.0", "1.0.0"],
    };
    const externalAddonVersions: IExternalInstallerVersions = {
      kotsadm: [
        { version: "1.87.0", kurlVersionCompatibilityRange: ">= v2022.09.20-0" },
        { version: "1.86.0", kurlVersionCompatibilityRange: ">= v2022.09.19-2" },
        { version: "1.85.0", kurlVersionCompatibilityRange: ">= v2022.09.19-1" },
        { version: "1.84.0", kurlVersionCompatibilityRange: ">= v2022.09.19-0", isPrerelease: false },
        { version: "1.83.0", kurlVersionCompatibilityRange: ">= v2022.09.18-0", isPrerelease: true },
      ]
    }
    expect(mergeAddonVersions(internalAddonVersions, externalAddonVersions, "v2022.09.18-0")["another"]).to.deep.equal(["1.1.0", "1.0.0"]);
    expect(mergeAddonVersions(internalAddonVersions, externalAddonVersions, "v2022.09.18-0")["kotsadm"]).to.deep.equal(["1.83.1", "1.83.0", "alpha", "nightly"]);
    expect(mergeAddonVersions(internalAddonVersions, externalAddonVersions, "v2022.09.19-0")["kotsadm"]).to.deep.equal(["1.84.0", "1.83.1", "1.83.0", "alpha", "nightly"]);
    expect(mergeAddonVersions(internalAddonVersions, externalAddonVersions, "v2022.09.19-1")["kotsadm"]).to.deep.equal(["1.85.0", "1.84.0", "1.83.1", "1.83.0", "alpha", "nightly"]);
    expect(mergeAddonVersions(internalAddonVersions, externalAddonVersions, "v2022.09.21-0")["kotsadm"]).to.deep.equal(["1.87.0", "1.86.0", "1.85.0", "1.84.0", "1.83.1", "1.83.0", "alpha", "nightly"]);
  });
});
