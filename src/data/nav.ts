// One source for the header menus, the phone menu and the footer, so the
// three can never drift apart.
import { AUDIENCES } from "./audiences";

export type Link = { href: string; label: string; note?: string };

export const PRODUCT: Link[] = [
  { href: "/how-it-works", label: "How it works", note: "From a question to an approved change" },
  { href: "/use-cases", label: "Use cases", note: "What teams do with it day to day" },
  { href: "/features", label: "Features", note: "Everything in the beta" },
  { href: "/security", label: "Security", note: "How tokens and changes are protected" },
];

export const WHO: Link[] = AUDIENCES.map((a) => ({ href: `/for/${a.slug}`, label: a.label }));
export const WHO_ALL: Link = { href: "/for", label: "Who it’s for" };

export const MAIN: Link[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/beta", label: "Beta" },
  { href: "/docs", label: "Docs" },
];

export const MORE: Link[] = [
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
];

export const LEGAL: Link[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms of Use" },
];

// Flat list for the footer, same order the site has always shown.
export const FOOTER: Link[] = [
  PRODUCT[0], WHO_ALL, PRODUCT[1], PRODUCT[3], PRODUCT[2],
  { href: "/pricing", label: "Pricing" }, { href: "/beta", label: "The beta" }, { href: "/docs", label: "Docs" },
  ...MORE, ...LEGAL,
];

export const APP_URL = "https://app.zonesteward.com";
