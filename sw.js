// Çevrimdışı önbellek: program bir kez açıldıktan sonra internet olmadan da çalışır.
// araclar/hazirla.mjs sürümü ve dosya listesini buraya yazar.
const SURUM = "1.2.0-mw3a7ehr";
const ONBELLEK = "cb3d-" + SURUM;
const DOSYALAR = [
  "./",
  "ek.css?v=e00bd733cc",
  "ek.js?v=3127119683",
  "ikon/ikon-192.png",
  "ikon/ikon-512.png",
  "index.html",
  "kutuphane/OrbitControls.js",
  "kutuphane/three.min.js",
  "manifest.webmanifest",
  "sahne.js?v=2cbe0d9384",
  "yazitipi/baloo/baloo-2-latin-700-normal.woff2",
  "yazitipi/baloo/baloo-2-latin-800-normal.woff2",
  "yazitipi/baloo/baloo-2-latin-ext-700-normal.woff2",
  "yazitipi/baloo/baloo-2-latin-ext-800-normal.woff2",
  "yazitipi/oswald/oswald-latin-500-normal.woff2",
  "yazitipi/oswald/oswald-latin-600-normal.woff2",
  "yazitipi/oswald/oswald-latin-700-normal.woff2",
  "yazitipi/oswald/oswald-latin-ext-500-normal.woff2",
  "yazitipi/oswald/oswald-latin-ext-600-normal.woff2",
  "yazitipi/oswald/oswald-latin-ext-700-normal.woff2",
  "yazitipi/plex/ibm-plex-mono-latin-400-normal.woff2",
  "yazitipi/plex/ibm-plex-mono-latin-500-normal.woff2",
  "yazitipi/plex/ibm-plex-mono-latin-ext-400-normal.woff2",
  "yazitipi/plex/ibm-plex-mono-latin-ext-500-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-400-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-500-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-600-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-ext-400-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-ext-500-normal.woff2",
  "yazitipi/roboto/roboto-condensed-latin-ext-600-normal.woff2",
  "yazitipleri.css"
];

// cache: "reload": dosyalar tarayıcının HTTP önbelleğinden değil sunucudan alınır.
// GitHub Pages dosyaları 10 dakika önbellekte tutturuyor; yoksa yeni sürüme eski dosyalar girer.
self.addEventListener("install", e => {
  e.waitUntil(caches.open(ONBELLEK)
    .then(c => c.addAll(DOSYALAR.map(u => new Request(u, { cache: "reload" }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(adlar => Promise.all(adlar.filter(a => a.startsWith("cb3d-") && a !== ONBELLEK).map(a => caches.delete(a))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const sayfa = e.request.mode === "navigate";
  e.respondWith(
    caches.match(e.request, { ignoreSearch: sayfa })
      .then(r => r || (sayfa ? caches.match("./") : null))
      .then(r => r || fetch(e.request))
  );
});
