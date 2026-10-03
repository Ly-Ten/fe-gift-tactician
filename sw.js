// Service worker du Fil des cadeaux : rend l'outil utilisable sans connexion.
// Réseau d'abord pour les fichiers du site (les mises à jour s'affichent tout de suite), cache en secours hors ligne.
const CACHE = 'fil-cadeaux-v10';
const CORE = ['./', './index.html', './pixel-art.css', './manifest.webmanifest', './vendor/qrcode.js', './map.js', './data/map.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/favicon-32.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin === self.location.origin){
    e.respondWith(fetch(req).then(res => res.ok ? keep(req, res) : res).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  if(url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com'){
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(res => (res.ok || res.type === 'opaque') ? keep(req, res) : res).catch(() => hit);
      return hit || net;
    }));
  }
});
