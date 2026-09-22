/* HMAC-SHA256 over "email|decision", hex. Approve/reject links carry it so a
   forwarded or guessed link cannot decide an application. */
async function key(secret) {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sign(secret, email, decision) {
  const sig = await crypto.subtle.sign("HMAC", await key(secret), new TextEncoder().encode(`${email}|${decision}`));
  return hex(sig);
}
export async function verify(secret, email, decision, given) {
  if (!secret || !given || !/^[0-9a-f]{64}$/.test(given)) return false;
  const want = await sign(secret, email, decision);
  // constant-time compare
  let diff = 0;
  for (let i = 0; i < 64; i++) diff |= want.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}
