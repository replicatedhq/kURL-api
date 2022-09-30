import {describe, it} from "mocha";
import {expect} from "chai";
import { bashStringEscape, manifestFromInstaller } from "../../util/services/templates";
import { Installer } from "../../installers";
import * as installerVersionsPkg from "../../installers/installer-versions";
import * as sinon from "sinon";


describe("Escape Bash Special Characters", () => {

  it("escapes select characters", () => {
    const valid= String.raw`
daemonConfig: |
  {
      "double-quotes": ["\backslash", {"exclaimation": "!"}],
  }
`
    const out = bashStringEscape(valid);
    expect(out).to.contain(String.raw`\"double-quotes\": [\"\\backslash\", {\"exclaimation\": \"\!\"}],`);
  });

  // js-yaml will add single quotes to numeric objects to make valid yaml
  it("does not escape single quotes", () => {
    const singleQuotes= String.raw`metadata: '12345678'`
    const out = bashStringEscape(singleQuotes);
    expect(out).to.equal(singleQuotes);
  });

});

describe("When rendering installer yaml", () => {

  it("does not strip double quotes from integers", async () => {

    const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "0668700"
spec:
  kubernetes:
    version: 1.19.9
  docker:
    version: 20.10.5
  weave:
    version: 2.6.5
  rook:
    isBlockStorageEnabled: true
    version: 1.4.3
  prometheus:
    version: 0.46.0
  sonobuoy:
    version: 0.50.0
`;
    const installer = Installer.parse(yaml);

    const versions = {
      "kubernetes": ["1.19.9"],
    };
    const manifest = manifestFromInstaller(installer, "KURL_URL", "APP_URL", versions, "DIST_URL", "FALLBACK_URL",  "");
    expect(manifest.INSTALLER_YAML).to.contain(`name: '0668700'`);
  });
});

describe("When rendering installer yaml with kurlVersion from url", () => {

  it("injects the kurl version from the argument", async () => {

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    const distUrl = "DIST_URL";
    const fallbackUrl = "FALLBACK_URL";
    const kurlInstallerVersion = "v2022.03.23-0";

    const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "0668700"
spec:
  kubernetes:
    version: 1.19.9
  docker:
    version: 20.10.5
  weave:
    version: 2.6.5
  rook:
    isBlockStorageEnabled: true
    version: 1.4.3
  prometheus:
    version: 0.46.0
  sonobuoy:
    version: 0.50.0
`;
    const installer = Installer.parse(yaml);

    const versions = {
      "kubernetes": ["1.19.9"],
    };
    const manifest = manifestFromInstaller(installer, "KURL_URL", "APP_URL", versions, distUrl, fallbackUrl, kurlInstallerVersion);
    expect(manifest.INSTALLER_YAML).to.contain(`installerVersion: ${kurlInstallerVersion}`);

    installerVersionsMock.verify();
    installerVersionsMock.restore();
  });
});

describe("When rendering installer yaml with kurlVersion in spec", () => {

  it("includes the kurl version from the spec", async () => {

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    const distUrl = "DIST_URL";
    const fallbackUrl = "FALLBACK_URL";
    const kurlInstallerVersion = "v2022.03.23-0";

    const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "0668700"
spec:
  kubernetes:
    version: 1.19.9
  docker:
    version: 20.10.5
  weave:
    version: 2.6.5
  rook:
    isBlockStorageEnabled: true
    version: 1.4.3
  prometheus:
    version: 0.46.0
  sonobuoy:
    version: 0.50.0
  kurl:
    installerVersion: ${kurlInstallerVersion}
`;
    const installer = Installer.parse(yaml);

    const versions = {
      "kubernetes": ["1.19.9"],
    };
    const manifest = manifestFromInstaller(installer, "KURL_URL", "APP_URL", versions, distUrl, fallbackUrl, "");
    expect(manifest.INSTALLER_YAML).to.contain(`installerVersion: ${kurlInstallerVersion}`);

    installerVersionsMock.verify();
    installerVersionsMock.restore();
  });
});

describe("When rendering installer yaml with kurlVersion in spec and url", () => {

  it("kurlVersion from the url overwrites version in spec", async () => {

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    const distUrl = "DIST_URL";
    const fallbackUrl = "FALLBACK_URL";
    const kurlUrlInstallerVersion = "v2022.03.23-0";
    const specKurlInstallerVersion = "v2022.03.11-0";

    const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "0668700"
spec:
  kubernetes:
    version: 1.19.9
  docker:
    version: 20.10.5
  weave:
    version: 2.6.5
  rook:
    isBlockStorageEnabled: true
    version: 1.4.3
  prometheus:
    version: 0.46.0
  sonobuoy:
    version: 0.50.0
  kurl:
    installerVersion: ${specKurlInstallerVersion}
    airgap: false
`;
    const installer = Installer.parse(yaml);

    const versions = {
      "kubernetes": ["1.19.9"],
    };
    const manifest = manifestFromInstaller(installer, "KURL_URL", "APP_URL", versions, distUrl, fallbackUrl, kurlUrlInstallerVersion);
    expect(manifest.INSTALLER_YAML).to.contain(`installerVersion: ${kurlUrlInstallerVersion}`);
    expect(manifest.INSTALLER_YAML).to.contain(`airgap: false`);

    installerVersionsMock.verify();
    installerVersionsMock.restore();
  });
});

describe("When rendering installer yaml with kurlVersion in neither spec nor url", () => {

  it("includes the kurl version from the spec", async () => {
  
    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    const distUrl = "DIST_URL"
    const fallbackUrl = "FALLBACK_URL"

    const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "0668700"
spec:
  kubernetes:
    version: 1.19.9
  docker:
    version: 20.10.5
  weave:
    version: 2.6.5
  rook:
    isBlockStorageEnabled: true
    version: 1.4.3
  prometheus:
    version: 0.46.0
  sonobuoy:
    version: 0.50.0
`;
    const installer = Installer.parse(yaml);

    const versions = {
      "kubernetes": ["1.19.9"],
    };
    const manifest = manifestFromInstaller(installer, "KURL_URL", "APP_URL", versions, distUrl, fallbackUrl, "v0.0.0-0");
    expect(manifest.INSTALLER_YAML).to.contain(`installerVersion: v0.0.0-0`);

    installerVersionsMock.verify();
    installerVersionsMock.restore();
  });
});
