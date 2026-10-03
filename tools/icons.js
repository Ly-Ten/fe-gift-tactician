// Icônes pixel art originales du Fil des cadeaux (dessinées pour ce projet, aucun asset Nintendo).
// Génère pixel-art.css (icônes de l'interface) et icons/*.png (icônes de l'application installable).
// Usage : node tools/icons.js   (depuis la racine du dépôt). Ajoute --preview pour un aperçu HTML.
const fs = require('fs');
const PAL = {
  k:'#1c1430', w:'#ffffff', W:'#d6d2e6', h:'#c4c8d8', g:'#8c90a8', G:'#565a74',
  y:'#f8d848', Y:'#c88c18', o:'#f89838', O:'#c05818', r:'#e84848', R:'#a02838',
  p:'#f8a0c0', P:'#c85888', b:'#5898f8', B:'#2c58c0', c:'#a8e0f8', n:'#b07040',
  N:'#6c3c1c', t:'#e8c088', e:'#58c060', E:'#287838', l:'#a8e878', v:'#b080f0',
  V:'#6040b0', s:'#f8d8b8', m:'#f8f0c8'
};
const blank = () => Array.from({length:16}, () => Array(16).fill('.'));
const fromRows = rows => rows.map(r => r.split(''));
const mirror = rows => rows.map(r => r + r.split('').reverse().join(''));
function outline(g, skip = ''){
  const out = g.map(r => r.slice());
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    if(g[y][x] !== '.') continue;
    const nb = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => { const c = (g[y+dy]||[])[x+dx]; return c && c !== '.' && c !== 'k' && !skip.includes(c); });
    if(nb) out[y][x] = 'k';
  }
  return out;
}
const I = {};
const def = (name, rows, opt = {}) => {
  if(opt.mirror) rows = mirror(rows);
  if(rows.length !== 16) throw new Error(name + ': ' + rows.length + ' rangées');
  rows.forEach((r, i) => { if(r.length !== 16) throw new Error(`${name} r${i}: longueur ${r.length} « ${r} »`);
    for(const ch of r) if(ch !== '.' && !PAL[ch]) throw new Error(`${name} r${i}: couleur inconnue ${ch}`); });
  let g = fromRows(rows);
  if(opt.outline) g = outline(g, opt.skip || '');
  if(opt.after) opt.after(g);
  I[name] = g.map(r => r.join(''));
};
const grid = (fn) => { const g = blank(); const set = (x, y, c) => { if(x >= 0 && x < 16 && y >= 0 && y < 16) g[y][x] = c; }; fn(set, g); return g.map(r => r.join('')); };
const E8 = '........', E16 = '................';

// ---------- catégories ----------
def('children', [E16,E16,
 '......rrrr......','......RRRR......','.......ww.......','.......wW.......','......wwwW......',
 '.....wwwwwW.....','.....bbbbbB.....','.....bwwwbB.....','.....bbbbbB.....','.....wwwwwW.....',
 '.....wwwwwW.....','.....WWWWWW.....',E16,E16], { outline:true });
def('sweets', [E16,E16,
 '.......rr.......','.......Rr.......','......pppp......','....pwpppppp....','...pwppppppPp...',
 '...PPPPPPPPPP...','....nNnNnNnN....','....nNnNnNnN....','....nNnNnNnN....','.....nNnNnN.....',
 '.....nNnNnN.....',E16,E16,E16], { outline:true });
def('cooking', [E16,E16,
 '...kkkkkk.......','..kGGGGGGk......','.kGggggggGk.....','kGgwwwwgggGk....','kGwwwwwwggGk....',
 'kGwwyywwggGk....','kGwyyyywggGkkkkk','kGwyyyywggGknnnk','kGwwyywwggGkkkkk','kGgwwwwwggGk....',
 '.kGggggggGk.....','..kGGGGGGk......','...kkkkkk.......',E16]);
