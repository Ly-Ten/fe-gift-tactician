// Construit data/map.json à partir de la recherche locale (research/map/, exclue de Git).
// Ne garde que des faits : noms, types, régions, positions, routes, stocks et objets. Aucune description recopiée.
// Le relief est généré à partir des positions et des routes (dessin original, rien n'est décalqué).
// Usage : node tools/build-map.js [--preview]
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const RES = path.join(ROOT, 'research/map');
const R = JSON.parse(fs.readFileSync(path.join(RES, 'map-data.json'), 'utf8'));
const TABLES = JSON.parse(fs.readFileSync(path.join(RES, 'fextralife_region_tables.json'), 'utf8'));

// ---------- régions ----------
const LAND = ['amalthea', 'thaleia', 'solidus', 'nysiades', 'lambath', 'pasithea', 'braxithea', 'melias', 'saveilon', 'ogmios', 'elektra', 'idyia', 'castalia', 'solomon'];
const SEAS = ['lir-sea', 'danann-sea'];
const REGION_FR = { 'lir-sea': 'Mer de Lir', 'danann-sea': 'Mer de Danann' };

// ---------- types de lieux ----------
function kindOf(t){
  t = t.toLowerCase();
  if(t.includes('ruined former capital')) return 'town';
  if(t.startsWith('sea ')) return t.includes('fish') ? 'fish' : 'search';
  if(t.includes('posthouse')) return 'post';
  if(t.includes('dungeon')) return 'dungeon';
  if(t.includes('temple')) return 'temple';
  if(t.includes('gathering')) return 'gather';
  if(t.includes('fishing')) return 'fish';
  if(t.includes('mining') || t.includes(' ore')) return 'ore';
  if(t.includes('feast')) return 'feast';
  if(t.includes('search')) return 'search';
  if(t.includes('checkpoint') || t.includes('battle')) return 'fort';
  if(t.includes('story')) return 'story';
  return 'town';
}
const SPOIL_NAMES = ['Palace of Sand', 'Diadem Temple', 'Fort Zanbar', 'Kunlun', 'Fezzan Gate', 'Isle of Sorrows', 'Bran Plains', "Zenzele's Paradise", 'Temple of Balor'];

// ---------- objets ----------
// fautes des données de fans, corrigées d'après le jeu
const ITEM_FIX = { 'Southern Ghost': 'Southern Ghosh', 'Volcano Ghost': 'Volcano Ghosh', 'Crimson Ghost': 'Crimson Ghosh', 'Strong Seasonings': 'Strong Seasoning', 'Electra Map': 'Elektra Map', 'Bronze Again': 'Bronze Axe' };
const clean = it => { const s = String(it).replace(/\s*x\s*\d+\s*$/i, '').replace(/\s+/g, ' ').trim(); return ITEM_FIX[s] || s; };
// stocks relevés en jeu : ils remplacent ceux des sources de fans
const SHOP_SEEN = {
  // marché de Callianeira, capture de Jean du 3 octobre 2026, dans l'ordre du jeu
  'callianeira-port': { m: ['Sun Ghosh', 'Jade Ghosh', 'Secret Ghosh', 'Southern Ghosh', 'Strong Seasoning', 'Rare Spices', 'Eastern Tea Leaves', 'Eastern Black Silk', 'Exquisite Ring', 'Eastern Earrings', 'Elektra Map'] }
};
const okItem = it => it && !/^tbc$/i.test(it) && !/contents unknown/i.test(it) && !it.endsWith(':') && it.length < 60;
const tableByName = {};
for(const reg in TABLES) for(const e of TABLES[reg]) tableByName[e.name.toLowerCase()] = e;
function placeItems(l){
  const names = [l.name, ...(l.aliases || [])].map(n => n.toLowerCase());
  const e = names.map(n => tableByName[n]).find(Boolean);
  let items = [];
  if(e && !(l.shops && Object.keys(l.shops).length)){
    for(const it of e.items || []){ if(String(it).endsWith(':')) break; items.push(clean(it)); }
  }
  if(!items.length && l.notes){
    const m = /(Gatherables|Fish|Ores?|Items|Loot|Chests?)\s*:\s*([^.]+)/i.exec(l.notes);
    if(m) items = m[2].split(',').map(clean);
  }
  const lvl = e && /Level:\s*(\d+)/.exec(e.meta || '');
  return { items: [...new Set(items.filter(okItem))], lvl: lvl ? +lvl[1] : null };
}
const SHOP_KEYS = { 'Market': 'm', 'Item Shop': 'i', 'Armory': 'a', 'Vandahl Trading Co.': 'v' };

