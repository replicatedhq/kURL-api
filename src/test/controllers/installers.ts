import {describe, it} from "mocha";
import {expect} from "chai";
import { Installer } from "../../installers";
import * as _ from "lodash";
import { installerVersions } from "../fixtures/installer-versions";

const everyOption = `apiVersion: kurl.sh/v1beta1
metadata:
  name: everyOption
spec:
  kubernetes:
    version: 1.21.11
    serviceCidrRange: /12
    serviceCIDR: 100.1.1.1/12
    HACluster: false
    masterAddress: 192.168.1.1
    loadBalancerAddress: 10.128.10.1
    loadBalancerUseFirstPrimary: true
    containerLogMaxSize: 256Ki
    containerLogMaxFiles: 4
    bootstrapToken: token
    bootstrapTokenTTL: 10min
    kubeadmTokenCAHash: hash
    controlPlane: false
    certKey: key
    cisCompliance: false
    clusterName: kubernetes
  docker:
    version: latest
    bypassStorageDriverWarnings: false
    hardFailOnLoopback: false
    noCEOnEE: false
    dockerRegistryIP: 192.168.0.1
    additionalNoProxy: 129.168.0.2
    noDocker: false
  weave:
    version: latest
    encryptNetwork: true
    podCidrRange: /12
    podCIDR: 39.1.2.3
  flannel:
    version: latest
    podCIDRRange: /16
    podCIDR: 172.19.0.0/16
  antrea:
    version: latest
    isEncryptionDisabled: true
    podCidrRange: /16
    podCIDR: 172.19.0.0/16
  contour:
    version: latest
    tlsMinimumProtocolVersion: "1.3"
    httpPort: 3080
    httpsPort: 3443
  rook:
    version: latest
    storageClassName: default
    cephReplicaCount: 1
    isBlockStorageEnabled: true
    blockDeviceFilter: sd[a-z]
    bypassUpgradeWarning: true
    hostpathRequiresPrivileged: true
  openebs:
    version: 2.6.0
    namespace: openebs
    isLocalPVEnabled: true
    localPVStorageClassName: default
    isCstorEnabled: true
    cstorStorageClassName: cstor
  minio:
    version: latest
    namespace: minio
    hostPath: /sentry
  registry:
    version: latest
    publishPort: 20
  prometheus:
    version: 0.53.1-30.1.0
  fluentd:
    version: latest
    fullEFKStack: false
  kotsadm:
    version: latest
    uiBindPort: 8800
    hostname: 1.1.1.1
    applicationSlug: sentry
    applicationNamespace: kots
    applicationVersionLabel: 0.1.0
  velero:
    version: latest
    namespace: velero
    disableCLI: false
    disableRestic: false
    localBucket: local
    resticRequiresPrivileged: false
    resticTimeout: 12h
  ekco:
    version: latest
    nodeUnreachableToleration: 10m
    minReadyMasterNodeCount: 3
    minReadyWorkerNodeCount: 1
    shouldDisableRebootService: false
    shouldDisableClearNodes: false
    shouldEnablePurgeNodes: false
    rookShouldUseAllNodes: false
    rookShouldDisableReconcileMDSPlacement: false
    rookShouldDisableReconcileCephCSIResources: false
    enableInternalLoadBalancer: true
    shouldDisableRestartFailedEnvoyPods: false
    envoyPodsNotReadyDuration: "5m"
  kurl:
    additionalNoProxyAddresses:
    - 10.128.0.3
    airgap: false
    excludeBuiltinHostPreflights: false
    hostnameCheck: 2.2.2.2
    hostPreflightIgnore: true
    hostPreflightEnforceWarnings: true
    ignoreRemoteLoadImagesPrompt: false
    ignoreRemoteUpgradePrompt: false
    ipv6: false
    licenseURL: https://www.sec.gov/Archives/edgar/data/1029786/00011931250557724/dex104.htm
    nameserver: 8.8.8.8
    noProxy: false
    privateAddress: 10.38.1.1
    proxyAddress: 1.1.1.1
    publicAddress: 101.38.1.1
    skipSystemPackageInstall: false
    bypassFirewalldWarning: false
    hardFailOnFirewalld: false
  collectd:
    version: 0.0.1
  certManager:
    version: 1.0.3
  metricsServer:
    version: 0.3.7
  helm:
    helmfileSpec: |
      repositories:
      - name: nginx-stable
        url: https://helm.nginx.com/stable
      releases:
      - name: test-nginx-ingress
        chart: nginx-stable/nginx-ingress
        values:
        - controller:
            service:
              type: NodePort
              httpPort:
                nodePort: 30080
              httpsPort:
                nodePort: 30443
    additionalImages:
    - postgres
  longhorn:
    storageOverProvisioningPercentage: 200
    uiBindPort: 30880
    uiReplicaCount: 0
    version: 1.1.0
  sonobuoy:
    version: 0.50.0
  aws:
    version: 1.0.1
    excludeStorageClass: true
`;

const allLatest = `apiVersion: kurl.sh/v1beta1
metadata:
  name: allLatest
spec:
  kubernetes:
    version: latest
  docker:
    version: latest
  weave:
    version: latest
  antrea:
    version: latest
  contour:
    version: latest
  rook:
    version: latest
  openebs:
    version: latest
  minio:
    version: latest
  registry:
    version: latest
  prometheus:
    version: latest
  fluentd:
    version: latest
  kotsadm:
    version: latest
  velero:
    version: latest
  ekco:
    version: latest
  collectd:
    version: latest
  certManager:
    version: latest
  metricsServer:
    version: latest
  longhorn:
    version: latest
  sonobuoy:
    version: latest
  aws:
    version: latest
`;