def('fermented', [E16,E16,
 '.......nN.......','.......wW.......','.......wW.......','......wwwW......','.....wwwwwW.....',
 '....wwwwwwwW....','....bbbbbbbB....','....bBbBbBbB....','....bbbbbbbB....','....wwwwwwwW....',
 '.....wwwwwW.....',E16,E16,E16], { outline:true });
def('coffee', [E16,
 '.....g....g.....','......g....g....','.....g....g.....',E16,
 '..kkkkkkkkkk....','.kwNNNNNNNNwk...','.kwwwwwwwwwWkkk.','.kwwwwwwwwwWk.k.','.kwwwwwwwwwWk.k.',
 '.kwwwwwwwwwWkkk.','..kwwwwwwwWk....','...kkkkkkkk.....','.kkWWWWWWWWWkk..','..kkkkkkkkkkk...',E16]);
def('tea', [E16,E16,E16,
 '.......EE.......','......eeee......','....EEEEEEEE....','...lleeeeeeeE.ee','e.lleeeeeeeeEe.e',
 'eelleeeeeeeeEe.e','.eeeeeeeeeeeEee.','..eeeeeeeeeEE...','...EeeeeeeEE....','....EEEEEEE.....',
 E16,E16,E16], { outline:true });
def('vegetables', [E16,
 '..........e..e..','...........ee.e.','........e..eEe..','.........eeEE...','........kkkEk...',
 '.......koooOk...','......kooooOk...','......koOoOk....','.....koooOk.....','.....koOoOk.....',
 '....koooOk......','....kooOk.......','...kooOk........','...kOkk.........','...kk...........']);
def('meat', [E16,E16,
 '.......nnnn.....','.....nnoonnnn...','....noooonnnnN..','...nooonnnnnnN..','...nonnnnnnnnNN.',
 '...nnnnnnnnnNNN.','....nnnnnnnNNN..','...wwNNnNNNNN...','..wwW.NNNNNN....','.wwW............',
 'wwwW............','.wW.............',E16,E16], { outline:true });
def('fish', [E16,E16,E16,
 '......kkkkk.....','....kkbbbbbk..kk','...kbbbbbbbbkkbk','..kbwkbbbbbbbbbk','..kbkkbbbbbbbbk.',
 '.kcbbbbbbbbbbbk.','..kcccbbbbbbbbbk','...kcccccbbbkkbk','....kkcccck...kk','......kkkk......',E16,E16,E16]);
def('books', [E16,E16,
 '...kkkkkkkkkk...','..kRrrrrrrrrrk..','..kRryyyyyyrrk..','..kRrykkkkyrrk..','..kRryyyyyyrrk..',
 '..kRrrrrrrrrrk..','..kRrrrrrrrrrk..','..kRrrrrrrrrrk..','..kRrrrrrrrrrk..','..kRkkkkkkkkkkk.',
 '..kRwwwwwwwwwWk.','...kkkkkkkkkkk..',E16,E16]);
def('training', [E16,E16,E16,E16,
 '..kkkk....kkkk..','.kGhhGk..kGhhGk.','.kGhhGkkkkGhhGk.','.kGhhGhhhhGhhGk.','.kGggGggggGggGk.',
 '.kGggGkkkkGggGk.','.kGggGk..kGggGk.','..kkkk....kkkk..',E16,E16,E16,E16]);
def('crafting', [E16,
 '............kk..','..kkkkkkkk.khk..','..knnnnnnk.khk..','..kkkkkkkk.khk..','...krrrrk..khk..',
 '...kRrRrk..khk..','...krRrRk..khk..','...kRrRrk..khk..','...krRrRk..khk..','...krrrrk..khk..',
 '..kkkkkkkk.khk..','..knnnnnnk.khk..','..kkkkkkkk..k...',E16,E16]);
