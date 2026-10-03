/* Carte du monde du Fil des cadeaux : relief pixel, routes, lieux, recherche d'objets, itinéraires, régions à débloquer.
   Script chargé après le script principal, dont il utilise l'état et les fonctions (S, store, pix, esc, norm, openPanel…).
   Données de fans (data/map.json), relief dessiné à partir des positions relevées : rien n'est repris des images du jeu. */
(() => {
  const M = window.MAP = { ready: false };
  let D = null, P = {}, IDX = null, MKT = {}, GIFT_KEY = {};
  let GW = 224, GH = 184;
  const HD = 4; let hdKey = null;
  const KIND = {
    town: ['Ville', 'castle'], post: ['Relais de poste', 'horse'], temple: ['Temple', 'temple'], dungeon: ['Donjon', 'cave'],
    gather: ['Récolte', 'seeds'], fish: ['Pêche', 'fish'], ore: ['Minerai', 'pick'], search: ['Fouille', 'lens'],
    feast: ['Festin', 'meat'], fort: ['Forteresse', 'tower'], story: ['Lieu d’histoire', 'star']
  };
  const HOW = { gather: 'Récolte', fish: 'Pêche', ore: 'Minerai', search: 'Fouille', feast: 'Festin', dungeon: 'Coffres et butin', town: 'Sur place', post: 'Sur place', temple: 'Sur place', fort: 'Sur place', story: 'Sur place' };
  const SHOP = { m: 'Marché', i: 'Boutique d’objets', a: 'Armurerie', v: 'Vandahl Trading Co.' };
  const BASE = { cai: ['idyia', 'ribeira'], die: ['castalia', 'fina'], the: ['saveilon', 'megaira'], led: ['thaleia', 'kassite'] };
  // villes de l'outil et lieux de la carte
  const TOWN_PLACE = { 'Aguino': 'aguino', 'Alecto': 'alecto', 'Barsk': 'barsk-post-town', 'Benetnasch': 'benetnasch', 'Breston': 'breston',
    'Callianeira': 'callianeira-port', 'Dagsion (Taverne)': 'dagsion', 'Dagsion (Galerie marchande)': 'dagsion', 'Da Mina': 'da-mina', 'Daimon': 'daimon',
    'Fina': 'fina', 'Grand Aragon': 'grand-aragon', 'Mahon': 'mahon-castle-town', 'Megaira': 'megaira', 'Mons': 'mons', 'Niiza': 'niiza-port',
    'Orens': 'orens', 'Osiris': 'osiris', 'Pandora': 'port-of-pandora', 'Raivo': 'raivo-port', 'Regia': 'regia', 'Ribeira (colporteur)': 'ribeira',
    'Shama': 'shama-port', 'Twalinn': 'twalinn', 'Whill': 'whill', 'Yaaman': 'yaaman', 'Zoste': 'zoste' };
  const PLACE_TOWN = { 'dagsion': 'Dagsion (Galerie marchande)' };
  for(const t in TOWN_PLACE) if(!PLACE_TOWN[TOWN_PLACE[t]]) PLACE_TOWN[TOWN_PLACE[t]] = t;
  const toolName = p => PLACE_TOWN[p.id] || p.n;

  // ---------- état ----------
  const ALLK = Object.keys(KIND);
  const FILTERS = [['town', ['town'], 'castle', 'Villes'], ['temple', ['post', 'temple'], 'temple', 'Relais et temples'], ['dungeon', ['dungeon', 'fort', 'story'], 'cave', 'Donjons et forteresses'],
    ['gather', ['gather'], 'seeds', 'Récolte'], ['fish', ['fish'], 'fish', 'Pêche'], ['ore', ['ore', 'search'], 'pick', 'Minerai et fouille'], ['feast', ['feast'], 'meat', 'Festins']];
  S.mapKinds = (a => Array.isArray(a) ? a.filter(k => ALLK.includes(k)) : ALLK.filter(k => k !== 'story'))(store.get('mapKinds', null));
  S.regions = (a => Array.isArray(a) ? a : null)(store.get('regions', null));
  S.spoil = !!store.get('spoil', false);
  S.mUseful = store.get('mUseful', true) !== false;
  S.mFast = !!store.get('mFast', false);
  S.mNames = store.get('mNames', true) !== false;
  S.mapItem = null; S.mapSel = null; S.route = null; S.mFrom = null; S.mTo = '';
  let view = null, needFit = true, pinsEl = null, stageEl = null, viewEl = null;

  const reached = () => S.regions || [...new Set(['amalthea', BASE[S.lord][0]])];
  const regionOk = r => reached().includes(r);
  const visible = p => !!p && (S.spoil || !p.sp) && regionOk(p.r);
  M.townPlace = t => P[TOWN_PLACE[t]] || D && D.places.find(p => p.n === t) || null;
  M.townReachable = t => { if(!D) return true; const p = M.townPlace(t); return !p || visible(p); };
  M.giftTowns = g => MKT[g] ? [...MKT[g]] : [];
  M.isMapTown = (g, t) => !!(MKT[g] && MKT[g].has(t));

  // ---------- objets : index et correspondance avec les cadeaux ----------
  const normItem = n => String(n).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'")
    .replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').map(w => w.length > 3 ? w.replace(/s$/, '') : w).join(' ');
  const ALIAS = { 'crimson ghost': 'crimson_ghosh', 'divination bagua': 'bagua_set', 'ebony game board': 'ebony_bg', 'jade panther figure': 'bull_panther',
    'crimson bull figure': 'bull_panther', 'bow repair kit': 'bow_kit', 'fodlan tea': 'fodlan_tea', 'strong seasoning': 'strong_seasoning' };
  function giftKeys(){
    const out = {};
    for(const g in GIFTS){
      const en = GIFTS[g][0];
      const m = /^(.*?)\s*\((?:ou|or)\s+([^)]*)\)\s*$/.exec(en);
      const names = m ? [m[1], m[2]] : en.split(' / ');
      for(const n of names) out[normItem(n)] = g;
    }
    for(const a in ALIAS) out[normItem(a)] = ALIAS[a];
    return out;
  }
  function buildIndex(){
    IDX = new Map(); MKT = {};
    const add = (name, id, how) => {
      const k = normItem(name); if(!k) return;
      let e = IDX.get(k);
      if(!e){ e = { key: k, name, gift: GIFT_KEY[k] || null, at: [] }; IDX.set(k, e); }
      if(!e.at.some(a => a.id === id && a.how === how)) e.at.push({ id, how });
    };
    for(const p of D.places){
      for(const s in p.sh || {}) for(const it of p.sh[s]){
        add(it, p.id, SHOP[s]);
        const g = GIFT_KEY[normItem(it)];
        if(g && (p.k === 'town' || s === 'm')) (MKT[g] = MKT[g] || new Set()).add(toolName(p));
      }
      for(const it of p.it || []) add(it, p.id, HOW[p.k] || 'Sur place');
    }
  }
  const itemLabel = e => e.gift ? `${pix(GIFTS[e.gift][2])}${esc(GIFTS[e.gift][1])}` : esc(e.name);

  // ---------- chargement ----------
  M.load = async () => {
    try {
      const r = await fetch('data/map.json', { cache: 'no-cache' });
      D = await r.json();
    } catch(e){ M.error = true; if(S.tab === 'map') renderList(); return; }
    GW = D.frame.w; GH = D.frame.h;
    P = Object.fromEntries(D.places.map(p => [p.id, p]));
    GIFT_KEY = giftKeys(); buildIndex();
    D.cells = decode(D.grid);
    M.ready = true;
    render();
  };
  function decode(s){
    const a = new Uint8Array(GW * GH); let i = 0;
    for(const run of s.split(',')){ const v = parseInt(run.slice(0, 2), 36), n = parseInt(run.slice(2), 36); a.fill(v, i, i + n); i += n; }
    return a;
  }

  // ---------- couleurs du terrain selon le thème ----------
  // classes : 0 eau, 1 nuage, 2 plaine, 3 forêt, 4 terre sèche, 5 sable, 6 route, 7 carrefour
  function palette(){
    const night = isNight(), retro = isRetro();
    if(retro && !night) return { water: [48,96,216], shore: [104,160,244], cloud: [240,244,255], cloud2: [214,224,252], land: [null, null, [124,196,88], [64,150,64], [204,172,100], [240,222,148], [255,246,214], [255,255,255]], forest2: [52,132,56], fog: [[226,232,252],[212,220,248]], coast: .78, label: 'light' };
    if(retro) return { water: [18,34,104], shore: [34,64,152], cloud: [48,58,110], cloud2: [40,50,98], land: [null, null, [58,110,74], [34,82,58], [104,92,82], [128,118,98], [196,190,170], [236,236,236]], forest2: [28,72,52], fog: [[52,62,112],[44,54,102]], coast: .78, label: 'dark' };
    if(night) return { water: [22,40,62], shore: [38,66,90], cloud: [56,60,72], cloud2: [48,52,64], land: [null, null, [78,86,54], [50,68,38], [96,82,60], [118,106,80], [176,164,132], [228,224,210]], forest2: [44,60,34], fog: [[60,64,78],[52,56,70]], coast: .8, label: 'dark' };
    return { water: [58,112,150], shore: [98,168,190], cloud: [230,230,226], cloud2: [212,213,210], land: [null, null, [164,170,102], [104,138,66], [186,158,108], [228,208,156], [248,238,204], [255,255,255]], forest2: [92,124,58], fog: [[222,224,230],[208,211,220]], coast: .82, label: 'light' };
  }
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 0x27d4eb2d; h = Math.imul(h ^ (h >>> 15), 2246822519); return ((h ^ (h >>> 13)) >>> 0) / 4294967295; };
  function paint(canvas){
    const ctx = canvas.getContext('2d'), img = ctx.createImageData(GW, GH), pal = palette(), c = D.cells, reg = D.regions, ok = reached();
    const clsAt = (x, y) => { if(x < 0 || y < 0 || x >= GW || y >= GH) return 1; const k = c[y * GW + x] >> 4; return k >= 8 ? k - 8 : k; };
    const regAt = (x, y) => (x < 0 || y < 0 || x >= GW || y >= GH) ? 0 : c[y * GW + x] & 15;
    for(let y = 0; y < GH; y++) for(let x = 0; x < GW; x++){
      const v = c[y * GW + x], k0 = v >> 4, k = k0 >= 8 ? k0 - 8 : k0, r = v & 15, i = (y * GW + x) * 4, h = hash(x, y);
      let col;
      if(k === 0){
        const shore = clsAt(x - 1, y) >= 2 || clsAt(x + 1, y) >= 2 || clsAt(x, y - 1) >= 2 || clsAt(x, y + 1) >= 2;
        col = shore ? pal.shore : pal.water;
        if(!shore && h > .985) col = mix(col, [255,255,255], .2);
      } else if(k === 1){
        const edge = clsAt(x - 1, y) !== 1 || clsAt(x + 1, y) !== 1 || clsAt(x, y - 1) !== 1 || clsAt(x, y + 1) !== 1;
        col = edge ? pal.cloud2 : pal.cloud;
        if(h > .9) col = mix(col, pal.cloud2, .5);
      } else if(!ok.includes(reg[r - 1] && reg[r - 1].id)){
        const base = k === 3 ? pal.land[3] : pal.land[Math.min(k, 5)] || pal.land[2];
        const g = Math.round(base[0] * .3 + base[1] * .59 + base[2] * .11);
        col = mix(mix(base, [g, g, g], .75), pal.fog[(x + y) % 2], .45);
      } else {
        col = (k === 3 && (h > .5)) ? pal.forest2 : pal.land[k];
        if(k <= 5){
          const t = (h - .5) * .07; col = col.map(z => Math.max(0, Math.min(255, Math.round(z * (1 + t)))));
          if(clsAt(x - 1, y) === 0 || clsAt(x + 1, y) === 0 || clsAt(x, y - 1) === 0 || clsAt(x, y + 1) === 0) col = col.map(z => Math.round(z * pal.coast));
          else if((x + y) % 2 && [regAt(x - 1, y), regAt(x + 1, y), regAt(x, y - 1), regAt(x, y + 1)].some(z => z && z !== r)) col = col.map(z => Math.round(z * .86));
        }
      }
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return pal;
  }

  // ---------- utilité des villes cette semaine ----------
  function usefulByPlace(){
    const out = {}; if(!S.mUseful) return out;
    const need = needingChars(), idx = townIndex();
    const loves = g => need.some(c => { const t = tierOf(c, g); return t && t.t === 'L'; });
    for(const t in idx){
      const p = M.townPlace(t); if(!p) continue;
      const set = out[p.id] = out[p.id] || new Set();
      for(const g of idx[t]) if(loves(g)) set.add(g);
    }
    for(const id in out) out[id] = out[id].size;
    return out;
  }

  // ---------- itinéraires : par le réseau routier pixel de la carte, plus les liaisons relevées ----------
  const isRoad = v => (v >> 4) >= 8;
  const snapCache = {};
  function snap(p){
    if(p.id in snapCache) return snapCache[p.id];
    const cx = Math.floor(p.x * GW), cy = Math.floor(p.y * GH); let best = -1, bd = Infinity;
    for(let r = 0; r <= 7 && best < 0; r++) for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++){
      const x = cx + dx, y = cy + dy; if(x < 0 || y < 0 || x >= GW || y >= GH) continue;
      const i = y * GW + x; if(!isRoad(D.cells[i])) continue;
      const d = dx * dx + dy * dy; if(d < bd){ bd = d; best = i; }
    }
    return snapCache[p.id] = best;
  }
  const cellOf = p => { const s0 = snap(p); return s0 >= 0 ? s0 : (Math.floor(p.y * GH) * GW + Math.floor(p.x * GW)); };
  function extraEdges(){
    const ex = {}, seaOk = reached().includes('lir-sea') || reached().includes('danann-sea');
    const add = (a, b, w) => { (ex[a] = ex[a] || []).push([b, w]); (ex[b] = ex[b] || []).push([a, w]); };
    for(const [a, b, k] of D.routes){
      const A = P[a], B = P[b];
      if(!visible(A) || !visible(B) || A.x == null || B.x == null) continue;
      if((k === 'c' || k === 'w') && !S.mFast) continue;
      if((k === 's' || k === 'S') && !seaOk) continue;
      const ca = cellOf(A), cb = cellOf(B), dist = Math.hypot((A.x - B.x) * GW, (A.y - B.y) * GH);
      add(ca, cb, (k === 'c' || k === 'w') ? 6 : k === 'r' ? dist * 1.6 : dist);
    }
    return ex;
  }
  function cellOk(i){ const v = D.cells[i], r = v & 15; return isRoad(v) && (!r || regionOk(D.regions[r - 1].id)); }
  function dijkstra(from, ex){
    const dist = new Float64Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1);
    const heap = [[0, from]]; dist[from] = 0;
    const push = (d, i) => { heap.push([d, i]); let c = heap.length - 1; while(c){ const pa = (c - 1) >> 1; if(heap[pa][0] <= heap[c][0]) break; [heap[pa], heap[c]] = [heap[c], heap[pa]]; c = pa; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if(heap.length){ heap[0] = last; let c = 0; for(;;){ const l = 2 * c + 1, r = l + 1; let m = c; if(l < heap.length && heap[l][0] < heap[m][0]) m = l; if(r < heap.length && heap[r][0] < heap[m][0]) m = r; if(m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
    while(heap.length){
      const [d, u] = pop(); if(d > dist[u]) continue;
      const ux = u % GW, uy = (u / GW) | 0;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
        if(!dx && !dy) continue; const x = ux + dx, y = uy + dy; if(x < 0 || y < 0 || x >= GW || y >= GH) continue;
        const v = y * GW + x; if(!cellOk(v)) continue;
        const nd = d + (dx && dy ? 1.414 : 1); if(nd < dist[v]){ dist[v] = nd; prev[v] = u; push(nd, v); }
      }
      for(const [v, w] of ex[u] || []){ const nd = d + w; if(nd < dist[v]){ dist[v] = nd; prev[v] = u; push(nd, v); } }
    }
    return { dist, prev };
  }
  const cellPath = (prev, from, to) => { const p = [to]; while(p[0] !== from){ const u = prev[p[0]]; if(u < 0) return null; p.unshift(u); } return p; };
  function startPlace(){
    if(S.mFrom && P[S.mFrom] && visible(P[S.mFrom])) return S.mFrom;
    const t = S.town && M.townPlace(S.town);
    if(t && visible(t) && t.x != null) return t.id;
    return BASE[S.lord][1];
  }
  function planRoute(stops){
    const ex = extraEdges(), from = startPlace();
    const order = [], miss = []; let cur = from, cells = [cellOf(P[from])];
    const left = stops.filter(id => id !== from && P[id] && P[id].x != null);
    while(left.length){
      const { dist, prev } = dijkstra(cellOf(P[cur]), ex);
      left.sort((a, b) => dist[cellOf(P[a])] - dist[cellOf(P[b])]);
      const nxt = left.shift();
      if(!isFinite(dist[cellOf(P[nxt])])){ miss.push(nxt, ...left); break; }
      cells = cells.concat(cellPath(prev, cellOf(P[cur]), cellOf(P[nxt])).slice(1)); order.push(nxt); cur = nxt;
    }
    const onPath = new Map(cells.map((c, i) => [c, i]));
    const via = D.places.filter(p => p.x != null && visible(p) && p.id !== from && !order.includes(p.id) && p.k !== 'search' && snap(p) >= 0 && onPath.has(snap(p)))
      .sort((a, b) => onPath.get(snap(a)) - onPath.get(snap(b))).map(p => p.id);
    let len = 0; for(let i = 1; i < cells.length; i++){ const a = cells[i - 1], b = cells[i]; len += Math.hypot((a % GW) - (b % GW), ((a / GW) | 0) - ((b / GW) | 0)); }
    const nodes = Math.max(cells.filter(c => (D.cells[c] >> 4) === 7).length + via.length + order.length, Math.round(len / 7));
    return { from, stops: order, miss, via, nodes, pts: cells.map(c => [(c % GW) + .5, ((c / GW) | 0) + .5]) };
  }
  function shopStops(){
    const sp = shoppingPlan(), ids = [];
    for(const b of sp.byTown){ const p = M.townPlace(b.town); if(p && !ids.includes(p.id)) ids.push(p.id); }
    return ids;
  }

  // ---------- rendu de l'onglet ----------
  M.render = () => {
    if(!M.ready){ setList(`<p class="empty">${M.error ? 'La carte n’a pas pu se charger. Vérifie ta connexion puis rouvre cet onglet.' : 'Chargement de la carte…'}</p>`); return; }
    const q = norm(S.q.trim());
    let html = '';
    // recherche d'objets et de lieux
    if(q.length >= 2){
      const items = [...IDX.values()].filter(e => normItem(e.name).includes(q) || (e.gift && norm(GIFTS[e.gift][1]).includes(q))).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 14);
      const places = D.places.filter(p => visible(p) && norm(p.n).includes(q)).slice(0, 8);
      html += `<div class="alsofound mres"><h3>Sur la carte</h3>
        ${items.length ? `<div class="af"><small>Objets</small><div class="who-list">${items.map(e => `<button type="button" class="who-btn" data-mitem="${esc(e.key)}" aria-pressed="${S.mapItem === e.key}">${itemLabel(e)} <small>${e.at.length} lieu${e.at.length > 1 ? 'x' : ''}</small></button>`).join('')}</div></div>` : ''}
        ${places.length ? `<div class="af"><small>Lieux</small><div class="who-list">${places.map(p => `<button type="button" class="who-btn" data-mplace="${p.id}">${pix(KIND[p.k][1])}${esc(p.n)}</button>`).join('')}</div></div>` : ''}
        ${!items.length && !places.length ? '<p class="hint2">Rien sur la carte ne correspond. Essaie le nom anglais de l’objet.</p>' : ''}</div>`;
    }
    if(!S.regions) html += `<div class="note mfog">${pix('lens')} Seules tes régions de départ sont dévoilées. Coche les régions que tu as atteintes pour afficher leurs lieux. <button type="button" class="linkbtn" data-mregs-open>Choisir mes régions</button></div>`;
    html += `<div class="mapbar"><div class="mk-filters" role="group" aria-label="Types de lieux affichés">${FILTERS.map(([id, kinds, ic, label]) => `<button type="button" class="mkf" data-mkind="${id}" aria-pressed="${S.mapKinds.includes(kinds[0])}" title="${label}" aria-label="${label}">${pix(ic)}</button>`).join('')}</div>
      <div class="mtoggles"><button type="button" class="btn" data-museful aria-pressed="${S.mUseful}" title="Villes où trouver des cadeaux adorés par tes personnages qui ont encore besoin de soutien">⇈ Utile</button><button type="button" class="btn" data-mfast aria-pressed="${S.mFast}" title="Carrosses et Portes des Dieux">Voyage rapide</button><button type="button" class="btn" data-mnames aria-pressed="${S.mNames}" title="Afficher les noms des lieux quand il y a la place">Noms</button></div></div>
      <div class="map-view" tabindex="0" aria-label="Carte du monde. Glisse pour te déplacer, pince ou utilise les boutons pour zoomer.">
        <div class="map-stage" style="width:${GW}px;height:${GH}px"><canvas class="map-canvas" width="${GW}" height="${GH}" style="width:${GW}px;height:${GH}px"></canvas><canvas class="map-canvas-hd" width="${GW * HD}" height="${GH * HD}" style="width:${GW}px;height:${GH}px"></canvas><svg class="map-roads" viewBox="0 0 ${GW} ${GH}" width="${GW}" height="${GH}" aria-hidden="true"></svg></div>
        <div class="map-pins"></div>
        <div class="map-ctrl"><button type="button" data-mzoom="1.6" aria-label="Zoomer">+</button><button type="button" data-mzoom="0.625" aria-label="Dézoomer">−</button><button type="button" data-mfit aria-label="Voir toute la carte">⌂</button></div>
      </div>`;
    // objet sélectionné
    if(S.mapItem && IDX.get(S.mapItem)){
      const e = IDX.get(S.mapItem);
      const rows = e.at.map(a => ({ a, p: P[a.id] })).sort((x, y) => visible(y.p) - visible(x.p) || x.p.n.localeCompare(y.p.n));
      html += `<div class="where mitem"><h3>${e.gift ? pix(GIFTS[e.gift][2]) : pix('lens')} Où trouver ${itemLabel(e)}</h3>
        <div class="who-list">${rows.map(({ a, p }) => visible(p) ? `<button type="button" class="who-btn" data-mplace="${p.id}">${pix(KIND[p.k][1])}${esc(p.n)} <small>${esc(a.how)}</small></button>` : `<span class="who-btn dim">${pix('lens')}Région non cochée <small>${esc(a.how)}</small></span>`).join('')}</div>
        <div class="acts">${e.gift ? `<button type="button" class="btn" data-gift="${e.gift}">Fiche du cadeau</button>` : ''}<button type="button" class="linkbtn" data-mclear>Effacer la recherche</button></div></div>`;
    }
    html += routeBlock() + regionsBlock() + `<p class="map-credit">${esc(D.note)} Le jeu fait foi.</p>`;
    setList(html);
    mount();
  };

  function routeBlock(){
    const towns = D.places.filter(p => p.k === 'town' && visible(p) && p.x != null).sort((a, b) => a.n.localeCompare(b.n));
    const dests = D.places.filter(p => visible(p) && p.x != null).sort((a, b) => a.n.localeCompare(b.n));
    const from = startPlace();
    let res = '';
    if(S.route){
      const R = S.route;
      res = `<ol class="mstops"><li><button type="button" class="who-btn" data-mplace="${R.from}">${pix(KIND[P[R.from].k][1])}${esc(P[R.from].n)}</button> <small>départ</small></li>${R.stops.map((id, i) => `<li><button type="button" class="who-btn" data-mplace="${id}">${pix(KIND[P[id].k][1])}${esc(P[id].n)}</button> <small>étape ${i + 1}</small></li>`).join('')}</ol>
        ${R.via.length ? `<p class="hint2">En passant par ${R.via.slice(0, 8).map(id => esc(P[id].n)).join(', ')}${R.via.length > 8 ? '…' : ''}.</p>` : ''}
        <p class="hint2">Environ ${R.nodes} nœud${R.nodes > 1 ? 's' : ''} sur la carte, soit à peu près ${Math.max(1, Math.ceil(R.nodes / 3))} tour${Math.ceil(R.nodes / 3) > 1 ? 's' : ''} : on avance de trois nœuds par tour au plus. Estimation d’après la carte, le jeu fait foi.${R.miss.length ? ` Hors d’atteinte avec tes régions cochées : ${R.miss.map(id => esc(P[id].n)).join(', ')}.` : ''}</p>
        <button type="button" class="linkbtn" data-mrclear>Effacer l’itinéraire</button>`;
    }
    return `<details class="grp" data-g="mroute" ${openState.mroute === false ? '' : 'open'}><summary><h2 class="disp">Itinéraire</h2></summary>
      <div class="mroute">
        <label>Départ <select data-mfrom>${towns.map(p => `<option value="${p.id}" ${p.id === from ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select></label>
        <label>Arrivée <select data-mto><option value="">choisir…</option>${dests.map(p => `<option value="${p.id}" ${S.mTo === p.id ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select></label>
        <div class="acts"><button type="button" class="btn" data-mshop>Tournée des courses</button></div>
      </div>${res || '<p class="hint2">Choisis une arrivée, ou trace la tournée qui passe par les villes de ta liste de courses.</p>'}</details>`;
  }
  function regionsBlock(){
    const ok = reached(), base = BASE[S.lord][0];
    return `<details class="grp" data-g="mreg" ${openState.mreg ? 'open' : ''}><summary><h2 class="disp">Régions atteintes</h2><span class="cnt">${ok.length}/${D.regions.length}</span></summary>
      <p class="hint">Les régions non cochées restent dans le brouillard, sans lieux ni noms, pour éviter les spoilers. Elles sont aussi exclues de la liste de courses et des itinéraires.</p>
      <div class="mregs">${D.regions.map(r => `<label><input type="checkbox" data-mregion="${r.id}" ${ok.includes(r.id) ? 'checked' : ''}> ${esc(r.n)}${r.id === base ? ' <small>départ</small>' : ''}</label>`).join('')}</div>
      <label class="mspoil"><input type="checkbox" data-mspoil ${S.spoil ? 'checked' : ''}> Montrer les lieux d’histoire et de fin de jeu (spoilers)</label></details>`;
  }

  // ---------- carte : montage, vue, épingles ----------
  function mount(){
    viewEl = document.querySelector('.map-view'); if(!viewEl) return;
    stageEl = viewEl.querySelector('.map-stage'); pinsEl = viewEl.querySelector('.map-pins');
    const stack = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--top-h')) || 0) + (document.querySelector('.bar') ? document.querySelector('.bar').offsetHeight : 0);
    const avail = window.innerHeight - stack - 24, ideal = Math.round(viewEl.clientWidth * GH / GW);
    viewEl.style.height = Math.max(260, Math.min(ideal, Math.round(isSheet() ? avail * .8 : avail - 30))) + 'px';
    const pal = paint(viewEl.querySelector('.map-canvas'));
    viewEl.style.background = `rgb(${pal.cloud.join(',')})`;
    viewEl.classList.toggle('mv-dark', pal.label === 'dark');
    const RC = isRetro() ? (isNight() ? ['#E4DCC2', '#070B26'] : ['#FFF8DE', '#3A2A12']) : (isNight() ? ['#D8CCAA', '#0B0D14'] : ['#FBF3D8', '#4A3622']);
    viewEl.style.setProperty('--rc', RC[0]); viewEl.style.setProperty('--rk', RC[1]);
    if(S.mapSel) townLinks(S.mapSel); else hlPaths = [];
    drawRoads();
    buildPins();
    if(needFit || !view) fit(); else apply();
    bind();
  }
  const smooth = (pts, it = 2) => { for(let n = 0; n < it && pts.length > 2; n++){ const o = [pts[0]]; for(let j = 0; j < pts.length - 1; j++){ const [x1, y1] = pts[j], [x2, y2] = pts[j + 1]; o.push([.75 * x1 + .25 * x2, .75 * y1 + .25 * y2], [.25 * x1 + .75 * x2, .25 * y1 + .75 * y2]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
  const dOf = pts => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L');
  function drawRoads(){
    const svg = viewEl.querySelector('.map-roads'), regOk = r => !r || regionOk(D.regions[r - 1].id);
    const d = { 1: '', 2: '', 3: '' };
    for(const ln of D.roads.lines){
      const lv = ln[0]; if(!regOk(ln[1])) continue;
      let seg = 'M'; for(let j = 2; j < ln.length; j += 2) seg += (j > 2 ? 'L' : '') + (ln[j] / 10) + ' ' + (ln[j + 1] / 10);
      d[lv] += seg;
    }
    let dots1 = '', dots2 = '';
    for(const [lv, r, x, y] of D.roads.dots){ if(!regOk(r)) continue; const m = `M${x / 10} ${y / 10}h0`; if(lv === 1) dots1 += m; else dots2 += m; }
    let extra = '';
    for(const [a, b, k] of D.routes){
      const A = P[a], B = P[b];
      if(k === 'r' || !visible(A) || !visible(B) || A.x == null || B.x == null) continue;
      if((k === 'c' || k === 'w') && !S.mFast) continue;
      const cls = (k === 'd' || k === 'D') ? 'd' : (k === 's' || k === 'S') ? 's' : k;
      extra += `<line x1="${(A.x * GW).toFixed(1)}" y1="${(A.y * GH).toFixed(1)}" x2="${(B.x * GW).toFixed(1)}" y2="${(B.y * GH).toFixed(1)}" class="mr-${cls}"/>`;
    }
    let hi = '';
    const focus = (S.route && S.route.pts.length > 1) || hlPaths.length;
    for(const pts of hlPaths){ const dd = dOf(pts); hi += `<path d="${dd}" class="mr-hlc"/><path d="${dd}" class="mr-hl"/>`; }
    if(S.route && S.route.pts.length > 1){ const dd = dOf(smooth(S.route.pts)); hi += `<path d="${dd}" class="mr-pathc"/><path d="${dd}" class="mr-path"/>`; }
    svg.classList.toggle('focus', !!focus);
    svg.innerHTML = `<path d="${d[3]}" class="mr-minor"/>`
      + `<path d="${d[2]}" class="mr-acase"/><path d="${d[1]}" class="mr-mcase"/>`
      + `<path d="${d[2]}" class="mr-acore"/><path d="${d[1]}" class="mr-mcore"/>`
      + `<path d="${dots2}" class="mr-adotc"/><path d="${dots2}" class="mr-adot"/><path d="${dots1}" class="mr-dotc"/><path d="${dots1}" class="mr-dot"/>`
      + extra + hi;
  }
  // routes allumées : le réseau autour d'une ville sélectionnée, jusqu'aux villes voisines
  let hlPaths = [];
  function townLinks(id){
    hlPaths = [];
    const p = P[id]; if(!p || p.k !== 'town' || p.x == null) return;
    const start = snap(p); if(start < 0) return;
    const stop = new Set();
    for(const t of D.places){
      if(t.k !== 'town' || t.id === id || t.x == null || !visible(t)) continue;
      const pts = [snap(t), Math.floor(t.y * GH) * GW + Math.floor(t.x * GW)];
      for(const c of pts){ if(c < 0) continue; const cx = c % GW, cy = (c / GW) | 0;
        for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const X = cx + dx, Y = cy + dy; if(X >= 0 && Y >= 0 && X < GW && Y < GH) stop.add(Y * GW + X); } }
    }
    const depth = new Map([[start, 0]]), q = [start];
    for(let h = 0; h < q.length; h++){
      const u = q[h], d = depth.get(u);
      if((u !== start && stop.has(u)) || d >= 32) continue;
      const ux = u % GW, uy = (u / GW) | 0;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
        if(!dx && !dy) continue; const x = ux + dx, y = uy + dy; if(x < 0 || y < 0 || x >= GW || y >= GH) continue;
        const v = y * GW + x; if(depth.has(v) || !cellOk(v)) continue; depth.set(v, d + 1); q.push(v);
      }
    }
    const inSet = (x, y) => { const cx = Math.floor(x), cy = Math.floor(y); for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++) if(depth.has((cy + dy) * GW + cx + dx)) return true; return false; };
    for(const ln of D.roads.lines){
      if(ln[0] !== 1) continue;
      let hit = 0, tot = 0;
      for(let j = 2; j < ln.length; j += 2){ tot++; if(inSet(ln[j] / 10, ln[j + 1] / 10)) hit++; }
      if(tot && hit / tot >= .7){ const pts = []; for(let j = 2; j < ln.length; j += 2) pts.push([ln[j] / 10, ln[j + 1] / 10]); hlPaths.push(pts); }
    }
  }
  function buildPins(){
    const useful = usefulByPlace(), item = S.mapItem && IDX.get(S.mapItem);
    const hl = new Set(item ? item.at.map(a => a.id) : []);
    const stops = S.route ? [S.route.from, ...S.route.stops] : [];
    let h = '';
    for(const p of D.places){
      if(p.x == null || !visible(p)) continue;
      const shown = S.mapKinds.includes(p.k) || hl.has(p.id) || stops.includes(p.id) || S.mapSel === p.id;
      if(!shown) continue;
      const u = useful[p.id], si = stops.indexOf(p.id);
      const cls = ['mpin', 'k-' + p.k, p.k === 'town' ? '' : 'minor', S.mapSel === p.id ? 'sel' : '', hl.has(p.id) ? 'hl' : '', si >= 0 ? 'stop' : '', item && !hl.has(p.id) ? 'dim' : ''].join(' ');
      h += `<button type="button" class="${cls}" data-place="${p.id}" data-x="${p.x * GW}" data-y="${p.y * GH}" aria-label="${esc(p.n)}, ${KIND[p.k][0]}${u ? `, ${u} cadeau${u > 1 ? 'x' : ''} utile${u > 1 ? 's' : ''}` : ''}">${pix(KIND[p.k][1])}${u ? `<span class="mb">⇈${u}</span>` : ''}${si >= 0 ? `<span class="ms">${si === 0 ? 'D' : si}</span>` : ''}<span class="pl">${esc(p.n)}</span></button>`;
    }
    pinsEl.innerHTML = h;
  }
  function fit(){
    const w = viewEl.clientWidth, h = viewEl.clientHeight;
    const s = Math.min(w / GW, h / GH);
    view = { s, s0: s, tx: (w - GW * s) / 2, ty: (h - GH * s) / 2 };
    needFit = false; apply();
  }
  function clamp(){
    const w = viewEl.clientWidth, h = viewEl.clientHeight;
    view.s = Math.max(view.s0 * .9, Math.min(Math.max(view.s0 * 4, 7), view.s));
    const mw = GW * view.s, mh = GH * view.s;
    view.tx = mw <= w ? (w - mw) / 2 : Math.min(40, Math.max(w - mw - 40, view.tx));
    view.ty = mh <= h ? (h - mh) / 2 : Math.min(40, Math.max(h - mh - 40, view.ty));
  }
  function apply(){
    if(!view || !stageEl) return;
    clamp();
    stageEl.style.transform = `translate(${view.tx}px,${view.ty}px) scale(${view.s})`;
    viewEl.style.setProperty('--s', view.s);
    viewEl.classList.toggle('z1', view.s >= view.s0 * 1.5);
    viewEl.classList.toggle('z2', view.s >= view.s0 * 2.2);
    viewEl.classList.toggle('z3', view.s >= view.s0 * 3.4);
    for(const el of pinsEl.children) el.style.transform = `translate(${(+el.dataset.x * view.s + view.tx).toFixed(1)}px,${(+el.dataset.y * view.s + view.ty).toFixed(1)}px)`;
    const hd = view.s >= 4.5;
    if(hd) paintHD();
    viewEl.classList.toggle('hd', hd);
    scheduleLabels();
  }
  // ---------- relief lissé : chaque classe de terrain est interpolée, la frontière tombe entre les cases ----------
  function paintHD(){
    const key = [isNight(), isRetro(), reached().join()].join('|');
    if(key === hdKey) return; hdKey = key;
    const cv = viewEl.querySelector('.map-canvas-hd'); if(!cv) return;
    const pal = palette(), c = D.cells, reg = D.regions, ok = reached(), FW = GW * HD, FH = GH * HD;
    const base = new Uint8Array(GW * GH);
    for(let i = 0; i < GW * GH; i++){ const k = c[i] >> 4; base[i] = k >= 8 ? k - 8 : k; }
    const fine = new Uint8Array(FW * FH), w = new Float32Array(6);
    for(let Y = 0; Y < FH; Y++){
      const v = (Y + .5) / HD - .5, j0 = Math.floor(v), fv = v - j0;
      for(let X = 0; X < FW; X++){
        const u = (X + .5) / HD - .5, i0 = Math.floor(u), fu = u - i0;
        w.fill(0);
        for(let dj = 0; dj <= 1; dj++) for(let di = 0; di <= 1; di++){
          const x = Math.min(GW - 1, Math.max(0, i0 + di)), y = Math.min(GH - 1, Math.max(0, j0 + dj));
          w[base[y * GW + x]] += (di ? fu : 1 - fu) * (dj ? fv : 1 - fv);
        }
        let b = 0; for(let k = 1; k < 6; k++) if(w[k] > w[b]) b = k;
        fine[Y * FW + X] = b;
      }
    }
    const ctx = cv.getContext('2d'), img = ctx.createImageData(FW, FH);
    const at = (X, Y) => (X < 0 || Y < 0 || X >= FW || Y >= FH) ? 1 : fine[Y * FW + X];
    for(let Y = 0; Y < FH; Y++) for(let X = 0; X < FW; X++){
      const k = fine[Y * FW + X], cx = Math.min(GW - 1, (X / HD) | 0), cy = Math.min(GH - 1, (Y / HD) | 0), r = c[cy * GW + cx] & 15, h = hash(X, Y), o = (Y * FW + X) * 4;
      let col;
      if(k === 0){
        let shore = false; for(let d = 1; d <= 2 && !shore; d++) shore = at(X - d, Y) >= 2 || at(X + d, Y) >= 2 || at(X, Y - d) >= 2 || at(X, Y + d) >= 2;
        col = shore ? mix(pal.shore, pal.water, .25) : pal.water;
      } else if(k === 1){ col = h > .9 ? pal.cloud2 : pal.cloud; }
      else {
        col = k === 3 ? mix(pal.land[3], pal.forest2, hash(X >> 1, Y >> 1)) : pal.land[k];
        const t = (hash(X >> 1, Y >> 1) - .5) * .06; col = col.map(z => Math.max(0, Math.min(255, Math.round(z * (1 + t)))));
        if(at(X - 1, Y) === 0 || at(X + 1, Y) === 0 || at(X, Y - 1) === 0 || at(X, Y + 1) === 0) col = col.map(z => Math.round(z * pal.coast));
        if(r && !ok.includes(reg[r - 1].id)){ const g = Math.round(col[0] * .3 + col[1] * .59 + col[2] * .11); col = mix(mix(col, [g, g, g], .75), pal.fog[0], .45); }
      }
      img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  // ---------- noms : placés seulement s'ils ne chevauchent ni un autre nom ni une icône ----------
  let labelRaf = 0;
  const labelW = {}; let measureCtx = null;
  function textW(t){
    if(labelW[t]) return labelW[t];
    if(!measureCtx){ measureCtx = document.createElement('canvas').getContext('2d'); }
    measureCtx.font = isRetro() ? '400 14px "Jersey 15", sans-serif' : '600 12px "Alegreya Sans", sans-serif';
    return labelW[t] = measureCtx.measureText(t).width + 6;
  }
  function scheduleLabels(){ if(labelRaf) return; labelRaf = requestAnimationFrame(() => { labelRaf = 0; layoutLabels(); }); }
  function layoutLabels(){
    if(!pinsEl || !view) return;
    const W0 = viewEl.clientWidth, H0 = viewEl.clientHeight, placed = [], pins = [];
    const imp = new Set(['dagsion', 'grand-aragon', 'megaira', 'ribeira', 'fina', 'kassite']);
    for(const el of pinsEl.children){
      el.classList.remove('lv');
      if(getComputedStyle(el).display === 'none') continue;
      const x = +el.dataset.x * view.s + view.tx, y = +el.dataset.y * view.s + view.ty;
      if(x < -40 || y < -40 || x > W0 + 40 || y > H0 + 40) continue;
      const town = el.classList.contains('k-town'), sz = town && viewEl.classList.contains('z2') ? 24 : 16;
      placed.push([x - sz / 2, y - sz / 2, x + sz / 2, y + sz / 2, el]);
      const forced = el.classList.contains('sel') || el.classList.contains('hl') || el.classList.contains('stop');
      const pr = forced ? 0 : imp.has(el.dataset.place) ? 1 : el.querySelector('.mb') ? 2 : town ? 3 : 4;
      pins.push({ el, x, y, sz, pr, forced, town });
    }
    pins.sort((a, b) => a.pr - b.pr);
    const z3 = viewEl.classList.contains('z3');
    const z1 = viewEl.classList.contains('z1'), z2 = viewEl.classList.contains('z2'), pad = z2 ? 4 : 8;
    for(const p of pins){
      if(!p.forced && (!S.mNames || (!p.town && !z3))) continue;
      if(!p.forced && !z1 && p.pr > 2) continue; // vue d'ensemble : villes importantes et utiles seulement
      const lab = p.el.querySelector('.pl'); if(!lab) continue;
      const w = textW(lab.textContent), hgt = isRetro() ? 15 : 14;
      const box = [p.x - w / 2, p.y + p.sz / 2 + .5, p.x + w / 2, p.y + p.sz / 2 + .5 + hgt];
      const big = [box[0] - pad, box[1] - pad / 2, box[2] + pad, box[3] + pad / 2];
      if(!p.forced && placed.some(b => b[4] !== p.el && !(big[2] < b[0] || big[0] > b[2] || big[3] < b[1] || big[1] > b[3]))) continue;
      placed.push(box); p.el.classList.add('lv');
    }
  }
  function zoomAt(f, cx, cy){
    const s = view.s; view.s = s * f; clamp();
    const k = view.s / s; view.tx = cx - (cx - view.tx) * k; view.ty = cy - (cy - view.ty) * k; apply();
  }
  function focusOn(ids, zoom){
    const pts = ids.map(id => P[id]).filter(p => p && p.x != null); if(!pts.length || !viewEl) return;
    const xs = pts.map(p => p.x * GW), ys = pts.map(p => p.y * GH);
    const w = viewEl.clientWidth, h = viewEl.clientHeight;
    const bw = Math.max(30, Math.max(...xs) - Math.min(...xs)), bh = Math.max(24, Math.max(...ys) - Math.min(...ys));
    view.s = zoom || Math.min(w / (bw + 30), h / (bh + 30), view.s0 * 4);
    view.tx = w / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 * view.s;
    view.ty = h / 2 - (Math.min(...ys) + Math.max(...ys)) / 2 * view.s;
    apply();
  }

  function focusPts(pts){
    if(!viewEl || !pts.length) return;
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), w = viewEl.clientWidth, h = viewEl.clientHeight;
    const bw = Math.max(30, Math.max(...xs) - Math.min(...xs)), bh = Math.max(24, Math.max(...ys) - Math.min(...ys));
    view.s = Math.min(w / (bw + 24), h / (bh + 24), view.s0 * 4);
    view.tx = w / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 * view.s; view.ty = h / 2 - (Math.min(...ys) + Math.max(...ys)) / 2 * view.s; apply();
  }

  // ---------- gestes ----------
  let bound = null;
  function bind(){
    if(bound === viewEl) return; bound = viewEl;
    const pts = new Map(); let start = null, moved = false;
    viewEl.addEventListener('pointerdown', e => {
      if(e.target.closest('.map-ctrl')) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      start = { tx: view.tx, ty: view.ty, s: view.s, pts: new Map([...pts].map(([k, v]) => [k, { ...v }])) };
      moved = false;
    });
    viewEl.addEventListener('pointermove', e => {
      if(!pts.has(e.pointerId) || !start) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = viewEl.getBoundingClientRect();
      if(pts.size === 1){
        const p0 = start.pts.get(e.pointerId); if(!p0) return;
        const dx = e.clientX - p0.x, dy = e.clientY - p0.y;
        if(!moved && Math.hypot(dx, dy) < 6) return;
        if(!moved){ moved = true; viewEl.classList.add('drag'); try { viewEl.setPointerCapture(e.pointerId); } catch(err) {} }
        view.tx = start.tx + dx; view.ty = start.ty + dy; apply();
      } else if(pts.size === 2){
        const [a, b] = [...pts.values()], ids = [...pts.keys()];
        const a0 = start.pts.get(ids[0]), b0 = start.pts.get(ids[1]); if(!a0 || !b0) return;
        moved = true;
        const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y) || 1, d1 = Math.hypot(a.x - b.x, a.y - b.y);
        const mx0 = (a0.x + b0.x) / 2 - r.left, my0 = (a0.y + b0.y) / 2 - r.top, mx1 = (a.x + b.x) / 2 - r.left, my1 = (a.y + b.y) / 2 - r.top;
        view.s = start.s * d1 / d0; const k = view.s / start.s;
        view.tx = mx1 - (mx0 - start.tx) * k; view.ty = my1 - (my0 - start.ty) * k; apply();
      }
    });
    const end = e => {
      pts.delete(e.pointerId);
      if(pts.size){ start = { tx: view.tx, ty: view.ty, s: view.s, pts: new Map([...pts].map(([k, v]) => [k, { ...v }])) }; }
      else { start = null; viewEl.classList.remove('drag'); }
    };
    viewEl.addEventListener('pointerup', end); viewEl.addEventListener('pointercancel', end);
    viewEl.addEventListener('click', e => { if(moved){ e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    viewEl.addEventListener('wheel', e => { e.preventDefault(); const r = viewEl.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX - r.left, e.clientY - r.top); }, { passive: false });
    viewEl.addEventListener('keydown', e => {
      const st = 40, w = viewEl.clientWidth / 2, h = viewEl.clientHeight / 2;
      if(e.key === 'ArrowLeft'){ view.tx += st; apply(); } else if(e.key === 'ArrowRight'){ view.tx -= st; apply(); }
      else if(e.key === 'ArrowUp'){ view.ty += st; apply(); } else if(e.key === 'ArrowDown'){ view.ty -= st; apply(); }
      else if(e.key === '+' || e.key === '='){ zoomAt(1.4, w, h); } else if(e.key === '-'){ zoomAt(1 / 1.4, w, h); } else return;
      e.preventDefault();
    });
  }
  window.addEventListener('resize', () => { if(S.tab === 'map' && M.ready && viewEl && document.body.contains(viewEl)){ needFit = true; mount(); } });

  // ---------- fiche d'un lieu ----------
  M.placePanel = id => {
    const p = P[id]; if(!p) return '';
    const tool = p.k === 'town' ? toolName(p) : null;
    const regionN = (D.regions.find(r => r.id === p.r) || {}).n || p.r;
    const need = needingChars();
    const loved = g => need.filter(c => { const t = tierOf(c, g); return t && t.t === 'L'; }).length;
    const chipFor = name => {
      const e = IDX.get(normItem(name));
      if(e && e.gift){ const n = loved(e.gift); return `<button type="button" class="who-btn" data-gift="${e.gift}">${pix(GIFTS[e.gift][2])}${esc(GIFTS[e.gift][1])}${n ? ` <span class="loved">⇈ ${n}</span>` : ''}</button>`; }
      return `<button type="button" class="who-btn" data-mitem="${esc(normItem(name))}">${esc(name)}</button>`;
    };
    const order = ['m', 'i', 'a', 'v'];
    const shops = order.filter(k => p.sh && p.sh[k]).map(k => {
      const list = p.sh[k].slice().sort((a, b) => !!GIFT_KEY[normItem(b)] - !!GIFT_KEY[normItem(a)]);
      return `<div class="where"><h3>${pix(k === 'm' ? 'shop' : k === 'a' ? 'weapons' : k === 'v' ? 'coin' : 'travel')} ${SHOP[k]}</h3><div class="who-list">${list.map(chipFor).join('')}</div></div>`;
    }).join('');
    const items = p.it && p.it.length ? `<div class="where"><h3>${pix(KIND[p.k][1])} ${HOW[p.k]}</h3><div class="who-list">${p.it.map(chipFor).join('')}</div></div>` : '';
    const nb = [];
    for(const [a, b, k] of D.routes){ const o = a === id ? b : b === id ? a : null; if(o && visible(P[o]) && !nb.some(x => x[0] === o)) nb.push([o, k]); }
    const KR = { r: 'route', d: 'piste du désert', D: 'piste du désert', s: 'voie maritime', S: 'voie maritime', c: 'carrosse', w: 'Porte des Dieux' };
    const pos = p.x == null ? 'Position inconnue : ce lieu n’est pas placé sur la carte.' : `Position ${p.pc === 2 ? 'confirmée par plusieurs captures' : p.pc === 1 ? 'tirée d’une seule source' : 'estimée'}.`;
    return `<div class="ph"><span class="grab" aria-hidden="true"></span><div><h2 class="disp" id="pTitle" tabindex="-1">${pix(KIND[p.k][1], 'x2')} ${esc(p.n)}</h2><p>${KIND[p.k][0]} · ${esc(regionN)}${p.lv ? ` · niveau ${p.lv}` : ''}</p></div><div class="ph-acts">${BACK_BTN}<button type="button" class="x" data-close aria-label="Fermer">✕</button></div></div>
      <div class="pb">
        <div class="acts mpacts">${tool ? `<button type="button" class="give" data-gotown="${esc(tool)}">Cadeaux de cette ville</button>` : ''}${p.x != null ? `<button type="button" class="btn" data-mroute-to="${p.id}">Itinéraire jusqu’ici</button><button type="button" class="btn" data-mfocus="${p.id}">Voir sur la carte</button>` : ''}</div>
        ${p.id === 'dagsion' ? '<p class="hint2">Le Marché de Dagsion correspond sans doute à la « Galerie marchande » de l’outil. La Taverne de la ville basse a un stock à part, non relevé.</p>' : ''}
        ${p.id === 'ribeira' ? '<p class="hint2">Aucune source ne mentionne de colporteur à Ribeira : à vérifier en jeu.</p>' : ''}
        ${shops}${items}
        ${!shops && !items ? '<p class="hint2">Aucun objet relevé ici pour l’instant.</p>' : ''}
        ${nb.length ? `<div class="where"><h3>${pix('horse')} Voisins</h3><div class="who-list">${nb.map(([o, k]) => `<button type="button" class="who-btn" data-mplace="${o}">${pix(KIND[P[o].k][1])}${esc(P[o].n)} <small>${KR[k] || 'route'}</small></button>`).join('')}</div></div>` : ''}
        <p class="hint2" style="margin-top:12px">${pos} ${p.c === 2 ? 'Lieu confirmé par plusieurs sources.' : 'Lieu tiré d’une seule source.'} Données de fans : le jeu fait foi.</p>
      </div>`;
  };

  // ---------- recherche depuis le reste de l'outil ----------
  M.search = q => {
    if(!M.ready || q.length < 2) return [];
    return [...IDX.values()].filter(e => !e.gift && normItem(e.name).includes(q)).slice(0, 6);
  };
  M.showItem = key => {
    if(!M.ready) return;
    S.mapItem = key; S.mapSel = null;
    goTab('map');
    const e = IDX.get(key); if(e) focusOn(e.at.map(a => a.id).filter(id => visible(P[id])));
  };
  M.giftKey = g => {
    if(!M.ready) return null;
    for(const e of IDX.values()) if(e.gift === g) return e.key;
    return null;
  };
  M.selectPlace = id => {
    S.mapSel = id;
    townLinks(id);
    if(S.tab === 'map' && viewEl){ drawRoads(); buildPins(); apply(); }
    lastFocus = null; openPanel('p', id);
  };

  // ---------- clics et changements ----------
  M.click = e => {
    const t = e.target;
    const mk = t.closest('[data-mkind]');
    if(mk){ const f = FILTERS.find(x => x[0] === mk.dataset.mkind); const on = S.mapKinds.includes(f[1][0]);
      S.mapKinds = on ? S.mapKinds.filter(x => !f[1].includes(x)) : [...new Set([...S.mapKinds, ...f[1]])]; store.set('mapKinds', S.mapKinds); M.render(); return true; }
    if(t.closest('[data-mregs-open]')){ openState.mreg = true; store.set('open', openState); M.render(); const d = document.querySelector('[data-g="mreg"]'); if(d) d.scrollIntoView({ block: 'start', behavior: 'smooth' }); return true; }
    if(t.closest('[data-museful]')){ S.mUseful = !S.mUseful; store.set('mUseful', S.mUseful); M.render(); return true; }
    if(t.closest('[data-mnames]')){ S.mNames = !S.mNames; store.set('mNames', S.mNames); t.closest('[data-mnames]').setAttribute('aria-pressed', S.mNames); layoutLabels(); return true; }
    if(t.closest('[data-mfast]')){ S.mFast = !S.mFast; store.set('mFast', S.mFast); if(S.route) recompute(); M.render(); return true; }
    const z = t.closest('[data-mzoom]'); if(z){ zoomAt(+z.dataset.mzoom, viewEl.clientWidth / 2, viewEl.clientHeight / 2); return true; }
    if(t.closest('[data-mfit]')){ fit(); return true; }
    const it = t.closest('[data-mitem]');
    if(it){ const k = it.dataset.mitem; S.mapItem = S.mapItem === k && S.tab === 'map' ? null : k; if(S.tab !== 'map') goTab('map'); else M.render(); const en = IDX.get(k); if(S.mapItem && en) focusOn(en.at.map(a => a.id).filter(id => visible(P[id]))); return true; }
    if(t.closest('[data-mclear]')){ S.mapItem = null; S.q = ''; $('#q').value = ''; M.render(); return true; }
    const mp = t.closest('[data-mplace], .map-pins [data-place]');
    if(mp){ const id = mp.dataset.mplace || mp.dataset.place; if(!mp.closest('.map-view') && S.tab === 'map') focusOn([id], Math.max(view.s, view.s0 * 3)); M.selectPlace(id); return true; }
    if(t.closest('[data-mshop]')){ S.route = Object.assign(planRoute(shopStops()), { shop: true }); M.render(); if(S.route.pts.length > 1) focusPts(S.route.pts); return true; }
    if(t.closest('[data-mrclear]')){ S.route = null; S.mTo = ''; M.render(); return true; }
    return false;
  };
  M.panelClick = e => {
    const t = e.target;
    const rt = t.closest('[data-mroute-to]');
    if(rt){ S.mTo = rt.dataset.mrouteTo; S.route = planRoute([S.mTo]); if(isSheet()) closePanel(); if(S.tab !== 'map') goTab('map'); else M.render(); if(S.route.pts.length > 1) focusPts(S.route.pts); return true; }
    const fo = t.closest('[data-mfocus]');
    if(fo){ const id = fo.dataset.mfocus; S.mapSel = id; if(isSheet()) closePanel(); if(S.tab !== 'map') goTab('map'); else { buildPins(); apply(); } focusOn([id], view ? Math.max(view.s, view.s0 * 3) : 0); return true; }
    const it = t.closest('[data-mitem]'); if(it){ M.showItem(it.dataset.mitem); if(isSheet()) closePanel(); return true; }
    const mp = t.closest('[data-mplace]'); if(mp){ M.selectPlace(mp.dataset.mplace); return true; }
    return false;
  };
  function recompute(){ if(!S.route) return; S.route = S.route.shop ? Object.assign(planRoute(shopStops()), { shop: true }) : planRoute([S.mTo]); }
  M.change = e => {
    const t = e.target;
    if(t.matches('[data-mregion]')){
      const set = new Set(reached()); if(t.checked) set.add(t.dataset.mregion); else set.delete(t.dataset.mregion);
      S.regions = D.regions.map(r => r.id).filter(id => set.has(id)); store.set('regions', S.regions);
      recompute(); render(); return true;
    }
    if(t.matches('[data-mspoil]')){ S.spoil = t.checked; store.set('spoil', S.spoil); recompute(); render(); return true; }
    if(t.matches('[data-mfrom]')){ S.mFrom = t.value; if(S.route) recompute(); M.render(); return true; }
    if(t.matches('[data-mto]')){ S.mTo = t.value; S.route = S.mTo ? planRoute([S.mTo]) : null; M.render(); if(S.route && S.route.pts.length > 1) focusPts(S.route.pts); return true; }
    return false;
  };
  M.load();
})();