// Used for validation in all options test case
const helmfileSpec = `repositories:
- name: nginx-stable
  url: https://helm.nginx.com/stable
releases:
- name: test-nginx-ingress
  chart: nginx-stable/nginx-ingress
  values:
  - controller:
      service:
        type: NodePort
        httpPort:
          nodePort: 30080
        httpsPort:
          nodePort: 30443
`


const typeMetaStableV1Beta1 = `
apiVersion: kurl.sh/v1beta1
kind: Installer
metadata:
  name: stable
spec:
  kubernetes:
    version: 1.19.9
  weave:
    version: 2.5.2
  rook:
    version: 1.0.4
  contour:
    version: 0.14.0
  registry:
    version: 2.7.1
  prometheus:
    version: 0.33.0
`;

const stable = `
metadata:
  name: stable
spec:
  kubernetes:
    version: 1.19.9
  weave:
    version: 2.5.2
  rook:
    version: 1.0.4
  contour:
    version: 0.14.0
  registry:
    version: 2.7.1
  prometheus:
    version: 0.33.0
`;

const noName = `
spec:
  kubernetes:
    version: 1.19.9
  weave:
    version: 2.5.2
  rook:
    version: 1.0.4
  contour:
    version: 0.14.0
  registry:
    version: 2.7.1
  prometheus:
    version: 0.33.0
`;

const disordered = `
spec:
  contour:
    version: 0.14.0
  weave:
    version: 2.5.2
  prometheus:
    version: 0.33.0
  kubernetes:
    version: 1.19.9
  registry:
    version: 2.7.1
  rook:
    version: 1.0.4
`;

const k8s14 = `
spec:
  kubernetes:
    version: 1.14.5
  weave:
    version: 2.5.2
  rook:
    version: 1.0.4
  contour:
    version: 0.14.0
  registry:
    version: 2.7.1
  prometheus:
    version: 0.33.0
`;

const min = `
spec:
  kubernetes:
    version: 1.19.9
`;

const empty = "";

const kots = `
spec:
  kubernetes:
    version: latest
  kotsadm:
    version: 0.9.9
    applicationSlug: sentry-enterprise
`;

const kotsNoVersion = `
spec:
  kubernetes:
    version: latest
  kotsadm:
    applicationSlug: sentry-enterprise
`;

const velero = `
spec:
  velero:
    version: latest
    namespace: not-velero
    installCLI: false
    useRestic: false
`;

const veleroMin = `
spec:
  velero:
    version: latest
`;

const veleroDefaults = `
spec:
  velero:
    version: latest
    namespace: velero
`;

const fluentd = `
spec:
  fluentd:
    version: latest
    fullEFKStack: true
`;

const fluentdMin = `
spec:
  fluentd:
    version: latest
`;

const ekco = `
spec:
  ekco:
    version: latest
    nodeUnreachableToleration: 10m
    minReadyMasterNodeCount: 3
    minReadyWorkerNodeCount: 1
    shouldDisableRebootService: false
    shouldDisableClearNodes: false
    shouldEnablePurgeNodes: false
    rookShouldUseAllNodes: false
    rookShouldDisableReconcileMDSPlacement: false
    rookShouldDisableReconcileCephCSIResources: false
    shouldDisableRestartFailedEnvoyPods: false
    envoyPodsNotReadyDuration: "5m"
`;

const ekcoMin = `
spec:
  ekco:
    version: latest
`;

const contour = `
spec:
  contour:
    version: latest
    tlsMinimumProtocolVersion: "1.3"
    httpPort: 3080
    httpsPort: 3443
`;

const minio = `
spec:
  minio:
    version: latest
    namespace: minio
    hostPath: /sentry
`;

const openebs = `
spec:
  openebs:
    version: latest
    isLocalPVEnabled: true
    localPVStorageClassName: default
    isCstorEnabled: true
    cstorStorageClassName: cstor
`;

const longhorn = `
spec:
  longhorn:
    s3Override: https://dummy.s3.us-east-1.amazonaws.com/pr/longhorn-1.1.0.tar.gz
    uiBindPort: 30880
    uiReplicaCount: 0
    version: latest
`;

const overrideUnknownVersion = `
spec:
  kubernetes:
    version: latest
  contour:
    version: 100.0.0
    tlsMinimumProtocolVersion: "1.3"
    s3Override: https://dummy.s3.us-east-1.amazonaws.com/pr/contour-100.0.0.tar.gz
`;

const overrideKnownVersion = `
spec:
  contour:
    version: latest
    tlsMinimumProtocolVersion: "1.3"
    httpPort: 3080
    httpsPort: 3443
    s3Override: https://dummy.s3.us-east-1.amazonaws.com/pr/contour-100.0.0.tar.gz
`;

const conformance = `
spec:
  kubernetes:
    version: 1.17.7
  sonobuoy:
    version: 0.50.0
`;

const noConformance = `
spec:
  kubernetes:
    version: 1.16.4
  sonobuoy:
    version: 0.50.0
`;

const kurlInstallerVersion = `
spec:
  kubernetes:
    version: 1.19.7
  kurl:
    installerVersion: v2022.03.04-1
`;

const kotsExternal = `
spec:
  kubernetes:
    version: 1.25.0
  kotsadm:
    version: 1.85.0
`;

