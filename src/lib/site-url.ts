import { headers } from "next/headers";

/**
 * Resolves the public base URL of the app. Prefers NEXT_PUBLIC_APP_URL,
 * falls back to the request Host header (dev), then localhost.
 */
export async function getSiteUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  const host = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host");
  if (host) {
    const proto =
      (await headers()).get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "development" ? "http" : "https");
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
