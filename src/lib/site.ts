// Canonical site config. Use these helpers everywhere we generate
// shareable URLs (creator pages, share buttons, OG tags, referral links,
// emails) so links always point at printreon.com regardless of where
// the code is running (preview, sandbox, prod).

export const SITE_NAME = "Printreon";
export const SITE_URL = "https://printreon.com";
export const SITE_DESCRIPTION =
  "Sell STL, 3MF and printable files through monthly memberships. The Patreon alternative purpose-built for 3D printing creators.";

export const PARTNER = {
  name: "MakerMind App",
  url: "https://www.makermindapp.com",
  tagline: "The companion app for makers",
};

export function siteUrl(path = "/"): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${SITE_URL}${path}`;
}

export function creatorUrl(slug: string): string {
  return siteUrl(`/c/${slug}`);
}

export function bundleUrl(creatorSlug: string, bundleSlug: string): string {
  return siteUrl(`/c/${creatorSlug}/bundle/${bundleSlug}`);
}

export function referralUrl(code: string): string {
  return siteUrl(`/r/${code}`);
}

export function blogUrl(slug: string): string {
  return siteUrl(`/blog/${slug}`);
}