def('weapons', grid(set => {
  set(13, 1, 'w'); set(14, 1, 'h');
  for(let i = 0; i < 7; i++){ set(12 - i, 2 + i, 'w'); set(13 - i, 2 + i, 'h'); }
  for(const [x, y] of [[3,8],[4,9],[5,10],[6,11],[7,12]]) set(x, y, 'Y');
  set(4, 8, 'y'); set(5, 9, 'y'); set(6, 10, 'y');
  set(4, 11, 'n'); set(3, 12, 'n'); set(2, 13, 'N');
  set(1, 14, 'y');
}), { outline:true });
def('martial', [E16,
 '...kkkk..kkkk...','...kbbBkkRrrk...','....kbbBRrrk....','....kbbBRrrk....','.....kbBRrk.....',
 '......kkkk......','.....kyyyyk.....','....kywwyyYk....','...kywyyyyyYk...','...kyyyYYyyYk...',
 '...kyyyYYyyYk...','...kyyyyyyYYk...','....kYyyyYYk....','.....kkkkkk.....',E16]);
def('fashion', [E16,
 '......kkkk......','.....kcwbbk.....','.....kbbbBk.....','......kBBk......','.....kykkyk.....',
 '....kyk..kYk....','...kyk....kYk...','...kyk....kYk...','...kyk....kYk...','...kyk....kYk...',
 '....kyk..kYk....','.....kYYYYk.....','......kkkk......',E16,E16]);
def('boardgames', [E16,E16,
 '......kkkk......','.....kwwwWk.....','.....kwwwWk.....','......kWWk......','.....kkkkkk.....',
 '......kwWk......','......kwWk......','.....kwwwWk.....','....kwwwwwWk....','...kkkkkkkkkk...',
 '...kWWWWWWWWk...','...kkkkkkkkkk...',E16,E16]);
def('flowers', [E16,
 '......kkkk......','....kkrrrrkk....','...krrRrrRrrk...','...krRrrrrRrk...','...krrRRRRrrk...',
 '....krrrrrrk....','.....kkkkkk.....','.......kek......','..kkk..kek......','.klllk.kek.kkk..',
 '..kEEkkkekklllk.','...kk..kekkEEk..','.......kek.kk...','........k.......',E16]);
def('horse', [E16,
 '.....kkkkkk.....','...kkhhhhhhkk...','..khhhhhhhhhhk..','..khhgkkkkghhk..','.khhgk....kghhk.',
 '.khkgk....kgkhk.','.khhgk....kghhk.','.khhgk....kghhk.','.khkgk....kgkhk.','.khhgk....kghhk.',
 '.kgggk....kgggk.','.kkkkk....kkkkk.',E16,E16,E16]);
def('archery', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot(x - 6.5, y - 8.5);
    if(d <= 6.2) set(x, y, d <= 1.6 ? 'r' : d <= 3.2 ? 'w' : d <= 4.8 ? 'r' : 'w');
  }
  for(let i = 0; i < 6; i++) set(8 + i, 7 - i, 'n');
  set(13, 0, 'r'); set(14, 0, 'R'); set(15, 0, 'R'); set(15, 1, 'R'); set(15, 2, 'r');
}), { outline:true, after: g => { g[8][6] = 'k'; g[8][7] = 'k'; } });
def('paintings', [E16,E16,
 '.kkkkkkkkkkkkkk.','.kyyyyyyyyyyyYk.','.kykkkkkkkkkkYk.','.kykccccyycckYk.','.kykccccyycckYk.',
 '.kykcccccccckYk.','.kykcceecccckYk.','.kykceeeeeeckYk.','.kykeeEeeeEekYk.','.kykkkkkkkkkkYk.',
 '.kYYYYYYYYYYYYk.','.kkkkkkkkkkkkkk.',E16,E16]);
def('figurines', [E8,E8,'..o.....','..oo....','..ooo...','..oooooo','.ooooooo','.ookoooo',
 '.ookoooo','.oooooop','..oooooo','...ooooo','..hhhhhh','..gggggg',E8,E8], { mirror:true, outline:true });
