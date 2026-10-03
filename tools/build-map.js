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
const clean = it => String(it).replace(/\s*x\s*\d+\s*$/i, '').replace(/\s+/g, ' ').trim();
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
const grid = new Uint8Array(W * H);
for(let gy = 0; gy < H; gy++) for(let gx = 0; gx < W; gx++){
  const i = gy * W + gx, c = cls[i];
  grid[i] = c * 16 + (c >= 2 ? nearestRegion((gx + .5) * PX / W, (gy + .5) * PY / H) : 0);
}
// encodage par plages : valeur sur 2 caractères (base 36) suivie de la longueur (base 36)
const runs = [];
for(let i = 0; i < grid.length;){ let j = i; while(j < grid.length && grid[j] === grid[i]) j++; runs.push(grid[i].toString(36).padStart(2, '0') + (j - i).toString(36)); i = j; }

const out = {
  v: 1,
  note: 'Carte de fan, non officielle : relief, routes et positions redessinés d’après la carte du jeu ; lieux et stocks compilés à partir de Fextralife, IGN, RPG Site, VGC, Game8, Siliconera, Gematsu et NightlyGamingBinge (octobre 2026).',
  frame: { w: W, h: H, cls: ['eau', 'nuage', 'plaine', 'forêt', 'terre sèche', 'sable', 'route', 'carrefour'] },
  regions: [...LAND, ...SEAS].map(id => { const r = R.regions.find(x => x.id === id); return { id, n: REGION_FR[id] || (r ? r.name : id), sea: SEAS.includes(id) ? 1 : 0 }; }),
  places, routes,
  grid: runs.join(',')
};
fs.mkdirSync(path.join(ROOT, 'data'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/map.json'), JSON.stringify(out));
const items = new Set(); for(const p of places){ for(const k in p.sh || {}) p.sh[k].forEach(i => items.add(i)); (p.it || []).forEach(i => items.add(i)); }
console.log(`data/map.json : ${places.length} lieux (${places.filter(p => p.x != null).length} placés), ${routes.length} routes, ${items.size} objets, ${Math.round(fs.statSync(path.join(ROOT, 'data/map.json')).size / 1024)} Ko.`);

console.log(`Donjons : ${placedNow.length} positions complétées, ${added.length} lieux ajoutés (${added.join(', ')}).`);
