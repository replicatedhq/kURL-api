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

// if both BUCKET_URL and KURL_BUCKET are set, return the address that KURL_BUCKET alone would have produced
export function getFallbackUrl(): string {
  if (process.env["DIST_URL"]) {
    return ""; // DIST_URL is set, so there is no URL fallback
  }
  if (!process.env["BUCKET_URL"]) {
    return ""; // BUCKET_URL is not set, so there's no point falling back to the same URL
  }
  if (!process.env["KURL_BUCKET"]) {
    return ""; // KURL_BUCKET is not set, so there is no raw s3 url to fallback to
  }

  let distUrl = `https://${process.env["KURL_BUCKET"]}.s3.amazonaws.com`;
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