def('spiritual', [E16,
 '......kkkk......','....kkvvvvkk....','...kvwwvvvvVk...','...kvwvvvvvVk...','..kvvvvvvvvvVk..',
 '..kvvvvvvvvvVk..','..kvvvvvvvvVVk..','...kvvvvvvVVk...','...kVvvvvVVVk...','....kkVVVVkk....',
 '....kyyyyyyk....','...kyyyyyyyYk...','...kYYYYYYYYk...','...kkkkkkkkkk...',E16]);
def('travel', [E16,
 '......n..n......','......n..n......','.....nnnnnn.....','....nttttttn....','...nttttttttn...',
 '...nttttttttn...','...NnnnyynnnN...','...nnnnYYnnnn...','...nnNNNNNNnn...','...nnNnnnnNnn...',
 '...nnNNNNNNnn...','...nnnnnnnnnn...','...NNNNNNNNNN...',E16,E16], { outline:true });
def('seeds', [E16,E16,E16,
 '..lle......ell..','.lleee....eeell.','.leeeEe..eEeeel.','..eeeEEeeEEeee..','....EEEeeEEE....',
 '.......eE.......','.......eE.......','....nnneEnnn....','..nnnNnnnnnNnn..','.nnNnnnnNnnnnNn.',
 '.NNNNNNNNNNNNNN.',E16,E16], { outline:true });

// ---------- Seigneurs ----------
def('cai', [E8,E8,'.o......','.oo.....','.oOo....','.oOoo...','.ooooooo','oooooooo',
 'oookkooo','wooooooo','wwwooooo','.wwwwwoo','..wwwwww','....wwwk',E8,E8], { mirror:true, outline:true });
def('die', [E8,'....OOOO','..OOoOOo','.OoOOOOO','.OOOyyyy','OOOyyyyy','OOyyyyyy','OOykyyyy',
 'OOyyyyyy','OOyyyttt','.OOyyttN','.OOOyttt','..OOOyyy','...OOOOO',E8,E8], { mirror:true, outline:true });
def('the', [E8,'.g......','.gg.....','.gGg....','.gGGg...','.ggggggg','gggggggg','gggkgggg',
 'gggggggg','ggggghhh','.gggghhh','..ggghhh','...gghhk','....ghhh',E8,E8], { mirror:true, outline:true });
def('led', [E16,E16,
 '....wwwwww......','..wwwwwwwwww....','.wwwwgggwwwwy...','.wwwwwkwwwwyyy..','wwwwwwwwwwyyyyy.',
 'wwwwwwwwwwyYYyy.','nwwwwwwwwwwYYYy.','nnwwwwwwwww...y.','nnnwwwwwww......','nnnnwwwww.......',
 'nnnnnnww........','nnnnnnn.........',E16,E16], { outline:true });

// ---------- interface ----------
def('gift', [E8,E8,'...rr...','..r..r..','..r...r.','...rrrrr','.ccccccr','.bbbbbbr',
 '.BBBBBBr','..bbbbbr','..bbbbbr','..bbbbbr','..bbbbbr','..BBBBBr',E8,E8], { mirror:true, outline:true });
def('shop', [E16,E16,
 '.rrwwrrwwrrwwrr.','.rrwwrrwwrrwwrr.','..r..w..r..w....','..n..........n..','..n..........n..',
 '..nttttttttttn..','..nNNNNNNNNNNn..','..nttttttttttn..','..nttttttttttn..','..NNNNNNNNNNNN..',
 E16,E16,E16,E16], { outline:true });
def('coin', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot(x - 7.5, y - 7.5);
    if(d <= 6.3) set(x, y, d <= 3.6 ? 'y' : d <= 4.6 ? 'Y' : 'y');
  }
  set(5, 4, 'w'); set(4, 5, 'w'); set(6, 3, 'w');
  for(let y = 6; y <= 9; y++){ set(7, y, 'Y'); set(8, y, 'Y'); }
}), { outline:true });
def('star', [E8,'.......y','.......y','......yy','......yy','yyyyyyyy','.yyyyyyy','..yyyyyy',
 '...yyyyy','...yyyyY','..yyyyYY','..yyy.YY','.yy.....','.y......',E8,E8], { mirror:true, outline:true });
