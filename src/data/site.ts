// Public site constants. The Turnstile sitekey is public by design (it is in
// every page's HTML); the secret lives only in the Pages project's secrets.
// Dev builds use Cloudflare's documented always-pass test key so the form can
// be exercised locally without a real challenge.
export const TURNSTILE_SITE_KEY = import.meta.env.DEV ? "1x00000000000000000000AA" : "0x4AAAAAAFDHHHgaIw6D3jwl";
