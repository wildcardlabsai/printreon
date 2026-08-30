// Dev/testing helpers. The quick-login panel and simulate-subscribe button
// must never appear (or work) on the live domain — the matching server-side
// guard lives in src/functions/dev.functions.ts.

export const LIVE_HOSTS = ["printreon.com", "www.printreon.com", "printreon.lovable.app"];

export function isLiveHost(host: string): boolean {
  return LIVE_HOSTS.includes(host.toLowerCase().split(":")[0]);
}

/** True in preview/sandbox/localhost, false on the published live domain. */
export function devToolsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return !isLiveHost(window.location.hostname);
}