// ---------- lieux ----------
const conf = c => c === 'confirmed' ? 2 : c === 'single-source' ? 1 : 0;
const places = [];
for(const l of R.locations){
  if(!LAND.includes(l.region) && !SEAS.includes(l.region)) continue;
  const p = { id: l.id, n: l.name, k: kindOf(l.type), r: l.region, c: conf(l.confidence) };
  if(l.x != null && l.y != null){ p.x = +l.x.toFixed(4); p.y = +l.y.toFixed(4); p.pc = conf(l.posConfidence); }
  if(/port/i.test(l.type)) p.port = 1;
  if(l.spoiler || SPOIL_NAMES.includes(l.name)) p.sp = 1;
  if(/base\)/.test(l.type)) p.base = 1;
  const sh = {};
  for(const key in l.shops || {}){
    const k = SHOP_KEYS[key]; if(!k) continue;
    const list = [...new Set((l.shops[key] || []).map(clean).filter(okItem))];
    if(list.length) sh[k] = list;
  }
  Object.assign(sh, SHOP_SEEN[l.id] || {});
  if(Object.keys(sh).length) p.sh = sh;
  const { items, lvl } = placeItems(l);
  if(items.length) p.it = items;
  if(lvl) p.lv = lvl;
  if(l.aliases && l.aliases.length) p.al = l.aliases;
  places.push(p);
}
const byId = Object.fromEntries(places.map(p => [p.id, p]));

// ---------- routes ----------
const RK = { 'road': 'r', 'desert path (temporary, one-way)': 'd', 'desert path (permanent once opened)': 'D', 'sea lane': 's', 'sea lane (temporary, one-way)': 'S', 'carriage (fast travel)': 'c', 'warp (Gate of the Gods)': 'w' };
const routes = [];
for(const r of R.routes){
  if(!byId[r.from] || !byId[r.to]) continue;
  routes.push([r.from, r.to, RK[r.kind] || 'r', conf(r.confidence)]);
}

// ---------- donjons placés d'après la carte annotée d'IGN (recalée sur notre repère) ----------
const keyName = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const IGN = fs.existsSync(path.join(RES, 'ign_dungeons.json')) ? JSON.parse(fs.readFileSync(path.join(RES, 'ign_dungeons.json'), 'utf8')) : [];
const byKey = {}; for(const p of places){ byKey[keyName(p.n)] = p; for(const a of p.al || []) byKey[keyName(a)] = p; }
const added = [], placedNow = [];
for(const d of IGN){
  const p = byKey[keyName(d.name)];
  if(p){ if(p.x == null){ p.x = d.x; p.y = d.y; p.pc = 1; placedNow.push(p.n); } }
  else { const np = { id: keyName(d.name), n: d.name, k: /mine/i.test(d.name) ? 'ore' : 'dungeon', r: null, c: 1, x: d.x, y: d.y, pc: 1 }; if(SPOIL_NAMES.includes(d.name)) np.sp = 1; places.push(np); byId[np.id] = np; added.push(d.name); }
}

