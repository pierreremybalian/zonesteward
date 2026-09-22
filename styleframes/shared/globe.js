// 157 real Cloudflare points of presence, lifted from the product's own
// colo table via the launch film. Orthographic projection: a genuine globe,
// not a decorative circle.
const POPS = [{"c":"ATL","lat":33.641,"lng":-84.428},{"c":"ORD","lat":41.974,"lng":-87.907},{"c":"DFW","lat":32.9,"lng":-97.04},{"c":"DEN","lat":39.862,"lng":-104.673},{"c":"IAH","lat":29.984,"lng":-95.341},{"c":"LAS","lat":36.084,"lng":-115.154},{"c":"LAX","lat":33.942,"lng":-118.409},{"c":"MIA","lat":25.796,"lng":-80.287},{"c":"MSP","lat":44.882,"lng":-93.222},{"c":"EWR","lat":40.69,"lng":-74.174},{"c":"JFK","lat":40.641,"lng":-73.778},{"c":"IAD","lat":38.953,"lng":-77.457},{"c":"PHX","lat":33.437,"lng":-112.008},{"c":"PIT","lat":40.492,"lng":-80.233},{"c":"PDX","lat":45.589,"lng":-122.597},{"c":"SLC","lat":40.79,"lng":-111.979},{"c":"SAN","lat":32.734,"lng":-117.193},{"c":"SFO","lat":37.621,"lng":-122.379},{"c":"SJC","lat":37.364,"lng":-121.929},{"c":"SEA","lat":47.45,"lng":-122.309},{"c":"TPA","lat":27.976,"lng":-82.533},{"c":"BOS","lat":42.366,"lng":-71.01},{"c":"STL","lat":38.749,"lng":-90.37},{"c":"CMH","lat":39.998,"lng":-82.892},{"c":"IND","lat":39.717,"lng":-86.294},{"c":"MEM","lat":35.042,"lng":-89.977},{"c":"MCI","lat":39.298,"lng":-94.714},{"c":"OKC","lat":35.393,"lng":-97.601},{"c":"SMF","lat":38.695,"lng":-121.591},{"c":"YYZ","lat":43.678,"lng":-79.625},{"c":"YUL","lat":45.471,"lng":-73.741},{"c":"YVR","lat":49.194,"lng":-123.184},{"c":"YYC","lat":51.121,"lng":-114.008},{"c":"MEX","lat":19.436,"lng":-99.072},{"c":"GDL","lat":20.522,"lng":-103.311},{"c":"GIG","lat":-22.81,"lng":-43.251},{"c":"GRU","lat":-23.436,"lng":-46.473},{"c":"EZE","lat":-34.822,"lng":-58.536},{"c":"SCL","lat":-33.393,"lng":-70.786},{"c":"LIM","lat":-12.022,"lng":-77.114},{"c":"BOG","lat":4.702,"lng":-74.147},{"c":"UIO","lat":-0.129,"lng":-78.358},{"c":"CCS","lat":10.601,"lng":-66.991},{"c":"PTY","lat":9.071,"lng":-79.383},{"c":"SDQ","lat":18.43,"lng":-69.669},{"c":"AMS","lat":52.31,"lng":4.768},{"c":"ATH","lat":37.936,"lng":23.945},{"c":"BCN","lat":41.297,"lng":2.083},{"c":"BEG","lat":44.818,"lng":20.309},{"c":"BER","lat":52.367,"lng":13.503},{"c":"BRU","lat":50.901,"lng":4.484},{"c":"BUD","lat":47.437,"lng":19.256},{"c":"CPH","lat":55.618,"lng":12.651},{"c":"DUB","lat":53.421,"lng":-6.27},{"c":"DUS","lat":51.289,"lng":6.767},{"c":"FRA","lat":50.038,"lng":8.562},{"c":"GVA","lat":46.238,"lng":6.109},{"c":"HAM","lat":53.63,"lng":9.988},{"c":"HEL","lat":60.317,"lng":24.963},{"c":"IST","lat":41.275,"lng":28.752},{"c":"KEF","lat":63.985,"lng":-22.606},{"c":"KIV","lat":46.928,"lng":28.931},{"c":"LHR","lat":51.47,"lng":-0.454},{"c":"LIS","lat":38.781,"lng":-9.136},{"c":"LUX","lat":49.623,"lng":6.204},{"c":"MAD","lat":40.484,"lng":-3.568},{"c":"MAN","lat":53.365,"lng":-2.273},{"c":"MRS","lat":43.439,"lng":5.221},{"c":"MUC","lat":48.354,"lng":11.775},{"c":"MXP","lat":45.631,"lng":8.728},{"c":"OSL","lat":60.194,"lng":11.1},{"c":"OTP","lat":44.572,"lng":26.102},{"c":"PRG","lat":50.101,"lng":14.26},{"c":"RIX","lat":56.924,"lng":23.971},{"c":"SOF","lat":42.695,"lng":23.406},{"c":"STO","lat":59.652,"lng":17.919},{"c":"ARN","lat":59.652,"lng":17.919},{"c":"TLL","lat":59.413,"lng":24.833},{"c":"VIE","lat":48.11,"lng":16.57},{"c":"VNO","lat":54.634,"lng":25.286},{"c":"WAW","lat":52.166,"lng":20.967},{"c":"ZAG","lat":45.743,"lng":16.069},{"c":"ZRH","lat":47.465,"lng":8.549},{"c":"CDG","lat":49.01,"lng":2.548},{"c":"TLV","lat":32.011,"lng":34.887},{"c":"BAH","lat":26.271,"lng":50.634},{"c":"BKK","lat":13.69,"lng":100.75},{"c":"BLR","lat":13.198,"lng":77.706},{"c":"BOM","lat":19.09,"lng":72.866},{"c":"CAN","lat":23.392,"lng":113.299},{"c":"CCU","lat":22.655,"lng":88.447},{"c":"CGK","lat":-6.126,"lng":106.656},{"c":"CMB","lat":7.181,"lng":79.884},{"c":"CTU","lat":30.578,"lng":103.948},{"c":"DEL","lat":28.556,"lng":77.1},{"c":"DPS","lat":-8.748,"lng":115.167},{"c":"DXB","lat":25.253,"lng":55.366},{"c":"FUK","lat":33.586,"lng":130.451},{"c":"HAN","lat":21.219,"lng":105.804},{"c":"HKG","lat":22.308,"lng":113.918},{"c":"HND","lat":35.549,"lng":139.78},{"c":"HYD","lat":17.24,"lng":78.429},{"c":"ICN","lat":37.46,"lng":126.441},{"c":"KHH","lat":22.577,"lng":120.35},{"c":"KIX","lat":34.435,"lng":135.244},{"c":"KUL","lat":2.746,"lng":101.71},{"c":"MAA","lat":12.99,"lng":80.169},{"c":"MFM","lat":22.15,"lng":113.592},{"c":"MNL","lat":14.509,"lng":121.019},{"c":"NAG","lat":34.858,"lng":136.805},{"c":"NRT","lat":35.765,"lng":140.386},{"c":"PEK","lat":40.08,"lng":116.585},{"c":"PNH","lat":11.547,"lng":104.844},{"c":"PVG","lat":31.144,"lng":121.808},{"c":"SGN","lat":10.819,"lng":106.652},{"c":"SHE","lat":41.64,"lng":123.484},{"c":"SIN","lat":1.364,"lng":103.992},{"c":"SZX","lat":22.639,"lng":113.811},{"c":"TPE","lat":25.078,"lng":121.233},{"c":"ULN","lat":47.643,"lng":106.821},{"c":"YGN","lat":16.907,"lng":96.133},{"c":"KHV","lat":48.528,"lng":135.188},{"c":"SVO","lat":55.973,"lng":37.415},{"c":"DME","lat":55.409,"lng":37.906},{"c":"LED","lat":59.8,"lng":30.262},{"c":"AMM","lat":31.723,"lng":35.993},{"c":"BEY","lat":33.821,"lng":35.488},{"c":"DOH","lat":25.273,"lng":51.609},{"c":"KWI","lat":29.227,"lng":47.969},{"c":"MCT","lat":23.593,"lng":58.284},{"c":"RUH","lat":24.958,"lng":46.699},{"c":"THR","lat":35.689,"lng":51.313},{"c":"CAI","lat":30.122,"lng":31.406},{"c":"CMN","lat":33.367,"lng":-7.59},{"c":"CPT","lat":-33.965,"lng":18.602},{"c":"DAR","lat":-6.878,"lng":39.203},{"c":"DKR","lat":14.74,"lng":-17.49},{"c":"JIB","lat":11.547,"lng":43.16},{"c":"JNB","lat":-26.139,"lng":28.246},{"c":"LOS","lat":6.577,"lng":3.321},{"c":"MBA","lat":-4.035,"lng":39.594},{"c":"MRU","lat":-20.43,"lng":57.684},{"c":"NBO","lat":-1.319,"lng":36.928},{"c":"RUN","lat":-20.887,"lng":55.51},{"c":"TUN","lat":36.851,"lng":10.227},{"c":"ADL","lat":-34.945,"lng":138.531},{"c":"AKL","lat":-37.008,"lng":174.792},{"c":"BNE","lat":-27.394,"lng":153.122},{"c":"CBR","lat":-35.307,"lng":149.196},{"c":"CHC","lat":-43.489,"lng":172.532},{"c":"HBA","lat":-42.836,"lng":147.51},{"c":"MEL","lat":-37.673,"lng":144.843},{"c":"PER","lat":-31.94,"lng":115.967},{"c":"SYD","lat":-33.94,"lng":151.175},{"c":"WLG","lat":-41.327,"lng":174.805},{"c":"NOU","lat":-22.015,"lng":166.213},{"c":"PPT","lat":-17.557,"lng":-149.612}];

