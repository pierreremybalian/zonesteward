import { onRequest } from '../functions/_middleware.js';
import { onRequestGet } from '../functions/api/globe.js';
import { onRequestPost as betaPost } from '../functions/api/beta.js';

let pass = 0, fail = 0;
const ok = (n, c) => { c ? (pass++, console.log('  ok   ' + n)) : (fail++, console.log('  FAIL ' + n)); };

function fakeDB(rows = [], { throws = false } = {}) {
  const writes = [];
  return {
    writes,
    prepare(sql) {
      return {
        bind(...a) {
          return {
            run: async () => { if (throws) throw new Error('d1 down'); writes.push({ sql, a }); return {}; },
            all: async () => { if (throws) throw new Error('d1 down'); return { results: rows }; },
          };
        },
      };
    },
  };
}
const req = (h = {}, cf = { colo: 'MSP' }, method = 'GET') =>
  Object.assign(new Request('https://zonesteward.balian.dev/', { method, headers: h }), { cf });

const run = async (r, db) => {
  const tasks = [];
  const res = await onRequest({
    request: r, env: { DB: db }, next: async () => new Response('hi'),
    waitUntil: (p) => tasks.push(p),
  });
  await Promise.all(tasks);
  return res;
};

console.log('_middleware');
let db = fakeDB();
await run(req({ 'sec-fetch-dest': 'document', 'user-agent': 'Mozilla/5.0' }), db);
ok('records a page view', db.writes.length === 1 && db.writes[0].a[0] === 'MSP');

db = fakeDB();
await run(req({ 'sec-fetch-dest': 'script', 'user-agent': 'Mozilla/5.0' }), db);
ok('ignores asset requests', db.writes.length === 0);

db = fakeDB();
await run(req({ 'sec-fetch-dest': 'document', 'user-agent': 'Googlebot/2.1' }), db);
ok('ignores obvious bots', db.writes.length === 0);

db = fakeDB();
await run(req({ 'sec-fetch-dest': 'document' }, {}), db);
ok('ignores a request with no colo', db.writes.length === 0);

db = fakeDB();
await run(req({ 'sec-fetch-dest': 'document', 'user-agent': 'M' }, { colo: 'msp; DROP' }), db);
ok('rejects a malformed colo', db.writes.length === 0);

let res = await run(req({ 'sec-fetch-dest': 'document', 'user-agent': 'M' }), fakeDB([], { throws: true }));
ok('D1 failure still serves the page', res.status === 200 && (await res.text()) === 'hi');

res = await run(req({ 'sec-fetch-dest': 'document', 'user-agent': 'M' }), undefined);
ok('no binding still serves the page', res.status === 200);

console.log('api/globe');
res = await onRequestGet({ env: { DB: fakeDB([{ colo: 'MSP', n: 500 }, { colo: 'LHR', n: 125 }, { colo: 'SYD', n: 2 }]) } });
let body = await res.json();
ok('normalises to the busiest colo', body.colos.MSP === 1 && body.colos.LHR === 0.25);
ok('floors tiny colos so they stay visible', body.colos.SYD === 0.06);
ok('never returns raw counts', !JSON.stringify(body).includes('500'));
ok('cached at the edge', /s-maxage/.test(res.headers.get('cache-control')));

res = await onRequestGet({ env: { DB: fakeDB([], { throws: true }) } });
ok('D1 failure returns empty, not an error', res.status === 200 && Object.keys((await res.json()).colos).length === 0);

res = await onRequestGet({ env: {} });
ok('no binding returns empty', res.status === 200);

console.log('api/beta');
function betaDB() {
  const rows = [];
  return { rows, prepare: () => ({ bind: (...a) => ({ run: async () => { rows.push(a); return {}; } }) }) };
}
const fd = (o) => { const f = new FormData(); for (const k in o) f.append(k, o[k]); return f; };
const post = (o, db, accept = 'application/json') =>
  betaPost({
    request: Object.assign(
      new Request('https://zonesteward.com/api/beta', { method: 'POST', body: fd(o), headers: { accept } }),
      { cf: { colo: 'MSP', country: 'US' } }
    ),
    env: { DB: db },
  });
const GOOD = { name: 'Pat', email: 'pat@agency.com', zones: '26-100', traffic: '10-100M', company: 'Agency', today: 'the dashboard' };

let bdb = betaDB();
let r = await post(GOOD, bdb);
ok('accepts a complete application', r.status === 200 && (await r.json()).ok === true && bdb.rows.length === 1);
ok('records the colo alongside it', bdb.rows[0].includes('MSP'));

bdb = betaDB();
r = await post({ ...GOOD, email: 'not-an-email' }, bdb);
ok('rejects a bad email', r.status === 400 && bdb.rows.length === 0);

bdb = betaDB();
r = await post({ ...GOOD, name: '' }, bdb);
ok('requires a name', r.status === 400 && bdb.rows.length === 0);

bdb = betaDB();
r = await post({ ...GOOD, zones: 'lots' }, bdb);
ok('rejects an unknown zone band', r.status === 400 && bdb.rows.length === 0);

bdb = betaDB();
r = await post({ ...GOOD, company_url: 'http://spam' }, bdb);
ok('honeypot: stored nothing but looks successful', r.status === 200 && bdb.rows.length === 0);

bdb = betaDB();
r = await post({ ...GOOD, today: 'x'.repeat(5000) }, bdb);
ok('truncates an oversized field', bdb.rows[0].some((v) => typeof v === 'string' && v.length === 1200));

bdb = betaDB();
r = await post({ ...GOOD, traffic: '' }, bdb);
ok('requires a traffic band', r.status === 400 && bdb.rows.length === 0);

bdb = betaDB();
{
  const f = fd(GOOD); f.append('plans', 'pro'); f.append('plans', 'free'); f.append('plans', 'platinum'); f.append('focus', 'dns');
  r = await betaPost({ request: Object.assign(new Request('https://zonesteward.com/api/beta', { method: 'POST', body: f, headers: { accept: 'application/json' } }), { cf: {} }), env: { DB: bdb } });
}
ok('joins checkbox groups and drops unknown values', bdb.rows[0].includes('pro,free') && !bdb.rows[0].some((v) => String(v).includes('platinum')) && bdb.rows[0].includes('dns'));

r = await post(GOOD, betaDB(), 'text/html');
{
  const html = await r.text();
  ok('works without JS: HTML confirmation', (r.headers.get('content-type') || '').includes('text/html'));
  ok('no-JS receipt echoes the answers with labels', html.includes('pat@agency.com') && html.includes('10–100 million') && html.includes('26–100'));
  ok('no-JS receipt escapes what it echoes', !(await post({ ...GOOD, name: '<img src=x onerror=1>' }, betaDB(), 'text/html').then((x) => x.text())).includes('<img'));
}

r = await post(GOOD, undefined);
ok('no binding fails loudly rather than dropping a signup', r.status === 503);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