// ---------- terrain (grille pixel d'après la vue d'ensemble, voir research/map/terrain.py) ----------
const T = JSON.parse(fs.readFileSync(path.join(RES, 'terrain.json'), 'utf8'));
const W = T.w, H = T.h, PX = 893, PY = 735;
const cls = new Uint8Array(W * H); { let i = 0; for(const [v, n] of T.runs){ cls.fill(v, i, i + n); i += n; } }
// régions : chaque case de terre prend la région du lieu ou du tronçon de route le plus proche
const seeds = [];
const regionIdx = r => LAND.indexOf(r) + 1;
for(const p of places) if(p.x != null && LAND.includes(p.r)) seeds.push([p.x * PX, p.y * PY, regionIdx(p.r)]);
for(const [a, b, k] of routes){
  if(!'rdD'.includes(k)) continue;
  const A = byId[a], B = byId[b];
  if(A.x == null || B.x == null || !LAND.includes(A.r) || !LAND.includes(B.r)) continue;
  const ax = A.x * PX, ay = A.y * PY, bx = B.x * PX, by = B.y * PY, n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / 6));
  for(let i = 1; i < n; i++){ const t = i / n; seeds.push([ax + (bx - ax) * t, ay + (by - ay) * t, regionIdx(t < .5 ? A.r : B.r)]); }
}
const nearestRegion = (cx, cy) => { let best = Infinity, reg = 0; for(const [sx, sy, r] of seeds){ const d = (sx - cx) ** 2 + (sy - cy) ** 2; if(d < best){ best = d; reg = r; } } return reg; };
for(const p of places) if(!p.r && p.x != null) p.r = LAND[nearestRegion(p.x * PX, p.y * PY) - 1];
// ---------- routes : terrain sous la route, hiérarchie, vectorisation ----------
const isR = i => cls[i] === 6 || cls[i] === 7;
const N8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
// terrain sous chaque case de route : terrain le plus fréquent autour
const baseCls = new Uint8Array(W * H);
for(let i = 0; i < W * H; i++){
  if(!isR(i)){ baseCls[i] = cls[i]; continue; }
  const x = i % W, y = (i / W) | 0, cnt = [0, 0, 0, 0, 0, 0];
  for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const X = x + dx, Y = y + dy; if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const c = cls[Y * W + X]; if(c >= 2 && c <= 5) cnt[c]++; }
  let b = 2; for(let c = 3; c <= 5; c++) if(cnt[c] > cnt[b]) b = c; baseCls[i] = b;
}
// liens entre cases de route : la diagonale n'est gardée que sans passage orthogonal
function links(i){
  const x = i % W, y = (i / W) | 0, out = [];
  for(const [dy, dx] of N8){
    const X = x + dx, Y = y + dy; if(X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const n = Y * W + X; if(!isR(n)) continue;
    if(dx && dy && (isR(y * W + X) || isR(Y * W + x))) continue;
    out.push(n);
  }
  return out;
}
const L = new Map(); for(let i = 0; i < W * H; i++) if(isR(i)) L.set(i, links(i));
function snapCell(p){
  const cx = Math.floor(p.x * W), cy = Math.floor(p.y * H); let best = -1, bd = Infinity;
  for(let r = 0; r <= 7 && best < 0; r++) for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++){
    const X = cx + dx, Y = cy + dy; if(X < 0 || Y < 0 || X >= W || Y >= H) continue;
    const i = Y * W + X; if(!isR(i)) continue; const d = dx * dx + dy * dy; if(d < bd){ bd = d; best = i; }
  }
  return best;
}
function bfs(sources){
  const prev = new Map(); const q = [];
  for(const s of sources){ prev.set(s, -1); q.push(s); }
  for(let h = 0; h < q.length; h++){ const u = q[h]; for(const v of L.get(u)) if(!prev.has(v)){ prev.set(v, u); q.push(v); } }
  return prev;
}
// niveau 1 : routes entre villes ; niveau 2 : accès aux autres lieux ; niveau 3 : le reste
const level = new Uint8Array(W * H);
for(const i of L.keys()) level[i] = 3;
const townCells = places.filter(p => p.k === 'town' && p.x != null && !p.sp).map(snapCell).filter(c => c >= 0);
for(const s0 of townCells){
  const prev = bfs([s0]);
  for(const t of townCells){ if(t === s0 || !prev.has(t)) continue; let c = t; while(c !== -1){ level[c] = 1; c = prev.get(c); } }
}
{
  const prev = bfs([...L.keys()].filter(i => level[i] === 1));
  for(const p of places){
    if(p.k === 'town' || p.x == null) continue;
    let c = snapCell(p);
    while(c >= 0 && prev.has(c) && level[c] !== 1){ level[c] = 2; c = prev.get(c); }
  }
}
const regionCell = i => nearestRegion(((i % W) + .5) * PX / W, (((i / W) | 0) + .5) * PY / H);
// tronçons entre carrefours, bouts de route et changements de niveau
const isNode = i => { const ls = L.get(i); return ls.length !== 2 || ls.some(n => level[n] !== level[i]); };
const seenE = new Set(), chains = [];
const ek = (a, b) => a < b ? a + ':' + b : b + ':' + a;
for(const i of L.keys()){
  if(!isNode(i)) continue;
  for(const n of L.get(i)){
    if(seenE.has(ek(i, n))) continue;
    const ch = [i]; let prev = i, cur = n; seenE.add(ek(i, n));
    while(true){
      ch.push(cur);
      if(isNode(cur)) break;
      const nx = L.get(cur).find(v => v !== prev); if(nx === undefined || seenE.has(ek(cur, nx))) break;
      seenE.add(ek(cur, nx)); prev = cur; cur = nx;
    }
    chains.push(ch);
  }
}
for(const i of L.keys()){ // boucles fermées sans carrefour
  for(const n of L.get(i)){ if(seenE.has(ek(i, n))) continue; const ch = [i]; let prev = i, cur = n; seenE.add(ek(i, n));
    while(cur !== i){ ch.push(cur); const nx = L.get(cur).find(v => v !== prev && !seenE.has(ek(cur, v))); if(nx === undefined) break; seenE.add(ek(cur, nx)); prev = cur; cur = nx; }
    ch.push(cur); chains.push(ch); }
}
const dp = (pts, eps) => {
  if(pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
  let k = 0, md = -1; for(let j = 1; j < pts.length - 1; j++){ const d = Math.abs(dx * (pts[j][1] - ay) - dy * (pts[j][0] - ax)) / l; if(d > md){ md = d; k = j; } }
  return md > eps ? dp(pts.slice(0, k + 1), eps).slice(0, -1).concat(dp(pts.slice(k), eps)) : [pts[0], pts[pts.length - 1]];
};
const chaikin = (pts, it) => { for(let n = 0; n < it && pts.length > 2; n++){ const o = [pts[0]]; for(let j = 0; j < pts.length - 1; j++){ const [x1, y1] = pts[j], [x2, y2] = pts[j + 1]; o.push([.75 * x1 + .25 * x2, .75 * y1 + .25 * y2], [.25 * x1 + .75 * x2, .25 * y1 + .75 * y2]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
const roadLines = [];
for(const ch of chains){
  const inner = ch.length > 2 ? ch.slice(1, -1) : ch;
  const lv = Math.min(...inner.map(c => level[c]));
  const pts = chaikin(dp(ch.map(c => [(c % W) + .5, ((c / W) | 0) + .5]), .7), 2);
  const flat = []; for(const [x, y] of pts) flat.push(Math.round(x * 10), Math.round(y * 10));
  roadLines.push([lv, regionCell(ch[Math.floor(ch.length / 2)]), ...flat]);
}
// points de passage : carrefours relevés sur la carte et embranchements, sur les routes principales et d'accès
const dots = [];
for(const i of L.keys()){
  if(level[i] > 2) continue;
  if(cls[i] === 7 || L.get(i).length >= 3){
    const x = (i % W) + .5, y = ((i / W) | 0) + .5;
    if(dots.some(d => Math.hypot(d[2] / 10 - x, d[3] / 10 - y) < 2.2)) continue;
    dots.push([level[i], regionCell(i), Math.round(x * 10), Math.round(y * 10)]);
  }
}
// grille : classe de terrain (+8 sous une route, pour les itinéraires) et région
const grid = new Uint8Array(W * H);
for(let gy = 0; gy < H; gy++) for(let gx = 0; gx < W; gx++){
  const i = gy * W + gx, c = isR(i) ? 8 + baseCls[i] : cls[i];
  grid[i] = c * 16 + (cls[i] >= 2 ? nearestRegion((gx + .5) * PX / W, (gy + .5) * PY / H) : 0);
}
console.log(`Routes : ${roadLines.filter(r => r[0] === 1).length} tronçons principaux, ${roadLines.filter(r => r[0] === 2).length} d'accès, ${roadLines.filter(r => r[0] === 3).length} secondaires, ${dots.length} points de passage.`);
// encodage par plages : valeur sur 2 caractères (base 36) suivie de la longueur (base 36)
const runs = [];
for(let i = 0; i < grid.length;){ let j = i; while(j < grid.length && grid[j] === grid[i]) j++; runs.push(grid[i].toString(36).padStart(2, '0') + (j - i).toString(36)); i = j; }

const out = {
  v: 1,
  note: 'Carte de fan, non officielle : relief, routes et positions redessinés d’après la carte du jeu ; lieux et stocks compilés à partir de Fextralife, IGN, RPG Site, VGC, Game8, Siliconera, Gematsu et NightlyGamingBinge (octobre 2026).',
  frame: { w: W, h: H, cls: ['eau', 'nuage', 'plaine', 'forêt', 'terre sèche', 'sable'], road: 'classe + 8 sous une route' },
  roads: { lines: roadLines, dots },
  regions: [...LAND, ...SEAS].map(id => { const r = R.regions.find(x => x.id === id); return { id, n: REGION_FR[id] || (r ? r.name : id), sea: SEAS.includes(id) ? 1 : 0 }; }),
  places, routes,
  grid: runs.join(',')
};
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/map.json'), JSON.stringify(out));
const items = new Set(); for(const p of places){ for(const k in p.sh || {}) p.sh[k].forEach(i => items.add(i)); (p.it || []).forEach(i => items.add(i)); }
console.log(`data/map.json : ${places.length} lieux (${places.filter(p => p.x != null).length} placés), ${routes.length} routes, ${items.size} objets, ${Math.round(fs.statSync(path.join(ROOT, 'data/map.json')).size / 1024)} Ko.`);

console.log(`Donjons : ${placedNow.length} positions complétées, ${added.length} lieux ajoutés (${added.join(', ')}).`);