const R_DEFAULT = 380;
const VIEW = { lat: 22, lng: -30 };
const d2r = (d) => (d * Math.PI) / 180;

function project(lat, lng, R) {
  const p = d2r(lat), l = d2r(lng), p0 = d2r(VIEW.lat), l0 = d2r(VIEW.lng);
  const cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l - l0);
  const x = Math.cos(p) * Math.sin(l - l0);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l - l0);
  return { x: R + x * R, y: R - y * R, z: cosc };
}

/** Paint the front-facing PoPs into `el`, sized to its own box. */
function drawGlobe(el, opts = {}) {
  const size = el.clientWidth || 600;
  const R = size / 2;
  const dot = opts.dot ?? 3;
  const colour = opts.colour ?? "#F6821F";
  const frag = document.createDocumentFragment();
  let shown = 0;
  POPS.forEach((p, i) => {
    const q = project(p.lat, p.lng, R);
    if (q.z <= 0.03) return;
    const d = document.createElement("span");
    d.className = "pop";
    const depth = 0.45 + 0.55 * q.z;
    d.style.cssText =
      `left:${q.x}px;top:${q.y}px;width:${dot}px;height:${dot}px;` +
      `margin:${-dot / 2}px 0 0 ${-dot / 2}px;background:${colour};opacity:${depth.toFixed(2)};` +
      `--delay:${((i * 37) % 100) / 25}s`;
    frag.appendChild(d);
    shown++;
  });
  el.appendChild(frag);
  return shown;
}