describe("Installer", () => {
  describe("parse", () => {
    it("parses yaml with type meta and name", () => {
      const i = Installer.parse(typeMetaStableV1Beta1);
      expect(i).to.have.property("id", "stable");
      expect(i.spec.kubernetes).to.have.property("version", "1.19.9");
      expect(i.spec.weave).to.have.property("version", "2.5.2");
      expect(i.spec.rook).to.have.property("version", "1.0.4");
      expect(i.spec.contour).to.have.property("version", "0.14.0");
      expect(i.spec.registry).to.have.property("version", "2.7.1");
      expect(i.spec.prometheus).to.have.property("version", "0.33.0");
    });

    it("parses yaml with name and no type meta", () => {
      const i = Installer.parse(stable);
      expect(i).to.have.property("id", "stable");
      expect(i.spec.kubernetes).to.have.property("version", "1.19.9");
      expect(i.spec.weave).to.have.property("version", "2.5.2");
      expect(i.spec.rook).to.have.property("version", "1.0.4");
      expect(i.spec.contour).to.have.property("version", "0.14.0");
      expect(i.spec.registry).to.have.property("version", "2.7.1");
      expect(i.spec.prometheus).to.have.property("version", "0.33.0");
    });

    it("parses yaml with only a spec", () => {
      const i = Installer.parse(noName);
      expect(i).to.have.property("id", "");
      expect(i.spec.kubernetes).to.have.property("version", "1.19.9");
      expect(i.spec.weave).to.have.property("version", "2.5.2");
      expect(i.spec.rook).to.have.property("version", "1.0.4");
      expect(i.spec.contour).to.have.property("version", "0.14.0");
      expect(i.spec.registry).to.have.property("version", "2.7.1");
      expect(i.spec.prometheus).to.have.property("version", "0.33.0");
    });

    it("parses yaml spec in different order", () => {
      const i = Installer.parse(disordered);
      expect(i).to.have.property("id", "");
      expect(i.spec.kubernetes).to.have.property("version", "1.19.9");
      expect(i.spec.weave).to.have.property("version", "2.5.2");
      expect(i.spec.rook).to.have.property("version", "1.0.4");
      expect(i.spec.contour).to.have.property("version", "0.14.0");
      expect(i.spec.registry).to.have.property("version", "2.7.1");
      expect(i.spec.prometheus).to.have.property("version", "0.33.0");
    });

    it("parses yaml spec with empty versions", () => {
      const i = Installer.parse(min);
      expect(i).to.have.property("id", "");
      expect(i.spec.kubernetes).to.have.property("version", "1.19.9");
      expect(i.spec).not.to.have.property("weave");
      expect(i.spec).not.to.have.property("rook");
      expect(i.spec).not.to.have.property("contour");
      expect(i.spec).not.to.have.property("registry");
      expect(i.spec).not.to.have.property("kotsadm");
      expect(i.spec).not.to.have.property("docker");
      expect(i.spec).not.to.have.property("prometheus");
      expect(i.spec).not.to.have.property("velero");
      expect(i.spec).not.to.have.property("fluentd");
    });

    it("parses yaml spec with override s3 urls and unknown versions", () => {
      const i = Installer.parse(overrideUnknownVersion);
      expect(i).to.have.property("id", "");
      expect(i.spec.contour).to.have.property("version", "100.0.0");
      expect(i.spec.contour).to.have.property("s3Override", "https://dummy.s3.us-east-1.amazonaws.com/pr/contour-100.0.0.tar.gz");
    });
  });

  describe("hash", () => {
    it("hashes same specs to the same string", () => {
      const a = Installer.parse(typeMetaStableV1Beta1).hash();
      const b = Installer.parse(stable).hash();
      const c = Installer.parse(noName).hash();
      const d = Installer.parse(disordered).hash();

      expect(a).to.equal(b);
      expect(a).to.equal(c);
      expect(a).to.equal(d);
    });

    it("hashes different specs to different strings", () => {
      const a = Installer.parse(typeMetaStableV1Beta1).hash();
      const b = Installer.parse(k8s14).hash();

      expect(a).not.to.equal(b);
    });

    it("hashes to a 7 character hex string", () => {
      const a = Installer.parse(typeMetaStableV1Beta1).hash();
      const b = Installer.parse(k8s14).hash();

      expect(a).to.match(/[0-9a-f]{7}/);
      expect(b).to.match(/[0-9a-f]{7}/);
    });

    it("hashes old versions to equivalent migrated version", () => {
      const parsedV1Beta1 = Installer.parse(typeMetaStableV1Beta1);
    });

    it("hashes specs with override to different strings", () => {
      const a = Installer.parse(contour).hash();
      const b = Installer.parse(overrideKnownVersion).hash();

      expect(a).not.to.equal(b);
    });

    it("hashes specs with helmfile values differently", () => {
      const helm1 = `spec:
  kubernetes:
    version: latest
  helm:
    helmfileSpec: |
      repositories
      - name: nginx
        repo: nginx.com`;

      const helm2 = `spec:
  kubernetes:
    version: latest
  helm:
    helmfileSpec: |
      repositories
      - name: postgres
        repo: postgres.com`;

      const a = Installer.parse(helm1).hash();
      const b = Installer.parse(helm2).hash();

      expect(a).not.to.equal(b);
    });

    it("hashes specs with kurl.hostPreflights values differently", () => {
      const spec1 = `spec:
  kubernetes:
    version: latest
  kurl:
    hostPreflights:
      one: two`;

      const spec2 = `spec:
  kubernetes:
    version: latest
  kurl:
    hostPreflights:
      three: four`;

      const a = Installer.parse(spec1).hash();
      const b = Installer.parse(spec2).hash();

      expect(a).not.to.equal(b);
    });
  });

  describe("toYAML", () => {
    describe("v1beta1", () => {
      it("leaves missing names empty", () => {
        const parsed = Installer.parse(noName);
        const yaml = parsed.toYAML();

        expect(yaml).to.equal(`apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: ''
spec:
  kubernetes:
    version: 1.19.9
  weave:
    version: 2.5.2
  rook:
    version: 1.0.4
  contour:
    version: 0.14.0
  registry:
    version: 2.7.1
  prometheus:
    version: 0.33.0
`);
      });

      it("renders empty yaml", () => {
        const parsed = Installer.parse(empty);
        const yaml = parsed.toYAML();

        expect(yaml).to.equal(`apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: ''
spec: {}
`);
      });

      it("preserves kurl addon installerVersion", () => {
        const parsed = Installer.parse(kurlInstallerVersion);
        const yaml = parsed.toYAML();

        expect(yaml).to.equal(`apiVersion: cluster.kurl.sh/v1beta1
kind: Installer
metadata:
  name: ''
spec:
  kubernetes:
    version: 1.19.7
  kurl:
    installerVersion: v2022.03.04-1
`);
      });
    });
  });

  describe("Installer.isSHA", () => {
    [
      { id: "d3a9234", answer: true },
      { id: "6898644", answer: true },
      { id: "0000000", answer: true},
      { id: "abcdefa", answer: true},
      { id: "68986440", answer: false },
      { id: "d3a923", answer: false },
      { id: "latest", answer: false },
      { id: "f3a9g34", answer: false },
      { id: "replicated-beta", answer: false },
      { id: "replicated d3a9234", answer: false },
    ].forEach((test) => {
      it(`${test.id} => ${test.answer}`, () => {
        const output = Installer.isSHA(test.id);

        expect(output).to.equal(test.answer);
      });
    });
  });

  describe("Installer.isValidCidrRange", () => {
    [
      { cidrRange: "/12", answer: true },
      { cidrRange: "12", answer: true},
      { cidrRange: " ", answer: false},
      { cidrRange: "abc", answer: false},
    ].forEach((test) => {
      it(`"${test.cidrRange}" => ${test.answer}`, () => {
        const output = Installer.isValidCidrRange(test.cidrRange);

        expect(output).to.equal(test.answer);
      });
    });
  });

  describe("Installer.toDotXVersion", () => {
    [
      { version: "1.21.5", answer: "1.21.x" },
      { version: "2020-01-25T02-50-51Z", answer: "2020-01-25T02-50-51Z"},
    ].forEach((test) => {
      it(`"${test.version}" => ${test.answer}`, () => {
        const output = Installer.toDotXVersion(test.version);

        expect(output).to.equal(test.answer);
      });
    });
  });

  describe("validate", () => {
    describe("valid", () => {
      it("=> void", () => {
        [
          typeMetaStableV1Beta1,
        ].forEach(async (yaml) => {
          const out = Installer.parse(yaml).validate(installerVersions);

          expect(out).to.equal(undefined);
        });
      });

      describe("application slug exists", () => {
        it("=> void", async () => {
          const out = Installer.parse(kots).validate(installerVersions);

          expect(out).to.equal(undefined);
        });
      });

      describe("every option", () => {
        it("=> void", async () => {
          const out = Installer.parse(everyOption).validate(installerVersions);

          expect(out).to.equal(undefined);
        });
      });

      describe("unknown versions w/ overrides", () => {
        it("=> void", async () => {
          const out = Installer.parse(overrideUnknownVersion).validate(installerVersions);
          expect(out).to.equal(undefined);
        });
      });
    });

    describe("invalid Kubernetes versions", () => {
      it("=> ErrorResponse", async () => {
        const noK8s = `
spec:
  kubernetes:
    version: ""
`;
        const noK8sOut = Installer.parse(noK8s).validate(installerVersions);
        expect(noK8sOut).to.deep.equal({ error: { message: "Kubernetes version is required" } });

        const badK8s = `
spec:
  kubernetes:
    version: "0.15.3"
`;
        const badK8sOut = Installer.parse(badK8s).validate(installerVersions);
        expect(badK8sOut).to.deep.equal({ error: { message: `Kubernetes version "0.15.3" is not supported` } });
      });
    });

    describe("invalid Prometheus version", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: latest
  prometheus:
    version: 0.32.0
`;
        const out = Installer.parse(yaml).validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: `Prometheus version "0.32.0" is not supported` } });
      });
    });

    describe("kots version missing", () => {
      it("=> ErrorResponse", async () => {
        const out = Installer.parse(kotsNoVersion).validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "spec/kotsadm must have required property 'version'" }});
      });
    });

    describe("docker version is a boolean", async () => {
      const yaml = `
spec:
  kubernetes:
    version: latest
  docker:
    version: true`;
      const i = Installer.parse(yaml);
      const out = i.validate(installerVersions);

      expect(out).to.deep.equal({ error: { message: "spec.docker.version should be string" } });
    });

    describe("invalid podCidrRange", async () => {
      const yaml = `
spec:
  kubernetes:
    version: latest
  weave:
    version: latest
    podCidrRange: abc`;
      const i = Installer.parse(yaml);
      const out = i.validate(installerVersions);

      expect(out).to.deep.equal({ error: { message: "Weave podCidrRange \"abc\" is invalid" } });
    });

    describe("invalid serviceCidrRange", async () => {
      const yaml = `
spec:
  kubernetes:
    version: latest
    serviceCidrRange: abc`;
      const i = Installer.parse(yaml);
      const out = i.validate(installerVersions);

      expect(out).to.deep.equal({ error: { message: "Kubernetes serviceCidrRange \"abc\" is invalid" } });
    });

    describe("extra options", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: latest
    seLinux: true`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "spec/kubernetes must NOT have additional properties" } });
      });
    });

    describe("unsupported Prometheus servicetype", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.23.3
  prometheus:
    version: 0.53.1-30.1.0
    serviceType: thisisatest`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Supported Prometheus service types are \"NodePort\" and \"ClusterIP\", not \"thisisatest\"" } });
      });
    });

    describe("unsupported Prometheus version + servicetype combination", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.21.9
  prometheus:
    version: 0.47.0-15.3.1
    serviceType: ClusterIP`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Prometheus service types are supported for version \"0.48.1-16.10.0\" and later, not \"0.47.0-15.3.1\"" } });
      });
    });

    describe("supported Prometheus version + servicetype combination", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.21.9
  prometheus:
    version: 0.48.1-16.10.0
    serviceType: ClusterIP`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal(undefined);
      });
    });

    describe("Prometheus version that is incompatible with k8s 1.23", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.23.3
  prometheus:
    version: 0.47.0-15.3.1`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Prometheus versions less than or equal to 0.49.0-17.1.3 are not compatible with Kubernetes 1.22+" } });
      });
    });

    describe("Prometheus version that is incompatible with k8s 1.25", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.25.0
  prometheus:
    version: 0.58.0-39.12.1`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Prometheus versions less than or equal to 0.59.0 are not compatible with Kubernetes 1.25+" } });
      });
    });

    describe("Rook version that is incompatible with k8s 1.25", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.25.0
  rook:
    version: 1.7.11`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Rook versions less than or equal to 1.9.10 are not compatible with Kubernetes 1.25+" } });
      });
    });

    describe("Longhorn version that is incompatible with k8s 1.25", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.25.0
  longhorn:
    version: 1.3.1`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Longhorn versions less than or equal to 1.4.0 are not compatible with Kubernetes 1.25+" } });
      });
    });

  describe("supported kubeadm + openebs spec", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.21.11
  openebs:
    version: 1.12.0
    isLocalPVEnabled: true
    localPVStorageClassName: default
    isCstorEnabled: false`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal(undefined);
      });
    });

  describe("openebs version that is incompatible with k8s version", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.22.8
  openebs:
    version: 1.12.0
    isLocalPVEnabled: true
    localPVStorageClassName: default
    isCstorEnabled: false`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Openebs version \"1.12.0\" is not compatible with Kubernetes versions 1.22+" } });
      });
    });

    describe("newest openebs version that is once again compatible with k8s version", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.22.8
  openebs:
    version: 2.12.9
    isLocalPVEnabled: true
    localPVStorageClassName: default
    isCstorEnabled: false`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal(undefined);
      });
    });

    describe("openebs version that is incompatible with cstor", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.21.8
  openebs:
    version: 2.12.9
    isCstorEnabled: true
    cstorStorageClassName: "abcd"`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Openebs version \"2.12.9\" does not support cstor in kURL" } });
      });
    });

  describe("docker is not supported with k8s version 1.24.0", () => {
      it("=> ErrorResponse", async () => {
        const yaml = `
spec:
  kubernetes:
    version: 1.24.0
  docker:
    version: 20.10.5`;
        const i = Installer.parse(yaml);
        const out = i.validate(installerVersions);

        expect(out).to.deep.equal({ error: { message: "Docker is not supported with Kubernetes versions 1.24+, please choose Containerd" } });
      });
    });
  });

  describe("hasS3Override", () => {
    it(`hasS3Override false for k8s in stable spec`, () => {
      const i = Installer.parse(stable);
      expect(i.hasS3Override("kubernetes")).to.be.false;
    });

    it(`hasS3Override true for contour with s3 override set`, () => {
      const i = Installer.parse(overrideUnknownVersion);
      expect(i.hasS3Override("contour")).to.be.true;
    });
  });

  describe("flags", () => {
    describe("every option", () => {
      it(`=> service-cidr-range=/12 ...`, () => {
        const i = Installer.parse(everyOption);
        expect(i.flags()).to.equal(`service-cidr-range=/12 service-cidr=100.1.1.1/12 ha=0 kuberenetes-master-address=192.168.1.1 kubernetes-cluster-name=kubernetes load-balancer-address=10.128.10.1 kubernetes-load-balancer-use-first-primary=1 container-log-max-size=256Ki container-log-max-files=4 bootstrap-token=token bootstrap-token-ttl=10min kubeadm-token-ca-hash=hash control-plane=0 cert-key=key kubernetes-cis-compliance=0 bypass-storagedriver-warnings=0 hard-fail-on-loopback=0 no-ce-on-ee=0 docker-registry-ip=192.168.0.1 additional-no-proxy=129.168.0.2 no-docker=0 pod-cidr=39.1.2.3 pod-cidr-range=/12 disable-weave-encryption=0 storage-class-name=default ceph-replica-count=1 rook-block-storage-enabled=1 rook-block-device-filter=sd[a-z] rook-bypass-upgrade-warning=1 rook-hostpath-requires-privileged=1 openebs-namespace=openebs openebs-localpv-enabled=1 openebs-localpv-storage-class-name=default openebs-cstor-enabled=1 openebs-cstor-storage-class-name=cstor minio-namespace=minio minio-hostpath=/sentry contour-tls-minimum-protocol-version=1.3 contour-http-port=3080 contour-https-port=3443 registry-publish-port=20 fluentd-full-efk-stack=0 kotsadm-ui-bind-port=8800 kotsadm-hostname=1.1.1.1 app-slug=sentry app-namespace=kots app-version-label=0.1.0 velero-namespace=velero velero-disable-cli=0 velero-disable-restic=0 velero-local-bucket=local velero-restic-requires-privileged=0 velero-restic-timeout=12h ekco-node-unreachable-toleration-duration=10m ekco-min-ready-master-node-count=3 ekco-min-ready-worker-node-count=1 ekco-should-disable-reboot-service=0 ekco-rook-should-use-all-nodes=0 ekco-rook-should-disable-reconcile-mds-placement=0 ekco-rook-should-disable-reconcile-ceph-csi-resources=0 ekco-enable-internal-load-balancer=1 ekco-should-disable-restart-failed-envoy-pods=0 ekco-envoy-pods-not-ready-duration=5m airgap=0 exclude-builtin-host-preflights=0 hostname-check=2.2.2.2 host-preflight-ignore=1 host-preflight-enforce-warnings=1 ignore-remote-load-images-prompt=0 ignore-remote-upgrade-prompt=0 no-proxy=0 private-address=10.38.1.1 http-proxy=1.1.1.1 public-address=101.38.1.1 skip-system-package-install=0 bypass-firewalld-warning=0 hard-fail-on-firewalld=0 helmfile-spec=repositories:\n- name: nginx-stable\n  url: https://helm.nginx.com/stable\nreleases:\n- name: test-nginx-ingress\n  chart: nginx-stable/nginx-ingress\n  values:\n  - controller:\n      service:\n        type: NodePort\n        httpPort:\n          nodePort: 30080\n        httpsPort:\n          nodePort: 30443\n longhorn-storage-over-provisioning-percentage=200 longhorn-ui-bind-port=30880 longhorn-ui-replica-count=0 aws-exclude-storage-class=1`);
      });
    });
  });

  describe("velero", () => {
    it("should parse", () => {
      const i = Installer.parse(velero);

      expect(i.spec.velero).to.deep.equal({
        version: "latest",
        namespace: "not-velero",
        installCLI: false,
        useRestic: false,
      });
    });
  });

  describe("velero minimum spec flags", () => {
    it("should not generate any flags", () => {
      const i = Installer.parse(veleroMin);

      expect(i.flags()).to.equal(``);
    });
  });

  describe("velero defaults", () => {
    it("should generate only the velero-namespace flag", () => {
      const i = Installer.parse(veleroDefaults);

      expect(i.flags()).to.equal(`velero-namespace=velero`);
    });
  });

  describe("fluentd", () => {
    it("should parse", () => {
      const i = Installer.parse(fluentd);

      expect(i.spec.fluentd).to.deep.equal({
        version: "latest",
        fullEFKStack: true,
      });
    });
  });

  describe("fluentd minimum spec flags", () => {
    it("should not generate any flags", () => {
      const i = Installer.parse(fluentdMin);

      expect(i.flags()).to.equal(``);
    });
  });

  describe("openebs", () => {
    it("should parse", () => {
      const i = Installer.parse(everyOption);

      expect(i.spec.openebs?.namespace).to.equal("openebs");
    });
  });

  describe("ekco", () => {
    it("should parse", () => {
      const i = Installer.parse(ekco);

      expect(i.spec.ekco).to.deep.equal({
        version: "latest",
        nodeUnreachableToleration: "10m",
        minReadyMasterNodeCount: 3,
        minReadyWorkerNodeCount: 1,
        shouldDisableRebootService: false,
        shouldDisableClearNodes: false,
        shouldEnablePurgeNodes: false,
        rookShouldUseAllNodes: false,
        rookShouldDisableReconcileMDSPlacement: false,
        rookShouldDisableReconcileCephCSIResources: false,
        shouldDisableRestartFailedEnvoyPods: false,
        envoyPodsNotReadyDuration: "5m",
      });
        expect(i.flags()).to.equal("ekco-node-unreachable-toleration-duration=10m ekco-min-ready-master-node-count=3 ekco-min-ready-worker-node-count=1 ekco-should-disable-reboot-service=0 ekco-rook-should-use-all-nodes=0 ekco-rook-should-disable-reconcile-mds-placement=0 ekco-rook-should-disable-reconcile-ceph-csi-resources=0 ekco-should-disable-restart-failed-envoy-pods=0 ekco-envoy-pods-not-ready-duration=5m")
    });
  });

  describe("latest", () => {
    it("should resolve all latest versions", async () => {
      const i = Installer.parse(allLatest).resolve(installerVersions, {});

      _.each(_.keys(i.spec), (config: string) => {
        if (i.spec[config].version) {
          expect(i.spec[config].version).not.to.equal("latest", `expected ${config}.version to not equal 'latest'`);
        }
      });
    });
  });

  describe("flannel", () => {
    it("should parse", async () => {
      const i = Installer.parse(everyOption).resolve(installerVersions, {});

      expect(i.spec.flannel).to.deep.equal({
        version: "0.20.0",
        podCIDR: "172.19.0.0/16",
        podCIDRRange: "/16",
      });
    });
  });

  describe("antrea", () => {
    it("should parse", async () => {
      const i = Installer.parse(everyOption).resolve(installerVersions, {});

      expect(i.spec.antrea).to.deep.equal({
        version: "1.4.0",
        isEncryptionDisabled: true,
        podCIDR: "172.19.0.0/16",
        podCidrRange: "/16",
      });
    });
  });

  describe("contour", () => {
    it("should parse", () => {
      const i = Installer.parse(contour);

      expect(i.spec.contour).to.deep.equal({
        version: "latest",
        tlsMinimumProtocolVersion: "1.3",
        httpPort: 3080,
        httpsPort: 3443,
      });
      
      expect(i.flags()).to.equal("contour-tls-minimum-protocol-version=1.3 contour-http-port=3080 contour-https-port=3443")
    });
  });

  describe("minio", () => {
    it("should parse", () => {
      const i = Installer.parse(minio);

      expect(i.spec.minio).to.deep.equal({
        version: "latest",
        namespace: "minio",
        hostPath: "/sentry",
      });
      
      expect(i.flags()).to.equal("minio-namespace=minio minio-hostpath=/sentry")
    });
  });

  describe("ekco minimum spec flags", () => {
    it("should not generate any flags", () => {
      const i = Installer.parse(ekcoMin);

      expect(i.flags()).to.equal(``);
    });
  });

  describe("openebs", () => {
    it("should parse", () => {
      const i = Installer.parse(openebs);

      expect(i.spec.openebs).to.deep.equal({
        version: "latest",
        isLocalPVEnabled: true,
        localPVStorageClassName: "default",
        isCstorEnabled: true,
        cstorStorageClassName: "cstor",
      });
    });
  });

  describe("longhorn", () => {
    it("should parse", async () => {
      const i = Installer.parse(longhorn);
      const pkgs = i.packages(installerVersions, "");

      const hasHostLonghorn = _.some(pkgs, (pkg) => {
        return pkg === "host-longhorn";
      });
      expect(hasHostLonghorn).to.equal(true);

      expect(i.spec.longhorn).to.deep.equal({
        s3Override: "https://dummy.s3.us-east-1.amazonaws.com/pr/longhorn-1.1.0.tar.gz",
        uiBindPort: 30880,
        uiReplicaCount: 0,
        version: "latest",
      });
    });
  });

  describe("latestMinors", () => {
    it("should include latest version indexed by minor", () => {
      const out = Installer.latestMinors([
          "1.18.20",
          "1.18.19",
          "1.18.18",
          "1.18.17",
          "1.18.10",
          "1.18.9",
          "1.18.4",
          "1.17.13",
          "1.17.7",
          "1.17.3",
          "1.16.4",
        ], "kubernetes");

      expect(out[0]).to.equal("0.0.0");
      expect(out[14]).to.equal("0.0.0");
      expect(out[15]).to.equal("0.0.0");
      expect(out[16]).to.equal("1.16.4");
      expect(out[17]).to.equal("1.17.13");
      expect(out[18]).to.equal("1.18.20");
    });

    it("should replace rook version", () => {
      const out = Installer.latestMinors([
          '1.0.4',
          '1.7.11',
          '1.6.11',
          '1.5.12',
          '1.5.11',
          '1.5.10',
          '1.5.9',
          '1.4.9',
          '1.4.3',
          '1.0.4-14.2.21'
        ], "rook");

      expect(out[0]).to.equal("1.0.4-14.2.21");
      expect(out[1]).to.equal("0.0.0");
      expect(out[3]).to.equal("0.0.0");
      expect(out[4]).to.equal("1.4.9");
    });
  });

  describe("resolveLatestPatchVersion", () => {
    it("should resolve kubernetes version 1.17.x", () => {
      const out = Installer.resolveLatestPatchVersion("1.17.x", [
        "1.18.20",
        "1.18.19",
        "1.18.18",
        "1.18.17",
        "1.18.10",
        "1.18.9",
        "1.18.4",
        "1.17.13",
        "1.17.7",
        "1.17.3",
        "1.16.4",
      ]);
      expect(out).to.equal("1.17.13");
    });

    it("should resolve weird docker versions", () => {
      const out = Installer.resolveLatestPatchVersion("19.03.x", [
        "20.10.17",
        "20.10.5",
        "19.03.15",
        "19.03.10",
        "19.03.4",
        "18.09.8",
      ]);
      expect(out).to.equal("19.03.15");
    });

    it("should fail on non-semver minio version", () => {
      const bad = function (): string {
        return Installer.resolveLatestPatchVersion("1.1.x", [
          "2022-08-22T23-53-06Z",
          "2022-08-02T23-59-16Z",
          "2022-07-17T15-43-14Z",
          "2022-07-06T20-29-49Z",
          "2022-06-11T19-55-32Z",
          "2020-01-25T02-50-51Z",
        ]);
      };
      expect(bad).to.throw("latest patch version not found for 1.1.x");
    });

    it("should throw an error when the version doesnt exist", () => {
      const bad = function (): string {
        return Installer.resolveLatestPatchVersion("1.123.x", [
          "1.18.20",
          "1.18.19",
          "1.18.18",
          "1.18.17",
          "1.18.10",
          "1.18.9",
          "1.18.4",
          "1.17.13",
          "1.17.7",
          "1.17.3",
          "1.16.4",
        ]);
      };
      expect(bad).to.throw("latest patch version not found for 1.123.x");
    });

    it("should not fail on kotsadm alpha version", () => {
      const out = Installer.resolveLatestPatchVersion("1.43.x", [
        "1.43.2",
        "1.43.1",
        "1.43.0",
        "1.42.1",
        "1.42.0",
        "1.41.1",
        "1.41.0",
        "1.40.0",
        "alpha",
        "nightly",
      ]);
      expect(out).to.equal("1.43.2");
    });

    it("should resolve latest weave patch version", () => {
      const out = Installer.resolveLatestPatchVersion("2.8.x", Installer.replaceAddonVersions("weave", [
        "2.6.5-20220825",
        "2.6.5-20220720",
        "2.6.5-20220616",
        "2.6.5",
        "2.6.4",
        "2.5.2",
        "2.8.1-20220825",
        "2.8.1-20220720",
        "2.8.1-20220616",
        "2.8.1",
        "2.7.0",
      ]));
      expect(out).to.match(/2.8.1-\d{8}/);
    });
  });

  describe("collectd", () => {
    it("should parse", () => {
      const i = Installer.parse(everyOption);

      expect(i.spec.collectd?.version).to.equal("v5");
    });
  });

  describe("certManager", () => {
    it("should parse the version", () => {
      const i = Installer.parse(everyOption);

      expect(i.spec.certManager?.version).to.equal("1.0.3");
    });
  });

  describe("metricsServer", () => {
    it("should parse the version", () => {
      const i = Installer.parse(everyOption);

      expect(i.spec.metricsServer?.version).to.equal("0.3.7");
    });
  });

  describe("helm", () => {
    it("should require helmfile", async () => {
      const yaml = `
spec:
  kubernetes:
    version: latest
  helm:
    additionalImages:
    - postgres`;
      const i = Installer.parse(yaml);
      const out = i.validate(installerVersions);

      expect(out).to.deep.equal({ error: { message: "spec/helm must have required property 'helmfileSpec'" } });
    });
  });

  describe("packages", () => {

    it("should convert camel case to kebab case", async () => {
      const i = Installer.parse(everyOption).resolve(installerVersions, {});
      const pkgs = i.packages(installerVersions, "");

      const hasCertManager = _.some(pkgs, (pkg) => {
        return _.startsWith(pkg, "cert-manager");
      });
      const hasMetricsServer = _.some(pkgs, (pkg) => {
        return _.startsWith(pkg, "metrics-server");
      });

      expect(hasCertManager).to.equal(true);
      expect(hasMetricsServer).to.equal(true);
    });

    it("should include defaults", async () => {
      const i = Installer.parse(min);
      const pkgs = i.packages(installerVersions, "");

      const hasCommon = _.some(pkgs, (pkg) => {
        return pkg === "common";
      });
      expect(hasCommon).to.equal(true);

      const hasOpenssl = _.some(pkgs, (pkg) => {
        return pkg === "host-openssl";
      });
      expect(hasOpenssl).to.equal(true);

      const hasHostLonghorn = _.some(pkgs, (pkg) => {
        return pkg === "host-longhorn";
      });
      expect(hasHostLonghorn).to.equal(false);

      const hasKurlBinUtils = _.some(pkgs, (pkg) => {
        return pkg === "kurl-bin-utils-latest";
      });
      expect(hasKurlBinUtils).to.equal(true);
    });

    it("should include a versioned kurl-bin-utils", async () => {
      const i = Installer.parse(min);
      const pkgs = i.packages(installerVersions, "v2021.05.27-0");

      const hasKurlBinUtils = _.some(pkgs, (pkg) => {
        return pkg === "kurl-bin-utils-v2021.05.27-0";
      });
      expect(hasKurlBinUtils).to.equal(true);
    });

    it("should include kubernetes conformance images", async () => {
      const i = Installer.parse(conformance);
      const pkgs = i.packages(installerVersions, "");

      const hasSonobuoy = _.some(pkgs, (pkg) => {
        return pkg === "sonobuoy-0.50.0";
      });
      expect(hasSonobuoy).to.equal(true);

      const hasKubernetes = _.some(pkgs, (pkg) => {
        return pkg === "kubernetes-1.17.7";
      });
      expect(hasKubernetes).to.equal(true);

      const hasConformance = _.some(pkgs, (pkg) => {
        return pkg === "kubernetes-conformance-1.17.7";
      });
      expect(hasConformance).to.equal(true);
    });

    it("should not include kubernetes conformance images for versions < 1.17", async () => {
      const i = Installer.parse(noConformance);
      const pkgs = i.packages(installerVersions, "");

      const hasSonobuoy = _.some(pkgs, (pkg) => {
        return pkg === "sonobuoy-0.50.0";
      });
      expect(hasSonobuoy).to.equal(true);

      const hasKubernetes = _.some(pkgs, (pkg) => {
        return pkg === "kubernetes-1.16.4";
      });
      expect(hasKubernetes).to.equal(true);

      const hasConformance = _.some(pkgs, (pkg) => {
        return pkg.startsWith("kubernetes-conformance");
      });
      expect(hasConformance).to.equal(false);
    });

    it("should not include removed Kubernetes versions", async () => {
      const i = Installer.parse(noConformance);
      const pkgs = i.packages(installerVersions, "");

      const hasKubernetes16 = _.some(pkgs, (pkg) => {
        return pkg === "kubernetes-1.16.4";
      });
      expect(hasKubernetes16).to.equal(true);

      const hasKubernetes000 = _.some(pkgs, (pkg) => {
        return pkg === "kubernetes-0.0.0";
      });
      expect(hasKubernetes000).to.equal(false);
    });

    it("should resolve external add-on package url", async () => {
      const i = Installer.parse(kotsExternal).resolve(installerVersions, {kotsadm: [{version: "1.84.0"}, {version: "1.85.0"}]});
      const pkgs = i.packages(installerVersions, "");

      const kotsadm = _.find(pkgs, (pkg) => {
        return pkg.includes("/kotsadm-");
      });

      expect(kotsadm).to.equal("https://undefined.s3.amazonaws.com/external/kotsadm-1.85.0.tar.gz");
    });
  });

  describe("kurl.nameserver", () => {
    it("should parse the nameserver", () => {
      const i = Installer.parse(everyOption);

      expect(i.spec.kurl?.nameserver).to.equal("8.8.8.8");
    });
  });
});
