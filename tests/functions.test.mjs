import { onRequest } from '../functions/_middleware.js';
import { onRequestGet } from '../functions/api/globe.js';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
