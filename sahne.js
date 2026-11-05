// Aloğlu Cam Balkon 3D: 3D sahneyi zenginleştirir.
//  - Gökyüzü kubbesi ve seçilebilir manzara (deniz, dağ, orman, şehir), camda ve profilde yansıma
//  - Sıvalı duvar ve fayans zemin dokusu
//  - Balkona sığıyorsa masa, iki sandalye ve saksı (ölçek ve yaşanmışlık için)
// Stüdyonun içinden çağrılır (araclar/hazirla.mjs). Her şey burada çizilir; internetten bir şey indirilmez.
(function () {
  "use strict";
  // Tekrarlanabilir rastgele: bulutlar ve parıltılar her açılışta aynı yerde
  const rastgele = tohum => () => (tohum = (tohum * 16807) % 2147483647) / 2147483647;
  const ALT_KAT = -3.36; // balkonun altındaki bir kat (m): bina duvarı buraya iner, zemin burada
  const tuval = (g, y) => { const c = document.createElement("canvas"); c.width = g; c.height = y; return [c, c.getContext("2d")]; };

  // ---------- Manzaralar (eşdikdörtgen kubbe; yatayda başı sonu birleşir) ----------
  const MANZARALAR = [["deniz", "Deniz"], ["dag", "Dağ"], ["orman", "Orman"], ["sehir", "Şehir"]];
  const SIS = { deniz: 0xd3e4ea, dag: 0xd6e2e8, orman: 0xd2e0da, sehir: 0xd9dee2 };
  const G = 2048, Y = 1024, UFUK = Y * 0.5;
  // Dalga boyları G'yi tam böler: birleşme yerinde kesinti olmaz
  const sirt = (yukseklik, kaydir, keskin) => i => {
    const a = (i / G) * Math.PI * 2;
    const h = 0.55 + 0.3 * Math.sin(a * 3 + kaydir) + 0.18 * Math.sin(a * 7 + kaydir * 2) + 0.08 * Math.sin(a * 19 + kaydir)
      + (keskin ? 0.12 * Math.abs(Math.sin(a * 23 + kaydir * 3)) + 0.06 * Math.sin(a * 41 + kaydir) : 0);
    return yukseklik * Math.max(0, h);
  };
  function sirtCiz(x, renk, f, taban = 0) {
    x.fillStyle = renk; x.beginPath(); x.moveTo(0, UFUK + taban);
    for (let i = 0; i <= G; i += 4) x.lineTo(i, UFUK - f(i));
    x.lineTo(G, UFUK + taban); x.closePath(); x.fill();
  }
  // Kenara yakın çizim karşı kenarda da tekrarlanır (kubbede dikiş görünmesin)
  const sar = (px, w, f) => { f(px); if (px - w < 0) f(px + G); if (px + w > G) f(px - G); };
  // Ufkun altı: kubbenin zeminle ufuk arasında görünen ince şeridi
  function ufukAlti(x, renkler) {
    const g = x.createLinearGradient(0, UFUK, 0, Y);
    renkler.forEach(([t, c]) => g.addColorStop(t, c));
    x.fillStyle = g; x.fillRect(0, UFUK, G, Y - UFUK);
  }

  function gokyuzuCiz(x, tip) {
    const ufuk = UFUK, r = rastgele(7);
    x.clearRect(0, 0, G, Y);
    let g = x.createLinearGradient(0, 0, 0, ufuk);
    g.addColorStop(0, "#3f7fbf"); g.addColorStop(0.5, "#8fbfe2"); g.addColorStop(0.92, "#d9ebf3"); g.addColorStop(1, "#eef5f6");
    x.fillStyle = g; x.fillRect(0, 0, G, ufuk);
    // güneş parıltısı
    const gx = G * 0.32, gy = ufuk * 0.55;
    g = x.createRadialGradient(gx, gy, 0, gx, gy, 260);
    g.addColorStop(0, "rgba(255,250,235,.95)"); g.addColorStop(0.08, "rgba(255,246,222,.75)"); g.addColorStop(1, "rgba(255,246,222,0)");
    x.fillStyle = g; x.fillRect(0, 0, G, ufuk);
    // bulutlar (yumuşak)
    x.filter = "blur(22px)";
    for (let i = 0; i < 18; i++) {
      const bx = r() * G, by = ufuk * (0.18 + r() * 0.42), bw = 120 + r() * 260, bh = 18 + r() * 34;
      x.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.35})`;
      for (let k = 0; k < 4; k++) { x.beginPath(); x.ellipse(bx + (k - 1.5) * bw * 0.35, by + (r() - 0.5) * bh, bw * 0.45, bh, 0, 0, Math.PI * 2); x.fill(); }
    }
    x.filter = "none";
    ({ deniz: denizCiz, dag: dagCiz, orman: ormanCiz, sehir: sehirCiz })[tip](x, gx);
  }

  function denizCiz(x, gx) {
    const ufuk = UFUK, r = rastgele(17);
    sirtCiz(x, "#9db4c0", sirt(46, 1.3));
    sirtCiz(x, "#86a2ae", sirt(28, 4.1));
    ufukAlti(x, [[0, "#9cc4d3"], [0.04, "#4f93b3"], [0.35, "#2a6f93"], [1, "#123f5a"]]);
    // dalga parıltıları (ufka yakın sık ve ince)
    for (let i = 0; i < 700; i++) {
      const t = Math.pow(r(), 2.5), py = ufuk + 1 + t * (Y - ufuk) * 0.18, px = r() * G, uz = 3 + t * 14;
      x.fillStyle = `rgba(255,255,255,${0.1 + (1 - t) * 0.22})`;
      x.fillRect(px, py, uz, 1);
    }
    // güneşin denizdeki yansıması
    const g = x.createLinearGradient(gx - 60, 0, gx + 60, 0);
    g.addColorStop(0, "rgba(255,245,220,0)"); g.addColorStop(0.5, "rgba(255,245,220,.35)"); g.addColorStop(1, "rgba(255,245,220,0)");
    x.fillStyle = g; x.fillRect(gx - 60, ufuk, 120, (Y - ufuk) * 0.45);
  }

  function dagCiz(x) {
    // yüksek, karlı sıradağlar; önde yeşil tepeler ve çayır
    const uzak = sirt(112, 0.7, true);
    sirtCiz(x, "#8ea4b6", uzak);
    x.save(); x.beginPath(); x.moveTo(0, UFUK);
    for (let i = 0; i <= G; i += 4) x.lineTo(i, UFUK - uzak(i));
    x.lineTo(G, UFUK); x.closePath(); x.clip();
    for (let i = 0; i <= G; i += 4) { // kar: zirvenin üst kısmı, kenarı biraz dalgalı
      const h = uzak(i), kar = 0.68 * 112 + 5 * Math.sin(i * 0.11);
      if (h > kar) { x.fillStyle = "rgba(246,249,252,.95)"; x.fillRect(i, UFUK - h, 4, h - kar); }
    }
    x.restore();
    sirtCiz(x, "#7f97a3", sirt(68, 2.9, true));
    sirtCiz(x, "#6f8f6a", sirt(36, 5.2));
    sirtCiz(x, "#5d8551", sirt(16, 3.6));
    ufukAlti(x, [[0, "#6f9a57"], [0.2, "#55823f"], [1, "#2f5426"]]);
  }

  function ormanCiz(x) {
    const r = rastgele(23);
    sirtCiz(x, "#93ad9f", sirt(48, 2.2));
    const tepe = sirt(24, 0.4);
    sirtCiz(x, "#4f7c46", tepe);
    // ağaçlar: tepe çizgisi boyunca yuvarlak yapraklı ağaçlar ve sivri çamlar
    const renk = ["#2e5a2b", "#3a6b34", "#27502a", "#45773b", "#335f2f"];
    for (let i = 0; i < 2600; i++) {
      const px = r() * G, taban = UFUK - tepe(px) + r() * 14, boy = 3.5 + r() * 7;
      x.fillStyle = renk[(r() * renk.length) | 0];
      if (r() < 0.45) sar(px, boy, ox => { x.beginPath(); x.moveTo(ox - boy * 0.32, taban); x.lineTo(ox, taban - boy * 1.5); x.lineTo(ox + boy * 0.32, taban); x.closePath(); x.fill(); });
      else sar(px, boy, ox => { x.beginPath(); x.ellipse(ox, taban - boy * 0.6, boy * 0.55, boy * 0.65, 0, 0, Math.PI * 2); x.fill(); });
    }
    ufukAlti(x, [[0, "#4f7c3f"], [0.25, "#3f6a32"], [1, "#24451f"]]);
  }

  function sehirCiz(x) {
    const r = rastgele(31);
    sirtCiz(x, "#a7b6c0", sirt(34, 1.9));
    // iki kat bina: arkadakiler puslu, öndekiler pencereli
    const bina = (adet, enMin, enMax, boyMin, boyMax, renkler, pencere) => {
      for (let i = 0; i < adet; i++) {
        const w = enMin + r() * (enMax - enMin), h = boyMin + r() * (boyMax - boyMin), px = r() * G, c = renkler[(r() * renkler.length) | 0];
        const pr = pencere ? r() : 0;
        sar(px, w, ox => {
          const x0 = ox - w / 2, y0 = UFUK + 2 - h;
          x.fillStyle = c; x.fillRect(x0, y0, w, h);
          if (!pencere) return;
          x.fillStyle = "rgba(0,0,0,.08)"; x.fillRect(x0 + w * 0.82, y0, w * 0.18, h); // gölgeli yan
          x.fillStyle = pr < 0.5 ? "rgba(60,80,100,.38)" : "rgba(70,90,110,.3)";
          for (let yy = y0 + 2.5; yy < UFUK - 2; yy += 3.6) for (let xx = x0 + 1.5; xx < x0 + w * 0.8 - 1.5; xx += 3.2) x.fillRect(xx, yy, 1.6, 2);
          x.fillStyle = "rgba(0,0,0,.12)"; x.fillRect(x0 - 0.5, y0 - 1.5, w + 1, 1.5); // çatı kenarı
        });
      }
    };
    bina(260, 8, 24, 10, 46, ["#b4bec6", "#aab5be", "#bcc4ca"], false);
    // cami: kubbe ve iki minare
    [[G * 0.62, 0.34], [G * 0.12, 0.27]].forEach(([cx, k]) => {
      x.fillStyle = "#e9e4d8";
      x.beginPath(); x.ellipse(cx, UFUK - 58 * k, 44 * k, 40 * k, 0, Math.PI, 0); x.fill();
      x.fillRect(cx - 62 * k, UFUK - 60 * k, 124 * k, 62 * k);
      [-82, 82].forEach(dx => {
        const mx = cx + dx * k;
        x.fillStyle = "#ece8de"; x.fillRect(mx - 5 * k, UFUK - 200 * k, 10 * k, 200 * k);
        x.fillRect(mx - 8 * k, UFUK - 150 * k, 16 * k, 5 * k); // şerefe
        x.fillStyle = "#8d98a0"; x.beginPath(); x.moveTo(mx - 6 * k, UFUK - 200 * k); x.lineTo(mx, UFUK - 236 * k); x.lineTo(mx + 6 * k, UFUK - 200 * k); x.fill();
      });
    });
    bina(300, 10, 30, 7, 30, ["#d6cdbd", "#c9c0b0", "#bfb7ab", "#e0d8c8", "#a9afb3", "#cfc4b2"], true);
    ufukAlti(x, [[0, "#9ba3a8"], [0.2, "#80888d"], [1, "#4f565b"]]);
  }

  // Renderer ayarı, gökyüzü kubbesi ve yansıma ortamı. Kubbe döndürülür (stüdyo onu modelin merkezine taşır).
  let O = null; // açık sahnenin parçaları (manzara değişince yenilenir)
  function kur(THREE, renderer, scene, tip) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const [c, x] = tuval(G, Y);
    const kubbeDoku = new THREE.CanvasTexture(c); kubbeDoku.encoding = THREE.sRGBEncoding;
    const kubbe = new THREE.Mesh(new THREE.SphereGeometry(90, 64, 32),
      new THREE.MeshBasicMaterial({ map: kubbeDoku, side: THREE.BackSide, depthWrite: false, toneMapped: false, fog: false }));
    kubbe.renderOrder = -1;
    scene.add(kubbe);
    // bir kat aşağıda zemin; uzakta sise karışıp ufukla birleşir (balkon binanın üst katında görünsün)
    scene.fog = new THREE.Fog(SIS.deniz, 22, 85);
    const zemin = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: dokulariKur(THREE).tas, roughness: 0.85, envMapIntensity: 0.3 }));
    zemin.rotation.x = -Math.PI / 2; zemin.position.y = ALT_KAT; zemin.receiveShadow = true;
    scene.add(zemin);
    O = { THREE, renderer, scene, c, x, kubbeDoku, zemin, tip: null, ortam: null };
    manzara(tip);
    return kubbe;
  }
  // Manzarayı değiştirir; geçerli tipi döndürür
  function manzara(tip) {
    if (!SIS[tip]) tip = "deniz";
    if (!O || O.tip === tip) return tip;
    const { THREE, renderer, scene, c, x } = O;
    gokyuzuCiz(x, tip);
    O.kubbeDoku.needsUpdate = true;
    const doku = new THREE.CanvasTexture(c); doku.encoding = THREE.sRGBEncoding; doku.mapping = THREE.EquirectangularReflectionMapping;
    const pm = new THREE.PMREMGenerator(renderer);
    const yeni = pm.fromEquirectangular(doku).texture;
    pm.dispose(); doku.dispose();
    if (O.ortam) O.ortam.dispose();
    scene.environment = O.ortam = yeni;
    scene.fog.color.setHex(SIS[tip]);
    const d = dokulariKur(THREE);
    O.zemin.material.map = tip === "dag" || tip === "orman" ? d.cimen : d.tas;
    O.zemin.material.needsUpdate = true;
    O.tip = tip;
    return tip;
  }

  // ---------- Dokular ----------
  let dokular = null;
  function dokulariKur(THREE) {
    if (dokular) return dokular;
    const r = rastgele(11);
    // sıva: kırık beyaz zemin üstünde ince kum taneleri
    const [cs, xs] = tuval(512, 512);
    xs.fillStyle = "#efe8d8"; xs.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 14000; i++) { const v = 200 + r() * 55 | 0; xs.fillStyle = `rgba(${v},${v - 8},${v - 22},${0.18 + r() * 0.2})`; xs.fillRect(r() * 512, r() * 512, 1 + r() * 1.6, 1 + r() * 1.6); }
    const siva = new THREE.CanvasTexture(cs); siva.encoding = THREE.sRGBEncoding;
    siva.wrapS = siva.wrapT = THREE.RepeatWrapping; siva.repeat.set(3, 3);
    // fayans: 4×4 karo (60 cm), krem tonlar, ince derz
    const [cf, xf] = tuval(512, 512), k = 128;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const t = (r() - 0.5) * 14;
      xf.fillStyle = `rgb(${226 + t | 0},${210 + t | 0},${186 + t | 0})`; xf.fillRect(i * k, j * k, k, k);
      for (let n = 0; n < 260; n++) { xf.fillStyle = `rgba(150,120,90,${r() * 0.08})`; xf.fillRect(i * k + r() * k, j * k + r() * k, 2 + r() * 3, 1 + r() * 2); }
    }
    xf.strokeStyle = "#b9a58a"; xf.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { xf.beginPath(); xf.moveTo(i * k, 0); xf.lineTo(i * k, 512); xf.stroke(); xf.beginPath(); xf.moveTo(0, i * k); xf.lineTo(512, i * k); xf.stroke(); }
    const fayans = new THREE.CanvasTexture(cf); fayans.encoding = THREE.sRGBEncoding;
    fayans.wrapS = fayans.wrapT = THREE.RepeatWrapping; fayans.repeat.set(1 / 2.4, 1 / 2.4); // doku 2,4 m = 4 karo × 60 cm (zeminin UV'si metre)
    fayans.anisotropy = 4;
    // taş döşeme: büyük açık gri plakalar
    const [ct, xt] = tuval(512, 512), t2 = 256;
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
      const t = (r() - 0.5) * 16; xt.fillStyle = `rgb(${196 + t | 0},${192 + t | 0},${184 + t | 0})`; xt.fillRect(i * t2, j * t2, t2, t2);
      for (let n = 0; n < 900; n++) { xt.fillStyle = `rgba(90,85,75,${r() * 0.1})`; xt.fillRect(i * t2 + r() * t2, j * t2 + r() * t2, 2, 2); }
    }
    xt.strokeStyle = "#9d978c"; xt.lineWidth = 4; [0, 256, 512].forEach(v => { xt.beginPath(); xt.moveTo(v, 0); xt.lineTo(v, 512); xt.stroke(); xt.beginPath(); xt.moveTo(0, v); xt.lineTo(512, v); xt.stroke(); });
    const tas = new THREE.CanvasTexture(ct); tas.encoding = THREE.sRGBEncoding; tas.wrapS = tas.wrapT = THREE.RepeatWrapping; tas.repeat.set(80, 80); tas.anisotropy = 4;
    // çimen: dağ ve orman manzarasında aşağıdaki zemin
    const [cc, xc] = tuval(256, 256);
    xc.fillStyle = "#5f8a45"; xc.fillRect(0, 0, 256, 256);
    for (let n = 0; n < 5000; n++) { const v = r(); xc.fillStyle = v < 0.5 ? `rgba(40,70,30,${0.15 + r() * 0.2})` : `rgba(150,180,90,${0.1 + r() * 0.15})`; xc.fillRect(r() * 256, r() * 256, 1 + r() * 2, 2 + r() * 3); }
    const cimen = new THREE.CanvasTexture(cc); cimen.encoding = THREE.sRGBEncoding; cimen.wrapS = cimen.wrapT = THREE.RepeatWrapping; cimen.repeat.set(120, 120); cimen.anisotropy = 4;
    return (dokular = { siva, fayans, tas, cimen });
  }

  // Stüdyonun malzemeleri: profil boyalı alüminyum (hafif parlak), cam yansıtan, duvar sıvalı, zemin fayans
  // Cam renkleri: şeffaf (açık, yansıtan), füme (belirgin gri-duman), siyah filmli (koyu, aynamsı)
  const CAMLAR = {
    seffaf: { color: 0xd8eef5, opacity: 0.2, metalness: 0.05, envMapIntensity: 2.4 },
    fume: { color: 0x2f3539, opacity: 0.66, metalness: 0.1, envMapIntensity: 1.05 },
    siyah: { color: 0x07080a, opacity: 0.88, metalness: 0.35, envMapIntensity: 1.5 },
  };
  function malzemeler(THREE, profilRenk, camTip) {
    const d = dokulariKur(THREE), k = CAMLAR[camTip] || CAMLAR.fume;
    return {
      prof: profilRenk === 0xc9a24e // altın: parlak eloksal
        ? new THREE.MeshStandardMaterial({ color: profilRenk, roughness: 0.3, metalness: 0.65, envMapIntensity: 1.1 })
        : new THREE.MeshStandardMaterial({ color: profilRenk, roughness: 0.42, metalness: 0.2, envMapIntensity: 0.7 }), // boyalı alüminyum
      cam: new THREE.MeshPhysicalMaterial({ ...k, transparent: true,
        roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false, side: THREE.DoubleSide }),
      duvar: new THREE.MeshStandardMaterial({ color: 0xffffff, map: d.siva, roughness: 0.92, envMapIntensity: 0.35 }),
      parapet: new THREE.MeshStandardMaterial({ color: 0xf2ead8, map: d.siva, roughness: 0.92, envMapIntensity: 0.35 }),
      zemin: new THREE.MeshStandardMaterial({ color: 0xffffff, map: d.fayans, roughness: 0.5, envMapIntensity: 0.6 }),
    };
  }
  // Kamera önüne geçince saydamlaşan duvar ve tavan (stüdyonun fadeMat'ı yerine)
  function solan(THREE) {
    return new THREE.MeshStandardMaterial({ color: 0xffffff, map: dokulariKur(THREE).siva, roughness: 0.92, envMapIntensity: 0.35, transparent: true, opacity: 1 });
  }

  // ---------- İç eşyalar ----------
  // g: stüdyonun plan geometrisi (mm; x, z). Zemin üstü y = 0, ölçek metre.
  function esyalar(THREE, root, g, s) {
    const poly = g.poly.map(p => ({ x: p.x * s, z: p.z * s }));
    if (poly.length < 3) return;
    // alan ağırlıklı merkez
    let A = 0, cx = 0, cz = 0;
    poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], k = p.x * q.z - q.x * p.z; A += k; cx += (p.x + q.x) * k; cz += (p.z + q.z) * k; });
    if (Math.abs(A) < 1e-6) return;
    cx /= 3 * A; cz /= 3 * A;
    const icinde = (x, z) => { let ic = false; poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) ic = !ic; }); return ic; };
    const kenaraUzaklik = (x, z) => Math.min(...poly.map((p, i) => {
      const q = poly[(i + 1) % poly.length], dx = q.x - p.x, dz = q.z - p.z, L = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (z - p.z) * dz) / L));
      return Math.hypot(x - (p.x + t * dx), z - (p.z + t * dz));
    }));
    if (!icinde(cx, cz)) return;
    // eşyalar en uzun cam yüzüne paralel dizilir
    let enUzun = g.segs[0]; g.segs.forEach(sg => { if (sg.b.L > enUzun.b.L) enUzun = sg; });
    const d = { x: enUzun.d.x, z: enUzun.d.z };
    const grup = new THREE.Group(); root.add(grup);
    const ahsap = new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.55, metalness: 0.05 });
    const metal = new THREE.MeshStandardMaterial({ color: 0x2f3337, roughness: 0.35, metalness: 0.6 });
    const minder = new THREE.MeshStandardMaterial({ color: 0xd9cbb2, roughness: 0.9 });
    const toprak = new THREE.MeshStandardMaterial({ color: 0xb4643d, roughness: 0.8 });
    const yaprak = new THREE.MeshStandardMaterial({ color: 0x4f7d3a, roughness: 0.75 });
    const parca = (geo, m, x, y, z, ust) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; (ust || grup).add(me); return me; };
    const yer = kenaraUzaklik(cx, cz);
    if (yer >= 0.62) {
      // yuvarlak masa
      parca(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 40), ahsap, cx, 0.73, cz);
      parca(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12), metal, cx, 0.36, cz);
      parca(new THREE.CylinderGeometry(0.22, 0.24, 0.02, 32), metal, cx, 0.01, cz);
      // iki sandalye, masaya dönük
      [-1, 1].forEach(yon => {
        const sx = cx + d.x * 0.62 * yon, sz = cz + d.z * 0.62 * yon;
        if (!icinde(sx, sz) || kenaraUzaklik(sx, sz) < 0.24) return;
        const sg = new THREE.Group(); sg.position.set(sx, 0, sz); sg.rotation.y = Math.atan2(-d.x * yon, -d.z * yon) + Math.PI; grup.add(sg);
        parca(new THREE.BoxGeometry(0.44, 0.05, 0.44), minder, 0, 0.46, 0, sg);
        parca(new THREE.BoxGeometry(0.44, 0.42, 0.04), ahsap, 0, 0.7, 0.2, sg);
        [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([lx, lz]) => parca(new THREE.BoxGeometry(0.03, 0.45, 0.03), metal, lx, 0.225, lz, sg));
      });
    }
    // saksı: masanın yanında boş bir yerde (yoksa merkezde, yer çok darsa hiç)
    const adaylar = yer >= 0.62 ? [1.35, -1.35, 1.05, -1.05] : [0];
    for (const a of adaylar) {
      const px = cx + d.x * a, pz = cz + d.z * a;
      if (!icinde(px, pz) || kenaraUzaklik(px, pz) < 0.24) continue;
      parca(new THREE.CylinderGeometry(0.17, 0.13, 0.36, 24), toprak, px, 0.18, pz);
      const ag = new THREE.IcosahedronGeometry(0.2, 1);
      [[0, 0.56, 0, 1], [0.1, 0.68, 0.05, 0.75], [-0.09, 0.66, -0.06, 0.7], [0.02, 0.8, -0.02, 0.55]].forEach(([ox, oy, oz, k]) => {
        const y = parca(ag, yaprak, px + ox, oy, pz + oz); y.scale.setScalar(k);
      });
      break;
    }
  }

  window.cb3dSahne = { kur, manzara, malzemeler, solan, esyalar, ALT_KAT, MANZARALAR };
})();
