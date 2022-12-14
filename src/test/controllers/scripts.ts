import { describe, it } from "mocha";
import { expect } from "chai";
import * as _ from "lodash";
import { Templates } from "../../util/services/templates";
import { Installer, InstallerStore } from "../../installers";
import { Installers } from "../../controllers/Scripts";
import { MetricsStore } from "../../util/services/metrics";
import { MysqlWrapper } from "../../util/services/mysql";
import * as installerVersionsPkg from "../../installers/installer-versions";
import * as packagePkg from "../../util/package";
import * as kurlVersionPkg from "../../util/package/kurl-version";
import { mockReq, mockRes } from 'sinon-express-mock';
import { installerVersions } from "../fixtures/installer-versions";
import * as sinon from "sinon";

describe("When Installers controller is called ", () => {

  const req = mockReq();
  const res = mockRes();

  const mysqlWrapper = new MysqlWrapper();
  const templates = new Templates();
  const installerStore = new InstallerStore(mysqlWrapper);
  const metricsStore = new MetricsStore(mysqlWrapper);

  const urlInstallerVersion = "v2022.03.23-0";
  const specInstallerVersion = "v2022.03.11-0";
  const installerID = "1b76c06";

  const tmpl = `
KURL_URL="{{= KURL_URL }}"
DIST_URL="{{= DIST_URL }}"
FALLBACK_URL="{{= FALLBACK_URL }}"
INSTALLER_ID="{{= INSTALLER_ID }}"
KURL_VERSION="{{= KURL_VERSION }}"
CRICTL_VERSION=1.20.0
REPLICATED_APP_URL="{{= REPLICATED_APP_URL }}"
KURL_UTIL_IMAGE="{{= KURL_UTIL_IMAGE }}"
KURL_BIN_UTILS_FILE="{{= KURL_BIN_UTILS_FILE }}"
STEP_VERSIONS={{= STEP_VERSIONS }}
ROOK_STEP_VERSIONS={{= ROOK_STEP_VERSIONS }}
INSTALLER_YAML="{{= INSTALLER_YAML }}"`;

  const yaml = `apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: "1b76c06"
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
    version: latest
  metricsServer:
    version: latest
  velero:
    version: 1.9.x
`;

const installer = Installer.parse(yaml);

  it("should inject installerVersion provided as url parameter", async () => {

    const installerStoreStub = sinon.stub(installerStore, "getInstaller");
    installer.spec.kurl = undefined;
    installerStoreStub.withArgs(installerID, installerVersions).resolves(
      installer
    );

    const metricStoreStub = sinon.stub(metricsStore, "saveSaasScriptEvent");
    const GetInstallScriptEvent = { id: installerID, installerID: installerID, timestamp: new Date(), isAirgap: false, clientIP: "CLIENT_IP", userAgent: "USER_AGENT" };
    metricStoreStub.withArgs(GetInstallScriptEvent).resolves();

    const templatesStub = sinon.stub(templates, "fetchScriptTemplate");
    templatesStub.withArgs(urlInstallerVersion, "install.tmpl").resolves(tmpl);

    const packageMock = sinon.mock(packagePkg);
    packageMock.expects("getDistUrl").returns("DIST_URL");

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    installerVersionsMock.expects("getInstallerVersions").twice().withArgs("DIST_URL", urlInstallerVersion).returns(installerVersions);

    const installersController = new Installers(installerStore, templates, metricsStore);
    const script = await installersController.getInstaller(res, req, installerID, urlInstallerVersion);
    expect(script).to.contain(`KURL_VERSION="${urlInstallerVersion}"`)
    expect(script).to.contain(`kurl:\n    installerVersion: ${urlInstallerVersion}\n    additionalNoProxyAddresses: []`);

    packageMock.verify();
    packageMock.restore();
    installerVersionsMock.verify();
    installerVersionsMock.restore();

    installerStoreStub.restore();
    metricStoreStub.restore();
    templatesStub.restore();
  });

  it("should overwrite installerVersion is spec with version in url", async () => {

    const installerStoreStub = sinon.stub(installerStore, "getInstaller");
    installer.spec.kurl = {additionalNoProxyAddresses: [], installerVersion: specInstallerVersion}
    installerStoreStub.withArgs(installerID, installerVersions).resolves(
      installer
    );

    const metricStoreStub = sinon.stub(metricsStore, "saveSaasScriptEvent");
    const GetInstallScriptEvent = { id: installerID, installerID: installerID, timestamp: new Date(), isAirgap: false, clientIP: "CLIENT_IP", userAgent: "USER_AGENT" };
    metricStoreStub.withArgs(GetInstallScriptEvent).resolves();

    const templatesStub = sinon.stub(templates, "fetchScriptTemplate");
    templatesStub.withArgs(urlInstallerVersion, "install.tmpl").resolves(tmpl);

    const packageMock = sinon.mock(packagePkg);
    packageMock.expects("getDistUrl").returns("DIST_URL");

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    installerVersionsMock.expects("getInstallerVersions").twice().withArgs("DIST_URL", urlInstallerVersion).returns(installerVersions);

    const installersController = new Installers(installerStore, templates, metricsStore);
    const script = await installersController.getInstaller(res, req, installerID, urlInstallerVersion);
    expect(script).to.contain(`KURL_VERSION="${urlInstallerVersion}"`)
    expect(script).to.contain(`kurl:\n    installerVersion: ${urlInstallerVersion}\n    additionalNoProxyAddresses: []`);

    packageMock.verify();
    packageMock.restore();
    installerVersionsMock.verify();
    installerVersionsMock.restore();

    installerStoreStub.restore();
    metricStoreStub.restore();
    templatesStub.restore();
  });

  it("should use installerVersion in spec if none in url", async () => {

    const installerStoreStub = sinon.stub(installerStore, "getInstaller");
    installer.spec.kurl = {additionalNoProxyAddresses: [], installerVersion: specInstallerVersion}
    installerStoreStub.withArgs(installerID, installerVersions).resolves(
      installer
    );

    const metricStoreStub = sinon.stub(metricsStore, "saveSaasScriptEvent");
    const GetInstallScriptEvent = { id: installerID, installerID: installerID, timestamp: new Date(), isAirgap: false, clientIP: "CLIENT_IP", userAgent: "USER_AGENT" };
    metricStoreStub.withArgs(GetInstallScriptEvent).resolves();

    const templatesStub = sinon.stub(templates, "fetchScriptTemplate");
    templatesStub.withArgs(specInstallerVersion, "install.tmpl").resolves(tmpl);

    const packageMock = sinon.mock(packagePkg);
    packageMock.expects("getDistUrl").returns("DIST_URL");
    const kurlVersionMock = sinon.mock(kurlVersionPkg);
    kurlVersionMock.expects("getDefaultKurlVersion").withExactArgs().returns("v0.0.0-0");

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    installerVersionsMock.expects("getInstallerVersions").withArgs("DIST_URL", "v0.0.0-0").returns(installerVersions);

    const installerVersionsMissingLatestVelero = _.cloneDeep(installerVersions);
    installerVersionsMissingLatestVelero.velero = _.filter(installerVersionsMissingLatestVelero.velero, (v) => v !== '1.9.1');
    installerVersionsMock.expects("getInstallerVersions").withArgs("DIST_URL", specInstallerVersion).returns(installerVersionsMissingLatestVelero);

    const installersController = new Installers(installerStore, templates, metricsStore);
    const script = await installersController.getInstaller(res, req, installerID, "");
    expect(script).to.contain(`KURL_VERSION="${specInstallerVersion}"`)
    expect(script).to.contain(`kurl:\n    installerVersion: ${specInstallerVersion}\n    additionalNoProxyAddresses: []`);
    expect(script).to.contain(`velero:\n    version: 1.9.0`);

    packageMock.verify();
    packageMock.restore();
    kurlVersionMock.verify();
    kurlVersionMock.restore();
    installerVersionsMock.verify();
    installerVersionsMock.restore();

    installerStoreStub.restore();
    metricStoreStub.restore();
    templatesStub.restore();
  });

  it("should use default installerVersion if none in spec or url", async () => {

    const installerStoreStub = sinon.stub(installerStore, "getInstaller");
    installer.spec.kurl = undefined;
    installerStoreStub.withArgs(installerID, installerVersions).resolves(
      installer
    );

    const metricStoreStub = sinon.stub(metricsStore, "saveSaasScriptEvent");
    const GetInstallScriptEvent = { id: installerID, installerID: installerID, timestamp: new Date(), isAirgap: false, clientIP: "CLIENT_IP", userAgent: "USER_AGENT" };
    metricStoreStub.withArgs(GetInstallScriptEvent).resolves();

    const templatesStub = sinon.stub(templates, "fetchScriptTemplate");
    templatesStub.withArgs("v0.0.0-0", "install.tmpl").resolves(tmpl);

    const packageMock = sinon.mock(packagePkg);
    packageMock.expects("getDistUrl").returns("DIST_URL");
    const kurlVersionMock = sinon.mock(kurlVersionPkg);
    kurlVersionMock.expects("getDefaultKurlVersion").withExactArgs().twice().returns("v0.0.0-0");

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    installerVersionsMock.expects("getInstallerVersions").twice().withArgs("DIST_URL", "v0.0.0-0").returns(installerVersions);

    const installersController = new Installers(installerStore, templates, metricsStore);
    const script = await installersController.getInstaller(res, req, installerID, "");
    expect(script).to.contain(`KURL_VERSION="v0.0.0-0"`)
    expect(script).to.contain(`kurl:\n    installerVersion: v0.0.0-0\n    additionalNoProxyAddresses: []`);

    packageMock.verify();
    packageMock.restore();
    kurlVersionMock.verify();
    kurlVersionMock.restore();
    installerVersionsMock.verify();
    installerVersionsMock.restore();

    installerStoreStub.restore();
    metricStoreStub.restore();
    templatesStub.restore();
  });

  it("should resolve latest addon versions", async () => {

    const installerStoreStub = sinon.stub(installerStore, "getInstaller");
    installer.spec.kurl = undefined;
    installerStoreStub.withArgs(installerID, installerVersions).resolves(
      installer
    );

    const metricStoreStub = sinon.stub(metricsStore, "saveSaasScriptEvent");
    const GetInstallScriptEvent = { id: installerID, installerID: installerID, timestamp: new Date(), isAirgap: false, clientIP: "CLIENT_IP", userAgent: "USER_AGENT" };
    metricStoreStub.withArgs(GetInstallScriptEvent).resolves();

    const templatesStub = sinon.stub(templates, "fetchScriptTemplate");
    templatesStub.withArgs("v0.0.0-0", "install.tmpl").resolves(tmpl);

    const packageMock = sinon.mock(packagePkg);
    packageMock.expects("getDistUrl").returns("DIST_URL");
    const kurlVersionMock = sinon.mock(kurlVersionPkg);
    kurlVersionMock.expects("getDefaultKurlVersion").withExactArgs().twice().returns("v0.0.0-0");

    const installerVersionsMock = sinon.mock(installerVersionsPkg);
    installerVersionsMock.expects("getInstallerVersions").twice().withArgs("DIST_URL", "v0.0.0-0").returns(installerVersions);

    const installersController = new Installers(installerStore, templates, metricsStore);
    const script = await installersController.getInstaller(res, req, installerID, "");
    expect(script).to.contain(`sonobuoy:\n    version: 0.56.10`);
    expect(script).to.contain(`metricsServer:\n    version: 0.4.1`);

    packageMock.verify();
    packageMock.restore();
    kurlVersionMock.verify();
    kurlVersionMock.restore();
    installerVersionsMock.verify();
    installerVersionsMock.restore();

    installerStoreStub.restore();
    metricStoreStub.restore();
    templatesStub.restore();
  });
});