def('scroll', [E16,E16,
 '...tttttttttt...','..tNttttttttNt..','...mmmmmmmmmm...','...mnnnnnnnmm...','...mmmmmmmmmm...',
 '...mnnnnnnmmm...','...mmmmmmmmmm...','...mnnnnnnnmm...','...mmmmmmmmmm...','..tNttttttttNt..',
 '...tttttttttt...',E16,E16,E16], { outline:true });
def('info', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){ const d = Math.hypot(x - 7.5, y - 7.5); if(d <= 6.4) set(x, y, d > 5.4 && y > 7 ? 'B' : 'b'); }
  for(const [x, y] of [[7,3],[8,3],[7,4],[8,4],[6,6],[7,6],[8,6],[7,7],[8,7],[7,8],[8,8],[7,9],[8,9],[7,10],[8,10],[6,11],[7,11],[8,11],[9,11]]) set(x, y, 'w');
}), { outline:true });
def('hand', [E16,E16,E16,
 '...wwww.........','..wwwwwwwwwwwww.','.bwwwwwwhhhhhhh.','.bwwwwwww.......','.bwwwwwww.......',
 '.bwwwwwww.......','.bwwwwwww.......','..wwwwwww.......','...hhhhh........',E16,E16,E16,E16],
 { outline:true, after: g => { for(const y of [8, 10]) for(let x = 4; x <= 8; x++) g[y][x] = 'h'; g[8][9] = 'k'; g[10][9] = 'k'; } });


def('sun', [E8,'.......y','..y....y','...y....','.....yyy','....yyyy','....yyyo','yy.yyyyo',
 'yy.yyyyo','....yyyo','....yyoo','.....ooo','...y....','..y....y','.......y',E8], { mirror:true, outline:true });
def('moon', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const a = Math.hypot(x - 7.5, y - 8), b = Math.hypot(x - 10.6, y - 5.4);
    if(a <= 6.2 && b > 5.2) set(x, y, a > 4.6 && y > 8 ? 'Y' : 'y');
  }
  set(4, 6, 'Y'); set(5, 10, 'Y');
}), { outline:true, after: g => { g[2][13] = 'w'; g[1][13] = 'c'; g[3][13] = 'c'; g[2][12] = 'c'; g[2][14] = 'c'; } });

// ---------- carte ----------
def('castle', [E8,'.......r','......rr','.r...rRr','rrr..hhh','rRr..hgh','hhh..hhh','hgh.hhhh',
 'hhhhhhhh','hhhhhhhh','hhhhhhNN','hhhhhhNN','GGGGGGNN',E8,E8,E8], { mirror:true, outline:true });
def('temple', [E8,E8,'.......w','.....www','...wwwww','.wwwwwww','hhhhhhhh','.w.w.w.w',
 '.w.w.w.w','.w.w.w.w','.w.w.w.w','hhhhhhhh','gggggggg',E8,E8,E8], { mirror:true, outline:true });
def('cave', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot(x - 7.5, (y - 13.5) * 1.15);
    if(y <= 13 && d <= 7.4) set(x, y, d > 6.2 ? 'G' : (x + y) % 5 === 0 ? 'h' : 'g');
    if(y <= 13 && Math.hypot(x - 7.5, (y - 13.5) * .95) <= 3.6) set(x, y, 'k');
  }
  for(let x = 1; x <= 14; x++) set(x, 14, 'e');
}), { outline:true });
def('pick', grid(set => {
  for(let i = 0; i < 10; i++){ set(2 + i, 13 - i, 'n'); set(3 + i, 13 - i, 'N'); }
  for(const [x, y] of [[6,3],[7,2],[8,2],[9,2],[10,3],[11,4],[12,5],[13,6],[13,7],[14,8],[5,4],[4,5]]) set(x, y, 'h');
  for(const [x, y] of [[8,3],[9,3],[10,4],[11,5],[12,6]]) set(x, y, 'g');
}), { outline:true });
def('tower', [E8,E8,'...h.h.h','...hhhhh','....hhhh','....hhhh','....hkhh','....hhhh',
 '....hhhh','....hhhh','...hhhhh','...hhhhN','..GGGGGN','..GGGGGG',E8,E8], { mirror:true, outline:true });
