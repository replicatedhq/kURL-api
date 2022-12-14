import {describe, it} from "mocha";
import {expect} from "chai";
import { KurlClient } from "./";

const kurlURL = process.env.KURL_URL || "http://localhost:30092";
const client = new KurlClient(kurlURL);

const collectd = `
apiVersion: kurl.sh/v1beta1
kind: Installer
metadata:
  name: collectd
spec:
  kubernetes:
    version: 1.17.7
  docker:
    version: 19.03.10
  weave:
    version: 2.7.0
  collectd:
    version: 0.0.1
`;

describe("collectd 0.0.1", () => {
	it("points to v5", async () => {
		const uri = await client.postInstaller(collectd);

		expect(uri).to.match(/c4bae9f/);

		const script = await client.getInstallScript("c4bae9f");

		expect(script).to.match(new RegExp(`collectd:`));
		expect(script).to.match(new RegExp(`version: v5`));
	});
});

const collectdV5 = `
apiVersion: kurl.sh/v1beta1
kind: Installer
metadata:
  name: collectd
spec:
  kubernetes:
    version: 1.17.7
  docker:
    version: 19.03.10
  weave:
    version: 2.7.0
  collectd:
    version: v5
`;

describe("collectd v5", () => {
	it("200", async () => {
		const uri = await client.postInstaller(collectdV5);

		expect(uri).to.match(/c4bae9f/);

		const script = await client.getInstallScript("c4bae9f");

		expect(script).to.match(new RegExp(`collectd:`));
		expect(script).to.match(new RegExp(`version: v5`));
	});
});
