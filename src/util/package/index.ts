import { Installer } from "../../installers";
import { getDefaultKurlVersion } from "./kurl-version";

export function getPackageUrlPrefix(distUrl: string, kurlVersion: string): string {
  return `${distUrl}${kurlVersion && `/${kurlVersion}`}`;
}

export function getPackageUrl(distUrl: string, kurlVersion: string, pkg: string): string {
  return `${getPackageUrlPrefix(distUrl, kurlVersion)}/${pkg}`;
}

export function getDistUrl(): string {
  if (process.env["DIST_URL"]) {
    return process.env["DIST_URL"] as string;
  }
  let distUrl = getBucketUrl();
  if (process.env["NODE_ENV"] === "production") {
    distUrl += "/dist";
  } else {
    distUrl += "/staging";
  }
  return distUrl;
}

export function getExternalUrl(): string {
  return `${getBucketUrl()}/external`;
}

export function getBucketUrl(): string {
  if (process.env["BUCKET_URL"]) {
    return process.env["BUCKET_URL"] as string;
  }
  return `https://${process.env["KURL_BUCKET"]}.s3.amazonaws.com`;
}

export function kurlVersionOrDefault(kurlVersion?: string, i?: Installer): string {
  let iVersion: string | undefined
  if (i && i.spec.kurl) {
    iVersion = i.spec.kurl.installerVersion
  }

  return kurlVersion || iVersion || getDefaultKurlVersion();
}