def('lens', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot(x - 6.5, y - 6.5);
    if(d <= 5.2) set(x, y, d > 3.9 ? 'h' : 'c');
  }
  set(5, 4, 'w'); set(4, 5, 'w');
  for(let i = 0; i < 4; i++){ set(10 + i, 10 + i, 'n'); set(11 + i, 10 + i, 'N'); }
}), { outline:true });

// ---------- lot 3 : sons, anniversaire, armes ----------
const speaker = set => {
  for(let y = 6; y <= 9; y++) for(let x = 1; x <= 3; x++) set(x, y, 'h');
  for(let x = 4; x <= 7; x++){ const h = x - 3; for(let y = 6 - h; y <= 9 + h; y++) set(x, y, x === 7 ? 'g' : 'w'); }
};
def('sound', grid(set => {
  speaker(set);
  for(let y = 0; y < 16; y++) for(let x = 9; x < 16; x++){
    const d = Math.hypot(x - 5.5, y - 7.5);
    if(((d > 3.5 && d < 4.5) || (d > 6 && d < 7)) && Math.abs(y - 7.5) < d * .7) set(x, y, 'b');
  }
}), { outline:true });
def('mute', grid(set => {
  speaker(set);
  for(let i = 0; i < 5; i++){ set(10 + i, 5 + i, 'r'); set(14 - i, 5 + i, 'r'); }
}), { outline:true });
def('cake', [E16,
 '.......o........','.......y........','.......w........','.......w........',
 '...mmmmmmmmmm...','..pmmmmmmmmmmp..','..pppppppppppp..','..pPpppPppppPp..',
 '..tttttttttttt..','..tttttttttttt..','..rrrrrrrrrrrr..','..tttttttttttt..',
 '..nnnnnnnnnnnn..',E16,E16], { outline:true });
// armes : épée, lance, hache, arc, magie noire (grimoire), magie blanche (bâton), poings
def('w-sword', grid(set => {
  for(let i = 0; i < 8; i++){ set(14 - i, 1 + i, 'w'); set(14 - i, 2 + i, 'h'); }
  for(const [x, y] of [[4, 8], [5, 9], [6, 10], [7, 11], [8, 12]]) set(x, y, 'y');
  set(5, 8, 'Y'); set(7, 10, 'Y');
  for(const [x, y] of [[5, 11], [4, 12], [3, 13]]) set(x, y, 'n');
  set(2, 14, 'y');
}), { outline:true });
def('w-lance', grid(set => {
  for(let i = 0; i < 9; i++) set(2 + i, 13 - i, 'n');
  for(const [x, y, c] of [[14, 1, 'w'], [13, 2, 'w'], [14, 2, 'h'], [12, 3, 'w'], [13, 3, 'h'], [11, 3, 'w'], [12, 4, 'h'], [11, 4, 'w'], [13, 1, 'w'], [10, 5, 'g']]) set(x, y, c);
  set(9, 6, 'r'); set(8, 6, 'r'); set(9, 7, 'R');
}), { outline:true });
def('w-axe', grid(set => {
  // repère du manche : t le long du manche (vers le haut à droite), u vers le haut à gauche
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const dx = x - 2.5, dy = y - 13.5, t = (dx - dy) / Math.SQRT2, u = (-dx - dy) / Math.SQRT2;
    if(Math.abs(u) <= .72 && t >= 0 && t <= 15) set(x, y, u > 0 ? 'n' : 'N');
    else if(u > .72 && u <= 5.2 && Math.abs(t - 10.6) <= 1.3 + u * .5) set(x, y, u > 4.1 ? 'w' : 'h');
    else if(u < -.72 && u >= -2.4 && Math.abs(t - 10.6) <= .9) set(x, y, 'g');
  }
}), { outline:true });
def('w-bow', grid(set => {
  for(let y = 1; y <= 14; y++){ const x = Math.round(11.6 - .085 * (y - 7.5) ** 2); set(x, y, 'n'); if(y > 3 && y < 12) set(x + 1, y, 'N'); }
  for(let y = 1; y <= 14; y++) if(!(y === 7 || y === 8)) set(7, y, 'W');
  for(let x = 3; x <= 13; x++) set(x, 7, 'h');
  set(14, 7, 'g'); set(13, 6, 'g'); set(13, 8, 'g');
  set(3, 6, 'r'); set(4, 6, 'r'); set(3, 8, 'r'); set(4, 8, 'r');
}), { outline:true });
def('w-tome', [E16,E16,
 '...kkkkkkkkkk...','..kVvvvvvvvvvk..','..kVvvvrrvvvvk..','..kVvvrRRrvvvk..','..kVvvrRRrvvvk..',
 '..kVvvvrrvvvvk..','..kVvvvvvvvvvk..','..kVvvvvvvvvvk..','..kVkkkkkkkkkkk.','..kVwwwwwwwwwWk.',
 '...kkkkkkkkkkk..',E16,E16,E16]);
def('w-staff', grid(set => {
  for(let i = 0; i < 9; i++) set(2 + i, 14 - i, 'n');
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot(x - 11.5, y - 3.5);
    if(d > 1.6 && d <= 3) set(x, y, 'y');
  }
  set(11, 3, 'c'); set(12, 3, 'c'); set(11, 4, 'c'); set(12, 4, 'b');
  set(10, 6, 'Y');
}), { outline:true });
def('w-fist', grid(set => {
  for(let y = 0; y < 16; y++) for(let x = 0; x < 16; x++){
    const d = Math.hypot((x - 8) / 1.08, y - 6.5);
    if(d <= 5.1) set(x, y, d > 4.1 && (x > 9 || y > 8) ? 'R' : 'r');
  }
  set(5, 4, 'p'); set(6, 3, 'p'); set(5, 5, 'p');
  for(const [x, y] of [[4, 8], [4, 9], [5, 9], [5, 10]]) set(x, y, 'R');
  for(let x = 5; x <= 11; x++){ set(x, 12, 'w'); set(x, 13, 'h'); }
}), { outline:true });

// ---------- sorties ----------
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..');
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];

function crc32(buf){
  if(zlib.crc32) return zlib.crc32(buf);
  let c, crc = 0xffffffff;
  for(let n = 0; n < buf.length; n++){ c = (crc ^ buf[n]) & 0xff; for(let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
function png(w, h, px){ // px(x, y) -> [r, g, b, a]
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for(let y = 0; y < h; y++){
    raw[y * (w * 4 + 1)] = 0;
    for(let x = 0; x < w; x++){ const p = px(x, y); const o = y * (w * 4 + 1) + 1 + x * 4; raw[o] = p[0]; raw[o + 1] = p[1]; raw[o + 2] = p[2]; raw[o + 3] = p[3]; }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const artPx = (rows, x, y) => { const c = rows[y] && rows[y][x]; return c && c !== '.' ? [...hex(PAL[c]), 255] : null; };

// 1. Feuille de style des icônes : une variable par icône (réutilisable en CSS) et une classe .pi-nom.
let css = '/* Icônes pixel art originales du Fil des cadeaux. Fichier généré par tools/icons.js : ne pas modifier à la main. */\n:root{\n';
for(const n in I){
  const b64 = png(16, 16, (x, y) => artPx(I[n], x, y) || [0, 0, 0, 0]).toString('base64');
  css += `--pi-${n}:url("data:image/png;base64,${b64}");\n`;
}
css += '}\n';
for(const n in I) css += `.pi-${n}{background-image:var(--pi-${n})}\n`;
fs.writeFileSync(path.join(ROOT, 'pixel-art.css'), css);

// 2. Icônes de l'application : cadeau pixel art sur une fenêtre bleue façon GBA.
const SWAP = { b:'r', B:'R', c:'p', r:'y' }; // cadeau rouge à ruban doré pour ressortir sur le bleu
const GIFT_RED = I.gift.map(row => [...row].map(c => SWAP[c] || c).join(''));
const TOP = hex('#5070d8'), BOT = hex('#22389a'), BORDER = hex('#d8e0ff'), EDGE = hex('#0a1040');
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function appIcon(size, cell, framed){
  const art = GIFT_RED, off = Math.round((size - 16 * cell) / 2);
  const r = framed ? size * 0.19 : 0, bw = framed ? Math.max(2, Math.round(size * 0.027)) : 0, ew = framed ? Math.max(1, Math.round(size * 0.012)) : 0;
  return png(size, size, (x, y) => {
    const ax = Math.floor((x - off) / cell), ay = Math.floor((y - off) / cell);
    if(x >= off && y >= off && ax < 16 && ay < 16){ const p = artPx(art, ax, ay); if(p) return p; }
    let d = Math.min(x, y, size - 1 - x, size - 1 - y);
    if(framed){
      const cx = Math.max(r - x, x - (size - 1 - r), 0), cy = Math.max(r - y, y - (size - 1 - r), 0);
      if(cx > 0 && cy > 0){ const dist = Math.hypot(cx, cy); if(dist > r) return [0, 0, 0, 0]; d = Math.min(d, r - dist); }
      if(d < ew) return [...EDGE, 255];
      if(d < ew + bw) return [...BORDER, 255];
    }
    return [...mix(TOP, BOT, y / (size - 1)), 255];
  });
}
fs.mkdirSync(path.join(ROOT, 'icons'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'icons/icon-512.png'), appIcon(512, 24, true));
fs.writeFileSync(path.join(ROOT, 'icons/icon-192.png'), appIcon(192, 9, true));
fs.writeFileSync(path.join(ROOT, 'icons/maskable-512.png'), appIcon(512, 16, false));
fs.writeFileSync(path.join(ROOT, 'icons/apple-touch-icon.png'), appIcon(180, 8, false));
fs.writeFileSync(path.join(ROOT, 'icons/favicon-32.png'), png(32, 32, (x, y) => artPx(GIFT_RED, x >> 1, y >> 1) || [0, 0, 0, 0]));

// 3. Aperçu facultatif
if(process.argv.includes('--preview')){
  let html = '<html><head><link rel="stylesheet" href="../pixel-art.css"><style>body{margin:0;font:12px sans-serif}.pi{display:inline-block;image-rendering:pixelated;background-size:100% 100%}.r{display:flex;flex-wrap:wrap;gap:10px;padding:8px}.r div{width:80px;text-align:center}</style></head><body>';
  for(const bg of ['#FBFAFD', '#1D1928', '#2c46a8']){
    html += `<div class="r" style="background:${bg};color:${bg === '#FBFAFD' ? '#000' : '#fff'}">`;
    for(const n in I) html += `<div><i class="pi pi-${n}" style="width:64px;height:64px"></i><br><i class="pi pi-${n}" style="width:16px;height:16px"></i> <i class="pi pi-${n}" style="width:32px;height:32px"></i><br>${n}</div>`;
    html += '</div>';
  }
  html += '<div class="r" style="background:#888"><img src="../icons/icon-512.png" width="256"><img src="../icons/icon-192.png"><img src="../icons/maskable-512.png" width="256" style="border-radius:50%"><img src="../icons/apple-touch-icon.png" style="border-radius:40px"><img src="../icons/favicon-32.png"></div></body></html>';
  fs.writeFileSync(path.join(__dirname, 'preview.html'), html);
}
console.log(`${Object.keys(I).length} icônes : pixel-art.css et icons/*.png générés.`);
