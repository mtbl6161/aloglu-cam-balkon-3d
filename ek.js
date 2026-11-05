// Aloğlu Cam Balkon 3D: stüdyonun üstüne gelen arayüz.
//  - Yan panel: Excel gibi ölçü tablosu, seçili bölümün ayrıntıları, renk ve sistem
//  - 3D düğmeleri: görünüm, çevir, yakınlaştır, kanatlar, ölçüler
//  - Proje: kaydet/aç (IndexedDB), otomatik taslak, geri al/yinele, yedek dosyası
//  - Görsel: logolu görsel, paylaş/indir/yazdır; yardım penceresi
// Stüdyonun içine konan kancaları kullanır (araclar/hazirla.mjs): aloglu.durum/yukle/liste/hesap/ciz/... .
(function () {
  "use strict";
  const A = window.aloglu;
  const $ = id => document.getElementById(id);
  if (!A || !A.durum || !A.liste) { console.error("Stüdyo köprüsü bulunamadı."); return; }

  const TASLAK = "cb3d-taslak";
  const VARSAYILAN = {
    sistem: "twin", profil: "antrasit", cam: "fume", manzara: "deniz", parapetTip: "duvar", parapet: 1000, maxW: 650,
    bolumler: [{ L: 3000, H: 1652, K: 5, oto: true, I: 1, yuz: "on", dL: "oto", dR: "oto", yon: "SOL", ispW: 0, aci: 90 }],
  };
  // Yazılabilecek değerlerin sınırları; dışındaki değer 3D'ye uygulanmaz, kutu kırmızı olur
  const SINIR = {
    L: { min: 300, max: 20000, ad: "uzunluk", birim: "mm" },
    H: { min: 500, max: 4000, ad: "yükseklik", birim: "mm" },
    K: { min: 1, max: 40, ad: "kanat sayısı", birim: "" },
    aci: { min: 60, max: 180, ad: "köşe açısı", birim: "°" },
    parapet: { min: 0, max: 3000, ad: "parapet yüksekliği", birim: "mm" },
    maxW: { min: 300, max: 1500, ad: "en geniş kanat", birim: "mm" },
  };
  const CAMLAR = [["seffaf", "Şeffaf"], ["fume", "Füme"], ["siyah", "Siyah film"]];
  const PROFILLER = [["antrasit", "Antrasit", "#3a3e43"], ["fume", "Füme", "#6b7177"], ["beyaz", "Beyaz", "#e9ebec"], ["bronz", "Bronz", "#6b5440"], ["gold", "Altın", "#c9a24e"]];

  const IKON = {
    yeni: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 12v6M9 15h6"/>',
    klasor: '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H9l2 2.5h7.5A2.5 2.5 0 0 1 21 9v8.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    kaydet: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M7 3v5h8M7 21v-7h10v7"/>',
    resim: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    geri: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    ileri: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    ekle: '<path d="M12 5v14M5 12h14"/>',
    sil: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
    kanat: '<path d="M3 21h18M5 21V4h8v17M13 7l6-2v16"/>',
    cetvel: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/><path d="m14.5 12.5 2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2"/>',
    uyari: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    paylas: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    indir: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    yazdir: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v7H6z"/>',
  };
  // Önce büyük sistemin simge seti (sayfaya gömülü, araclar/hazirla.mjs); orada karşılığı olmayanlar yukarıdaki çizimlerden
  const SET = { yeni: "arti", ekle: "arti", klasor: "isler", resim: "gorsel", indir: "indir", uyari: "uyari", cetvel: "olcu",
    geri: "gecmis", sistem: "cam-balkon", olcu: "olcu", yedek: "yedek" };
  const ikon = ad => SET[ad]
    ? `<svg class="ik" aria-hidden="true"><use href="#s-${SET[ad]}"/></svg>`
    : `<svg class="ik" viewBox="0 0 24 24" aria-hidden="true">${IKON[ad] || ""}</svg>`;

  // ---------- Yardımcılar ----------
  const esc = t => { const d = document.createElement("div"); d.textContent = t == null ? "" : String(t); return d.innerHTML; };
  const sayi = n => Math.round(n).toLocaleString("tr-TR");
  const tarihYaz = iso => {
    const d = new Date(iso); if (isNaN(d)) return "";
    const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
    return d.toDateString() === new Date().toDateString() ? "bugün " + saat : d.toLocaleDateString("tr-TR") + " " + saat;
  };
  const dosyaAdi = ad => (String(ad || "").trim() || "cam-balkon").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60);
  const lsOku = (k, v) => { try { const x = localStorage.getItem(k); return x ? JSON.parse(x) : v; } catch (e) { return v; } };
  const lsYaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* dolu ya da kapalı: taslak tutulamaz */ } };
  // "3.000", "3 000", "3000" hepsi 3000 okunur; boş ya da sayı değilse null
  const sayiOku = t => { const s = String(t).trim().replace(/[\s.]/g, "").replace(",", "."); if (!s || !/^-?\d+(\.\d+)?$/.test(s)) return null; return Math.round(+s); };
  function indir(blob, ad) {
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = ad; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  const blobAl = (canvas, tur, kalite) => new Promise((coz, red) => canvas.toBlob(b => b ? coz(b) : red(new Error("Görsel oluşturulamadı.")), tur, kalite));

  // Bildirim: yaşlı kullanıcı kaçırmasın diye birkaç saniye kalır; isteğe bağlı "Geri al" gibi bir düğme taşır
  let bildirimT = null;
  function bildir(metin, secenek) {
    const o = typeof secenek === "boolean" ? { uyari: secenek } : (secenek || {});
    let b = document.querySelector(".cb-bildirim");
    if (!b) { b = document.createElement("div"); b.className = "cb-bildirim"; b.setAttribute("role", "status"); }
    // Açık pencere varsa onun içine konur; yoksa pencerenin karartılmış arka planının altında kalırdı
    const kap = document.querySelector("dialog[open]") || document.body;
    if (b.parentNode !== kap) kap.appendChild(b);
    b.innerHTML = `<span>${esc(metin)}</span>${o.eylem ? `<button type="button">${esc(o.eylem.yazi)}</button>` : ""}`;
    b.classList.toggle("uyari", !!o.uyari); b.hidden = false;
    if (o.eylem) b.querySelector("button").addEventListener("click", () => { b.hidden = true; o.eylem.f(); });
    clearTimeout(bildirimT); bildirimT = setTimeout(() => { b.hidden = true; }, o.sure || (o.uyari || o.eylem ? 8000 : 4500));
  }

  // ---------- Pencereler ----------
  function pencere(baslik, govde, alt, sinif) {
    const d = document.createElement("dialog");
    d.className = "cb" + (sinif ? " " + sinif : "");
    d.innerHTML = `<div class="cb-bas"><h2>${esc(baslik)}</h2><button type="button" class="kapat" data-kapat>Kapat ✕</button></div>
      <div class="cb-govde">${govde}</div>${alt ? `<div class="cb-alt">${alt}</div>` : ""}`;
    d.addEventListener("click", e => { if (e.target.closest("[data-kapat]")) d.close(); });
    d.addEventListener("close", () => d.remove());
    document.body.appendChild(d);
    d.showModal();
    return d;
  }
  // Tarayıcının "Tamam / İptal" kutusu yerine ne olacağını açıkça söyleyen düğmeler
  function sor({ baslik, metin, evet, hayir = "Vazgeç", tehlike = false }) {
    return new Promise(coz => {
      const d = pencere(baslik, `<p class="sor-metin">${esc(metin)}</p>`,
        `<span class="ara"></span><button type="button" data-cevap="0">${esc(hayir)}</button><button type="button" class="${tehlike ? "tehlike" : "birincil"}" data-cevap="1">${esc(evet)}</button>`, "dar");
      let cevap = false;
      d.addEventListener("click", e => { const b = e.target.closest("[data-cevap]"); if (b) { cevap = b.dataset.cevap === "1"; d.close(); } });
      d.addEventListener("close", () => coz(cevap));
      d.querySelector('[data-cevap="0"]').focus();
    });
  }

  // ---------- Veritabanı ----------
  const VT = (() => {
    let acilis = null;
    const ac = () => acilis || (acilis = new Promise((coz, red) => {
      if (!window.indexedDB) return red(new Error("Bu tarayıcı proje kaydetmeyi desteklemiyor."));
      const r = indexedDB.open("aloglu-cam-balkon-3d", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("projeler", { keyPath: "id" });
      r.onsuccess = () => coz(r.result);
      r.onerror = () => red(r.error || new Error("Veritabanı açılamadı."));
    }));
    const is = async (mod, f) => {
      const db = await ac();
      return new Promise((coz, red) => {
        const t = db.transaction("projeler", mod), r = f(t.objectStore("projeler"));
        t.oncomplete = () => coz(r ? r.result : undefined);
        t.onerror = () => red(t.error); t.onabort = () => red(t.error || new Error("Kayıt yarım kaldı."));
      });
    };
    return {
      hepsi: () => is("readonly", s => s.getAll()),
      al: id => is("readonly", s => s.get(id)),
      yaz: p => is("readwrite", s => s.put(p)),
      sil: id => is("readwrite", s => s.delete(id)),
    };
  })();
  // Tablette tarayıcı yer açmak için verileri silmesin
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}

  // ======================================================================
  // Arayüz iskeleti
  // ======================================================================
  document.querySelectorAll("[data-ikon]").forEach(b => b.insertAdjacentHTML("afterbegin", ikon(b.dataset.ikon)));
  // Sistem kartları: küçük önden çizim (katlanır tek cam / çift cam / sürme) + ortalı kısa ad
  const kasa = '<rect x="2" y="4" width="56" height="24" rx="1.5"/>';
  const katlanir = cift => `<svg class="sis-cizim" viewBox="0 0 60 32" aria-hidden="true">${kasa}
    <path d="M16 4v24M30 4v24M44 4v24"/><path class="ince" d="M44 4l9 3v18l-9 3"/>
    ${cift ? '<path class="ince" d="M8 8v16M10 8v16M22 8v16M24 8v16M36 8v16M38 8v16"/>' : '<path class="ince" d="M9 8v16M23 8v16M37 8v16"/>'}</svg>`;
  const SISTEM_KART = {
    twin: { ad: "Twin Max", cizim: katlanir(true) },
    slide: { ad: "Slide Max", cizim: `<svg class="sis-cizim" viewBox="0 0 60 32" aria-hidden="true">${kasa}
      <rect x="5" y="7" width="19" height="18"/><rect class="arka" x="20" y="9" width="19" height="16"/><rect x="36" y="7" width="19" height="18"/>
      <path class="ince" d="M24 30.5h12M27 28.5l-3 2 3 2M33 28.5l3 2-3 2"/></svg>` },
    // giyotin: üstte motor kutusu, üç cam üst üste
    giyotin: { ad: "Giyotin", cizim: `<svg class="sis-cizim" viewBox="0 0 60 32" aria-hidden="true">${kasa}
      <path d="M2 8h56M30 8v20"/><rect class="ince" x="5" y="10" width="22" height="5.5"/><rect class="ince" x="5" y="15.5" width="22" height="5.5"/><rect class="ince" x="5" y="21" width="22" height="5.5"/>
      <rect class="ince" x="33" y="10" width="22" height="5.5"/><rect class="ince" x="33" y="15.5" width="22" height="5.5"/><rect class="ince" x="33" y="21" width="22" height="5.5"/></svg>` },
  };
  const panel = document.querySelector(".panel.olcu"), viewer = $("viewer");
  const yan = document.createElement("aside");
  yan.className = "yan"; yan.setAttribute("aria-label", "Ölçüler ve seçenekler");
  yan.innerHTML = `
    <section class="kart" aria-labelledby="sis-bas">
      <div class="kart-bas"><h2 id="sis-bas">${ikon("sistem")}Sistem</h2></div>
      <div class="sistemler" role="group" aria-label="Cam balkon sistemi">${A.sistemler().map(s => `<button type="button" data-sistem="${s.kod}" aria-label="${esc(s.ad)}">

        ${SISTEM_KART[s.kod].cizim}<b>${SISTEM_KART[s.kod].ad}</b></button>`).join("")}</div>
    </section>
    <section class="kart" aria-labelledby="olc-bas">
      <div class="kart-bas">
        <h2 id="olc-bas">${ikon("olcu")}Ölçüler</h2>
        <div class="gecmis">
          <button type="button" id="geri-al" title="Son değişikliği geri al (Ctrl+Z)">${ikon("geri")}Geri al</button>
          <button type="button" id="ileri-al" title="Geri alınanı yinele (Ctrl+Y)">${ikon("ileri")}Yinele</button>
        </div>
      </div>
      <div class="tablo-kap">
        <table class="tablo">
          <thead><tr><th scope="col">No</th><th scope="col">Yüz</th><th scope="col">Uzunluk</th><th scope="col">Yükseklik</th><th scope="col">Kanat</th><th scope="col">Toplanma</th></tr></thead>
          <tbody id="tablo"></tbody>
        </table>
      </div>
      <p class="tablo-hata" id="tablo-hata" role="alert" hidden></p>
      <div class="secenek" id="secenek" aria-live="polite"></div>
      <button type="button" id="bolum-ekle" class="ekle">${ikon("ekle")}Bölüm ekle</button>
      <p class="ipucu">Milimetre yazın · <b>Enter</b> alt satır · kanat boşsa program önerir · sırayı değiştirmek için numarayı tutup sürükleyin</p>
    </section>
    <section class="kart" aria-labelledby="genel-bas">
      <div class="kart-bas"><h2 id="genel-bas">${ikon("resim")}Renk ve manzara</h2></div>
      <div class="sade-satir"><span class="etiket">Profil <em id="y-profil-ad"></em></span>
        <div class="renkler" role="group" aria-label="Profil rengi">${PROFILLER.map(([v, ad, c]) => `<button type="button" data-profil="${v}" title="${ad}" aria-label="${ad}"><span class="renk" style="--c:${c}"></span></button>`).join("")}</div></div>
      <div class="sade-satir"><span class="etiket">Cam</span>
        <div class="secim kucuk" role="group" aria-label="Cam rengi">${CAMLAR.map(([v, ad]) => `<button type="button" data-cam-renk="${v}">${ad}</button>`).join("")}</div></div>
      <div class="manzara-satir"><span class="etiket">Manzara</span>
        <div class="secim genis" role="group" aria-label="Arkadaki manzara">${A.manzaralar().map(([v, ad]) => `<button type="button" data-manzara="${v}">${ad}</button>`).join("")}</div></div>
      <div class="sade-satir" data-parapet-satir><span class="etiket">Parapet</span>
        <div class="secim kucuk" role="group" aria-label="Parapet türü"><button type="button" data-parapet-tip="duvar">Duvar</button><button type="button" data-parapet-tip="cam">Cam</button></div></div>
      <label class="sade-satir" data-parapet-satir><span class="etiket">Parapet boyu</span>
        <span class="giris"><input id="y-parapet" data-g="parapet" inputmode="numeric" autocomplete="off" aria-label="Parapet yüksekliği, milimetre"><span>mm</span></span></label>
    </section>`;
  panel.insertBefore(yan, viewer);

  const dokunmatik = matchMedia("(pointer: coarse)").matches;
  viewer.insertAdjacentHTML("beforeend", `
    <div class="v-gorunum" role="group" aria-label="Görünüm">
      <button type="button" data-cam="iso">Genel</button><button type="button" data-cam="on">Önden</button><button type="button" data-cam="ust">Üstten</button><button type="button" data-cam="ic">İçeriden</button>
    </div>
    <div class="v-ipucu" id="v-ipucu">${dokunmatik ? "Parmağınızla sürükleyerek çevirin, iki parmakla yakınlaştırın." : "Fareyle sürükleyerek çevirin, tekerlekle yakınlaştırın."} Cama dokununca o bölüm seçilir.</div>
    <div class="v-alt">
      <div class="v-grup" role="group" aria-label="Gösterim">
        <button type="button" id="v-kanat">${ikon("kanat")}<span>Kanatları aç</span></button>
        <button type="button" id="v-olcu" aria-pressed="false">${ikon("cetvel")}<span>Ölçüleri göster</span></button>
      </div>
    </div>`);

  viewer.querySelectorAll(".v-gorunum [data-cam]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.cam === A.gorunumAdi())));

  // ======================================================================
  // Açık proje, taslak, geçmiş
  // ======================================================================
  const adEl = $("pr-ad"), durumEl = $("pr-durum");
  let acik = { id: null, kayit: null }, degisti = false, yukleniyor = false;
  function durumYaz() {
    // Kaydedilmemiş değişiklik: sürekli duran rozet yerine Kaydet düğmesinde küçük nokta (taslak zaten kendiliğinden saklanır)
    const k = $("pr-kaydet");
    k.classList.toggle("bekliyor", degisti);
    k.title = degisti ? "Kaydedilmemiş değişiklik var" : "";
    durumEl.textContent = !degisti && acik.kayit ? "Kaydedildi · " + tarihYaz(acik.kayit) : "";
  }
  let taslakT = null;
  const taslakHemen = () => { clearTimeout(taslakT); taslakT = null; lsYaz(TASLAK, { id: acik.id, kayit: acik.kayit, ad: adEl.value, degisti, durum: A.durum() }); };
  function taslakYaz() { clearTimeout(taslakT); taslakT = setTimeout(taslakHemen, 300); }
  // Pencere kapanırken ya da tablette uygulama arka plana geçerken bekleyen taslak hemen yazılır
  addEventListener("pagehide", () => { if (taslakT) taslakHemen(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && taslakT) taslakHemen(); });

  // Geri al / yinele: her değişiklikten yarım saniye sonra durumun kopyası alınır
  let yigin = [], konum = -1, anlikT = null;
  const gecmisDugme = () => { $("geri-al").disabled = konum <= 0 && !anlikT; $("ileri-al").disabled = konum >= yigin.length - 1; };
  function gecmisSifirla() { clearTimeout(anlikT); anlikT = null; yigin = [JSON.stringify(A.durum())]; konum = 0; gecmisDugme(); }
  function anlikAl() {
    clearTimeout(anlikT); anlikT = null;
    const d = JSON.stringify(A.durum());
    if (yigin[konum] !== d) { yigin = yigin.slice(0, konum + 1); yigin.push(d); if (yigin.length > 100) yigin.shift(); konum = yigin.length - 1; }
    gecmisDugme();
  }
  function gecmisGit(adim) {
    if (anlikT) anlikAl();
    const h = konum + adim; if (h < 0 || h >= yigin.length) return false;
    konum = h; yukleniyor = true;
    try { A.yukle(JSON.parse(yigin[konum]), { kameraKoru: true }); } finally { yukleniyor = false; }
    degisti = true; durumYaz(); taslakYaz(); hepsiniCiz(); gecmisDugme();
    return true;
  }
  $("geri-al").addEventListener("click", () => { if (!gecmisGit(-1)) bildir("Geri alınacak değişiklik yok."); });
  $("ileri-al").addEventListener("click", () => gecmisGit(1));

  let turevT = null;
  document.addEventListener("cb3d-degisti", () => {
    clearTimeout(turevT); turevT = setTimeout(turevYenile, 160); // önerilen kanat sayısı, uyarılar
    if (yukleniyor) return;
    degisti = true; durumYaz(); taslakYaz();
    clearTimeout(anlikT); anlikT = setTimeout(anlikAl, 500); gecmisDugme();
  });
  adEl.addEventListener("input", () => { degisti = true; durumYaz(); taslakYaz(); });

  function yukle(durum, ad, id, kayit) {
    // Eski projelerde kalmış, artık ekranda olmayan özel değerler görünüşü gizlice değiştirmesin
    (durum.bolumler || []).forEach(b => { b.ispW = 0; b.dL = b.dR = "oto"; delete b.kSutun; delete b.orta; });
    yukleniyor = true;
    try { A.yukle(durum); } finally { yukleniyor = false; }
    adEl.value = ad || ""; acik = { id: id || null, kayit: kayit || null }; degisti = false; secili = 0;
    durumYaz(); taslakHemen(); gecmisSifirla(); hepsiniCiz();
  }
  const kaybolsunMu = async () => !degisti || await sor({
    baslik: "Kaydedilmemiş değişiklik var",
    metin: "Bu projede kaydedilmemiş değişiklikler var. Devam ederseniz bu değişiklikler kaybolur.",
    evet: "Kaydetmeden devam et", hayir: "Vazgeç", tehlike: true,
  });

  // ======================================================================
  // Ölçü tablosu
  // ======================================================================
  const tabloEl = $("tablo"), hataEl = $("tablo-hata");
  let secili = 0;
  const yuzler = A.yuzler();
  // Yerler soldan sağa sıralı gösterilir; her satırda hepsi seçilebilir. Yeni bölümde sıradaki yer önerilir (stüdyo nextFace).
  const SIRA = ["solArka", "sol", "on", "sag", "sagArka", "arka"]; // dört taraf cam: Sol yan + Ön + Sağ yan + Arka
  const yuzAd = d => (yuzler.find(y => y.deger === d) || {}).ad || d;
  const yuz = b => (b && b.yuz) || "on";

  // Slide Max'te çift kanat ortadan ayrılır: toplanma seçilemez, "İki yana" yazar
  const toplanmaHucre = (b, i, r) => r.giyotin
    ? `<select disabled aria-label="${i + 1}. bölüm camları aşağı toplanır" title="Giyotin: camlar aşağı toplanır, üst kısım açılır"><option>Aşağı</option></select>`
    : r.orta
    ? `<select disabled aria-label="${i + 1}. bölüm kanatları ortadan iki yana toplanır" title="Çift kanat: ortadan iki yana açılır"><option>İki yana</option></select>`
    : `<select data-k="yon" data-i="${i}" aria-label="${i + 1}. bölüm kanatların toplandığı taraf"><option value="SOL"${b.yon === "SOL" ? " selected" : ""}>Solda</option><option value="SAĞ"${b.yon !== "SOL" ? " selected" : ""}>Sağda</option></select>`;

  function tabloCiz() {
    const B = A.liste();
    if (secili >= B.length) secili = B.length - 1;
    tabloEl.innerHTML = B.map((b, i) => {
      const r = A.hesap(i), uy = r.uyari.length;
      return `<tr data-satir="${i}" class="${i === secili ? "secili" : ""}${uy ? " uyarili" : ""}">
        <th scope="row"><button type="button" class="no" data-sec="${i}" aria-label="${i + 1}. bölüm${uy ? ", uyarı var" : ""}" title="${uy ? esc(r.uyari.join(" ")) + " " : ""}Dokunun: ayrıntılar · Sürükleyin: sırayı değiştirin">${i + 1}${uy ? `<span class="nokta"></span>` : ""}</button></th>
        <td><select data-k="yuz" data-i="${i}" aria-label="${i + 1}. bölüm yüzü">${SIRA.map(d => `<option value="${d}"${yuz(b) === d ? " selected" : ""}>${yuzAd(d)}</option>`).join("")}</select></td>
        <td><input data-k="L" data-i="${i}" inputmode="numeric" autocomplete="off" value="${b.L}" aria-label="${i + 1}. bölüm uzunluğu, milimetre"></td>
        <td><input data-k="H" data-i="${i}" inputmode="numeric" autocomplete="off" value="${b.H}" aria-label="${i + 1}. bölüm yüksekliği, milimetre"></td>
        <td><input data-k="K" data-i="${i}" inputmode="numeric" autocomplete="off" value="${r.K}" class="${b.oto ? "oto" : ""}" aria-label="${i + 1}. bölüm kanat sayısı${b.oto ? ", program önerisi" : ""}" title="${b.oto ? "Program önerisi. Kendiniz yazabilirsiniz." : "Sizin yazdığınız. Silerseniz program önerir."}"></td>
        <td class="toplanma">${toplanmaHucre(b, i, r)}</td>
      </tr>`;
    }).join("");
    const giy = A.durum().sistem === "giyotin"; // giyotinde kanat yerine modül sayısı
    const ks = document.querySelector(".tablo thead th:nth-child(5)"); if (ks) ks.textContent = giy ? "Modül" : "Kanat";
    $("bolum-ekle").disabled = B.length >= 8;
    $("bolum-ekle").title = B.length >= 8 ? "En fazla 8 bölüm eklenebilir" : "Yeni bir bölüm (köşeden sonraki yüz) ekle";
    hataTemizle();
  }

  // Hesaba bağlı değerler: yazılan kutuya dokunmadan önerilen kanat sayısını ve uyarıları tazeler
  function turevYenile() {
    A.liste().forEach((b, i) => {
      const tr = tabloEl.querySelector(`[data-satir="${i}"]`); if (!tr) return;
      const r = A.hesap(i), uy = r.uyari.length;
      tr.classList.toggle("uyarili", !!uy);
      const no = tr.querySelector(".no");
      no.innerHTML = `${i + 1}${uy ? `<span class="nokta"></span>` : ""}`;
      no.title = uy ? r.uyari.join(" ") : `${i + 1}. bölümün ayrıntıları`;
      const k = tr.querySelector('[data-k="K"]');
      if (b.oto && document.activeElement !== k) { k.value = r.K; k.classList.add("oto"); }
      // kanat sayısı tek ↔ çift olunca toplanma hücresi değişir (Slide Max)
      const td = tr.querySelector("td.toplanma");
      if (td && !!r.orta !== !!td.querySelector("select[disabled]")) td.innerHTML = toplanmaHucre(b, i, r);
    });
    ayrintiSonuc();
  }

  function hataGoster(el, mesaj) { el.classList.add("hatali"); el.setAttribute("aria-invalid", "true"); hataEl.textContent = mesaj; hataEl.hidden = false; }
  function hataKaldir(el) { el.classList.remove("hatali"); el.removeAttribute("aria-invalid"); if (!yan.querySelector(".hatali")) hataTemizle(); }
  function hataTemizle() { hataEl.hidden = true; hataEl.textContent = ""; }
  const sinirMesaj = (k, on) => { const s = SINIR[k]; return `${on}${s.ad}: ${sayi(s.min)} ile ${sayi(s.max)}${s.birim ? " " + s.birim : ""} arasında bir sayı yazın.`; };

  tabloEl.addEventListener("input", e => {
    const el = e.target, k = el.dataset.k; if (!k) return;
    const i = +el.dataset.i, b = A.liste()[i]; if (!b) return;
    if (k === "yuz") { // köşe kutusu yere göre görünür/gizlenir
      b.yuz = el.value;
      // Arka seçilince uzunluğu ön yüzün toplamı olur: yanlar eşitse balkon dört taraftan camla kapanır
      if (b.yuz === "arka") { const on = A.liste().filter(x => (x.yuz || "on") === "on").reduce((t, x) => t + (+x.L || 0), 0); if (on > 0) b.L = on; }
      // Bölümler uç uca çizildiği için soldan sağa dizilir: sağ arka hep sağ tarafa, sol arka hep sol tarafa bağlanır
      const B = A.liste(), YER = { solArka: 0, sol: 1, on: 2, sag: 3, sagArka: 4 };
      // Arka (tam arka) bir yan yüze bağlanır: sağ yan varsa onun ucuna, yoksa sol yanın ucuna
      YER.arka = B.some(x => x.yuz === "sag") ? 3.5 : B.some(x => x.yuz === "sol") ? -0.5 : 5;
      const yer = x => YER[x.yuz || "on"] ?? 2;
      const dizi = B.map((x, j) => [x, j]).sort((p, q) => yer(p[0]) - yer(q[0]) || p[1] - q[1]).map(p => p[0]);
      if (dizi.some((x, j) => x !== B[j])) {
        B.splice(0, B.length, ...dizi);
        A.ciz(); tabloCiz(); sec(B.indexOf(b), true);
        bildir("Bölümler soldan sağa dizildi: " + B.map(x => yuzAd(x.yuz || "on")).join(" · "));
        return;
      }
      A.ciz(); secenekCiz(); return;
    }
    if (k === "yon") { b[k] = el.value; A.ciz(); return; }
    const metin = el.value.trim();
    if (k === "K" && metin === "") { b.oto = true; el.classList.add("oto"); hataKaldir(el); A.ciz(); secenekCiz(); return; }
    const n = sayiOku(metin), s = SINIR[k];
    if (n == null || n < s.min || n > s.max) { hataGoster(el, sinirMesaj(k, `${i + 1}. bölüm ${""}`)); return; }
    hataKaldir(el);
    if (k === "K") { b.oto = false; b.K = n; el.classList.remove("oto"); secenekCiz(); }
    else b[k] = n;
    A.ciz();
  });
  // Geçersiz değer bırakılırsa son geçerli değer geri yazılır
  tabloEl.addEventListener("focusout", e => {
    const el = e.target, k = el.dataset.k; if (!k || el.tagName !== "INPUT") return;
    const b = A.liste()[+el.dataset.i]; if (!b) return;
    if (el.classList.contains("hatali")) {
      el.value = k === "K" ? A.hesap(+el.dataset.i).K : b[k];
      hataKaldir(el);
      bildir(`Yazılan değer geçersizdi; önceki değer (${el.value}) geri kondu.`, true);
    } else if (k !== "K") el.value = b[k];
  });
  // Excel gibi: Enter / aşağı ok alt satır, Shift+Enter / yukarı ok üst satır; kutuya girince içindeki seçilir
  tabloEl.addEventListener("keydown", e => {
    const el = e.target, k = el.dataset.k; if (!k) return;
    const yukari = e.key === "ArrowUp" || (e.key === "Enter" && e.shiftKey);
    if (e.key === "Enter" || (el.tagName === "INPUT" && (e.key === "ArrowDown" || e.key === "ArrowUp"))) {
      e.preventDefault();
      const hedef = tabloEl.querySelector(`[data-i="${+el.dataset.i + (yukari ? -1 : 1)}"][data-k="${k}"]`);
      if (hedef) hedef.focus();
      else if (!yukari && e.key === "Enter") $("bolum-ekle").focus();
    }
  });
  tabloEl.addEventListener("focusin", e => {
    const tr = e.target.closest("[data-satir]"); if (tr) sec(+tr.dataset.satir);
  });

  // Excel gibi: kutuya girince içindeki değer seçilir, yazılan eskisinin yerine geçer.
  // Fareyle tıklamada tarayıcı seçimi bırakınca kaldırmasın diye o tıklamanın mouseup'ı yutulur.
  let yeniOdak = null;
  yan.addEventListener("focusin", e => {
    const el = e.target;
    if (el.tagName !== "INPUT" || el.type === "checkbox" || !(el.dataset.k || el.dataset.g || el.dataset.a)) return;
    el.select(); yeniOdak = el;
  });
  yan.addEventListener("mouseup", e => { if (e.target === yeniOdak) e.preventDefault(); yeniOdak = null; });
  // Bir kutudan çıkınca o düzeltme ayrı bir "geri al" adımı olur
  yan.addEventListener("change", () => { if (anlikT) anlikAl(); });
  let surukleBitti = 0; // sürükleme sonrası gelen tıklama satırı seçmesin
  tabloEl.addEventListener("click", e => { const b = e.target.closest("[data-sec]"); if (b && Date.now() - surukleBitti > 300) sec(+b.dataset.sec); });

  // Sürükle-bırak: satır numarasından tutup yukarı/aşağı çekince bölümün sırası değişir (fare ve parmakla)
  tabloEl.addEventListener("pointerdown", e => {
    const tut = e.target.closest("[data-sec]"); if (!tut || e.button > 0) return;
    const satirlar = [...tabloEl.querySelectorAll("[data-satir]")], bas = +tut.dataset.sec, tr = satirlar[bas];
    if (satirlar.length < 2 || !tr) return;
    const y0 = e.clientY, kutular = satirlar.map(t => t.getBoundingClientRect());
    let surukluyor = false, hedef = bas;
    tut.setPointerCapture(e.pointerId);
    const hareket = ev => {
      const dy = ev.clientY - y0;
      if (!surukluyor) { if (Math.abs(dy) < 6) return; surukluyor = true; tr.classList.add("suruklenen"); tabloEl.classList.add("surukleme"); }
      const ust = kutular[0].top, alt = kutular[kutular.length - 1].bottom;
      const dyS = Math.max(ust - kutular[bas].top, Math.min(alt - kutular[bas].bottom, dy));
      tr.style.transform = `translateY(${dyS}px)`;
      const orta = (kutular[bas].top + kutular[bas].bottom) / 2 + dyS;
      // hedef sıra: ortası sürüklenen satırın ortasından yukarıda kalan diğer satırların sayısı (en üst ve en alt dahil)
      // (eşitlikte yukarıdakiler yerinde, aşağıdakiler yer açar: en üste ve en alta tam oturunca da taşınır)
      hedef = kutular.filter((k, j) => j !== bas && (j < bas ? (k.top + k.bottom) / 2 < orta : (k.top + k.bottom) / 2 <= orta)).length;
      const boy = kutular[bas].height;
      satirlar.forEach((t, j) => { if (j === bas) return;
        t.style.transform = j > bas && j <= hedef ? `translateY(${-boy}px)` : j < bas && j >= hedef ? `translateY(${boy}px)` : ""; });
    };
    const bitir = () => {
      tut.removeEventListener("pointermove", hareket); tut.removeEventListener("pointerup", bitir); tut.removeEventListener("pointercancel", bitir);
      if (!surukluyor) return;
      surukleBitti = Date.now();
      tabloEl.classList.remove("surukleme");
      satirlar.forEach(t => { t.style.transform = ""; t.classList.remove("suruklenen"); });
      if (hedef === bas) return;
      const B = A.liste(), [b] = B.splice(bas, 1); B.splice(hedef, 0, b);
      secili = hedef; A.ciz(); tabloCiz(); sec(hedef, true);
      bildir(`${bas + 1}. bölüm ${hedef + 1}. sıraya taşındı.`, { eylem: { yazi: "Geri al", f: () => gecmisGit(-1) } });
    };
    tut.addEventListener("pointermove", hareket); tut.addEventListener("pointerup", bitir); tut.addEventListener("pointercancel", bitir);
  });

  function sec(i, kaydir) {
    if (i === secili && !kaydir) return;
    secili = i;
    tabloEl.querySelectorAll("[data-satir]").forEach(tr => tr.classList.toggle("secili", +tr.dataset.satir === i));
    secenekCiz();
    if (kaydir) {
      const tr = tabloEl.querySelector(`[data-satir="${i}"]`);
      if (tr) { tr.scrollIntoView({ block: "nearest", behavior: "smooth" }); tr.classList.remove("parla"); void tr.offsetWidth; tr.classList.add("parla"); }
    }
  }
  document.addEventListener("cb3d-sec", e => sec(e.detail, true)); // 3D'de cama tıklandı

  $("bolum-ekle").addEventListener("click", () => {
    const i = A.bolumEkle();
    if (i < 0) { bildir("En fazla 8 bölüm eklenebilir.", true); return; }
    secili = i; tabloCiz(); secenekCiz();
    const L = tabloEl.querySelector(`[data-i="${i}"][data-k="L"]`); if (L) { L.focus(); L.select(); }
  });

  // ======================================================================
  // Seçili bölümün seçenekleri: tablonun altında sabit tek şerit (tablo kıpırdamaz, yalnız içerik değişir)
  // Müşteri yalnız 3D görsel istiyor: yalnız görünüşü değiştiren seçenekler (köşe açısı, menteşeli kanat) ve sil
  // ======================================================================
  const secenekEl = $("secenek");
  function secenekCiz() {
    const B = A.liste(), i = Math.min(secili, B.length - 1), b = B[i]; if (!b) return;
    const h = A.hesap(i), surme = h.surme || h.giyotin; // menteşeli kanat yalnız katlanır sistemde
    // Köşe, önceki bölümle olan birleşimdir (veride önceki bölümün "aci" alanı): bölüm eklenince köşe hemen görünür,
    // geri dönüp önceki bölüme tıklamak gerekmez. 1. bölümün önünde bölüm olmadığı için köşesi yoktur.
    secenekEl.innerHTML = `
      <div class="sec-satir">
        <span class="rozet" title="Seçili bölüm">${i + 1}</span>
        <div class="sec-alanlar">
        ${i === 0 || yuz(B[i - 1]) === yuz(b) ? "" : `<label class="sec-alan" title="${i}. ve ${i + 1}. bölüm arasındaki köşe">Köşe<span class="giris"><input data-a="aci" data-hedef="${i - 1}" inputmode="numeric" autocomplete="off" value="${B[i - 1].aci}" aria-label="${i}. ve ${i + 1}. bölüm arasındaki köşe açısı"><span>°</span></span></label>`}
        ${surme ? "" : `<span class="sec-alan">Menteşeli<span class="secim kucuk" role="group" aria-label="Menteşeli kanat"><button type="button" data-a="I" data-v="1" aria-pressed="${b.I > 0}">Var</button><button type="button" data-a="I" data-v="0" aria-pressed="${!(b.I > 0)}">Yok</button></span></span>`}
        </div>
        <button type="button" class="sil-ik" data-a="sil"${B.length < 2 ? " disabled" : ""} title="${B.length < 2 ? "Tek bölüm silinemez" : `${i + 1}. bölümü sil`}" aria-label="${i + 1}. bölümü sil">${ikon("sil")}</button>
      </div>
      <div class="uyarilar" id="ay-uyari"></div>`;
    ayrintiSonuc();
  }
  function ayrintiSonuc() {
    const u = $("ay-uyari"); if (!u) return;
    const r = A.hesap(secili); if (!r) return;
    u.innerHTML = r.uyari.map(m => `<p>${ikon("uyari")}${esc(m)}</p>`).join("");
  }
  secenekEl.addEventListener("input", e => {
    const el = e.target, k = el.dataset.a; if (!k) return;
    const b = A.liste()[el.dataset.hedef != null ? +el.dataset.hedef : secili]; if (!b) return;
    const n = sayiOku(el.value), s = SINIR[k];
    if (n == null || n < s.min || n > s.max) { hataGoster(el, sinirMesaj(k, "")); return; }
    hataKaldir(el); b[k] = n; A.ciz();
  });
  secenekEl.addEventListener("focusout", e => {
    const el = e.target, k = el.dataset.a; if (!k || el.tagName !== "INPUT" || el.type === "checkbox") return;
    const b = A.liste()[el.dataset.hedef != null ? +el.dataset.hedef : secili]; if (!b || !el.classList.contains("hatali")) return;
    el.value = b[k]; hataKaldir(el);
    bildir("Yazılan değer geçersizdi; önceki değer geri kondu.", true);
  });
  secenekEl.addEventListener("click", e => {
    const el = e.target.closest("[data-a]"); if (!el || el.tagName !== "BUTTON") return;
    const b = A.liste()[secili]; if (!b) return;
    if (el.dataset.a === "I") { b.I = +el.dataset.v; A.ciz(); secenekCiz(); }
    if (el.dataset.a === "sil") {
      const no = secili + 1;
      if (anlikT) anlikAl();
      A.bolumSil(secili); secili = Math.max(0, secili - 1); tabloCiz(); secenekCiz();
      bildir(`${no}. bölüm silindi.`, { eylem: { yazi: "Geri al", f: () => gecmisGit(-1) } });
    }
  });

  // ======================================================================
  // Renk ve sistem (stüdyonun gizli girişlerine yazılır)
  // ======================================================================
  const tetikle = (el, deger) => { el.value = deger; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change")); };
  function genelYansit() {
    const d = A.durum();
    yan.querySelectorAll("[data-sistem]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sistem === d.sistem)));
    yan.querySelectorAll("[data-profil]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.profil === d.profil)));
    $("y-profil-ad").textContent = PROFILLER.find(p => p[0] === d.profil)?.[1] || ""; // renk adı yalnız seçili için yazar
    yan.querySelectorAll("[data-cam-renk]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.camRenk === d.cam)));
    yan.querySelectorAll("[data-parapet-satir]").forEach(el => { el.hidden = d.sistem === "giyotin"; }); // giyotinde parapet yok
    yan.querySelectorAll("[data-parapet-tip]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.parapetTip === d.parapetTip)));
    yan.querySelectorAll("[data-manzara]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.manzara === d.manzara)));
    for (const el of yan.querySelectorAll("[data-g]")) if (document.activeElement !== el) { el.value = d[el.dataset.g]; hataKaldir(el); }
  }
  yan.addEventListener("click", e => {
    const s = e.target.closest("[data-sistem]"), p = e.target.closest("[data-profil]"), c = e.target.closest("[data-cam-renk]"), m = e.target.closest("[data-manzara]"), pt = e.target.closest("[data-parapet-tip]");
    if (s) {
      // Giyotinde parapet yok, cam yerden tavana çıkar: geçişte balkonun toplam yüksekliği aynı kalsın diye parapet yüksekliğe eklenir/düşülür
      const eski = A.durum().sistem, yeni = s.dataset.sistem, par = +A.durum().parapet || 0;
      A.sistemSec(yeni);
      if (par > 0 && (eski === "giyotin") !== (yeni === "giyotin"))
        A.liste().forEach(b => { b.H = yeni === "giyotin" ? Math.min(SINIR.H.max, b.H + par) : Math.max(SINIR.H.min, b.H - par); });
      A.ciz(); tabloCiz(); secenekCiz();
      bildir(yeni === "giyotin" && eski !== "giyotin" && par > 0
        ? `Sistem: ${A.sistemAdi()} · parapet yok, yükseklik yerden tavana yazıldı`
        : `Sistem: ${A.sistemAdi()}`);
    }
    if (p) tetikle($("g-profil"), p.dataset.profil);
    if (c) tetikle($("g-cam"), c.dataset.camRenk);
    if (m) A.manzaraSec(m.dataset.manzara);
    if (pt) A.parapetTipSec(pt.dataset.parapetTip);
    if (s || p || c || m || pt) genelYansit();
  });
  yan.addEventListener("input", e => {
    const el = e.target, k = el.dataset.g; if (!k) return;
    const n = sayiOku(el.value), s = SINIR[k];
    if (n == null || n < s.min || n > s.max) { hataGoster(el, sinirMesaj(k, "")); return; }
    hataKaldir(el);
    tetikle($(k === "parapet" ? "g-parapet" : "g-maxw"), n);
    if (k === "maxW") setTimeout(() => { tabloCiz(); secenekCiz(); }, 0);
  });
  yan.addEventListener("focusout", e => {
    const el = e.target; if (!el.dataset.g || !el.classList.contains("hatali")) return;
    el.value = A.durum()[el.dataset.g]; hataKaldir(el);
    bildir("Yazılan değer geçersizdi; önceki değer geri kondu.", true);
  });
  function hepsiniCiz() { tabloCiz(); secenekCiz(); genelYansit(); }

  // ======================================================================
  // 3D düğmeleri
  // ======================================================================
  const ipucu = $("v-ipucu");
  const ipucuKapat = () => ipucu.classList.add("gizli");
  document.addEventListener("cb3d-kamera", ipucuKapat);
  viewer.addEventListener("click", e => {
    const g = e.target.closest(".v-gorunum [data-cam]");
    if (g) { const m = g.dataset.cam; A.gorunum(m === "ic" && A.gorunumAdi() === "ic" ? "iso" : m); }
  });
  $("v-kanat").addEventListener("click", () => { $("oynat").click(); $("v-kanat").querySelector("span").textContent = $("oynat").textContent; });
  $("v-olcu").addEventListener("click", () => {
    $("olcu").click();
    const acikMi = $("olcu").getAttribute("aria-pressed") === "true";
    $("v-olcu").setAttribute("aria-pressed", String(acikMi));
    $("v-olcu").querySelector("span").textContent = acikMi ? "Ölçüleri gizle" : "Ölçüleri göster";
  });

  // ======================================================================
  // Kaydet / Yeni
  // ======================================================================
  // 3D görüntüdeki beyaz boşluğu atar, modeli G×Y alana kenar payıyla sığdırır.
  // Görüntü büyük çizilip küçültüldüğü için netlik kaybolmaz.
  function kirp(kaynak, G, Y, kenar) {
    const w = kaynak.width, h = kaynak.height, v = kaynak.getContext("2d").getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * 4;
      if (v[i] < 246 || v[i + 1] < 246 || v[i + 2] < 246) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const c = document.createElement("canvas"); c.width = G; c.height = Y;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, G, Y);
    if (x1 < 0) { x.drawImage(kaynak, 0, 0, G, Y); return c; }
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2);
    const bw = Math.min(w, x1 + 3) - x0, bh = Math.min(h, y1 + 3) - y0, olc = Math.min((G - 2 * kenar) / bw, (Y - 2 * kenar) / bh);
    x.imageSmoothingQuality = "high";
    x.drawImage(kaynak, x0, y0, bw, bh, (G - bw * olc) / 2, (Y - bh * olc) / 2, bw * olc, bh * olc);
    return c;
  }
  function kucukResim() {
    try { return kirp(A.goruntu(720, 440), 360, 220, 10).toDataURL("image/jpeg", 0.75); } catch (e) { console.error(e); return ""; }
  }
  async function kaydet() {
    const ad = adEl.value.trim();
    if (!ad) {
      adEl.focus(); adEl.classList.add("dikkat"); setTimeout(() => adEl.classList.remove("dikkat"), 1600);
      bildir("Kaydetmek için önce yukarıya müşteri adını yazın.", true); return false;
    }
    const simdi = new Date().toISOString();
    const p = { id: acik.id || "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ad, kayit: simdi, durum: A.durum(), resim: kucukResim() };
    try {
      const eski = acik.id ? await VT.al(acik.id) : null;
      p.olusturma = (eski && eski.olusturma) || simdi;
      await VT.yaz(p);
    } catch (e) {
      console.error(e); bildir("Kaydedilemedi: " + (e && e.name === "QuotaExceededError" ? "cihazda yer kalmadı." : (e.message || "bilinmeyen hata")), true); return false;
    }
    acik = { id: p.id, kayit: simdi }; degisti = false; durumYaz(); taslakHemen();
    bildir(`“${ad}” kaydedildi.`);
    return true;
  }
  $("pr-kaydet").addEventListener("click", kaydet);

  $("pr-yeni").addEventListener("click", async () => {
    if (!(await kaybolsunMu())) return;
    yukle(VARSAYILAN, "", null, null);
    // En az adım: hemen ölçü yazılsın; müşteri adı kaydederken istenir
    const L = tabloEl.querySelector('[data-i="0"][data-k="L"]'); if (L) { L.focus(); L.select(); }
  });

  // Klavye: Ctrl+S kaydet, Ctrl+Z geri al, Ctrl+Y / Ctrl+Shift+Z yinele (müşteri adı kutusunda tarayıcınınki çalışır)
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const t = e.key.toLocaleLowerCase("tr");
    if (t === "s") { e.preventDefault(); kaydet(); return; }
    if (document.querySelector("dialog[open]") || e.target === adEl) return;
    if (t === "z" && !e.shiftKey) { e.preventDefault(); gecmisGit(-1); }
    else if (t === "y" || (t === "z" && e.shiftKey)) { e.preventDefault(); gecmisGit(1); }
  });

  // ======================================================================
  // Projelerim
  // ======================================================================
  async function projeler() {
    const d = pencere("Projelerim",
      `<input class="pl-ara" type="search" placeholder="Müşteri adına göre ara" aria-label="Proje ara"><div class="pl" aria-live="polite"><div class="pl-bos">Yükleniyor…</div></div>`,
      `<p class="cb-not ara">Projeler bu cihazda saklanır. Ayda bir yedek indirmeniz önerilir; yedek dosyasıyla projeleri diğer cihaza da taşıyabilirsiniz.</p>
       <button type="button" data-yedek-al>${ikon("indir")}Yedek indir</button>
       <button type="button" data-yedek-yukle>Yedekten yükle</button>
       <input type="file" accept=".json,application/json" hidden>`, "genis");
    const listeEl = d.querySelector(".pl"), araEl = d.querySelector(".pl-ara"), dosyaEl = d.querySelector('input[type="file"]');
    let liste = [];
    const ciz = () => {
      const q = araEl.value.trim().toLocaleLowerCase("tr");
      const g = liste.filter(p => !q || String(p.ad).toLocaleLowerCase("tr").includes(q));
      listeEl.innerHTML = g.length ? g.map(p => {
        const b = (p.durum && p.durum.bolumler) || [], uzun = b.reduce((t, x) => t + (+x.L || 0), 0);
        return `<div class="pl-kart${p.id === acik.id ? " acik" : ""}">
          ${p.resim ? `<img src="${esc(p.resim)}" alt="" loading="lazy">` : `<img alt="">`}
          <div class="pl-bilgi"><b title="${esc(p.ad)}">${esc(p.ad)}</b><small>${esc(tarihYaz(p.kayit))}</small><small>${b.length} bölüm · toplam ${(uzun / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m</small>${p.id === acik.id ? `<small class="su-an">Şu an açık</small>` : ""}</div>
          <div class="pl-dug"><button type="button" class="birincil ac" data-ac="${esc(p.id)}">Aç</button><button type="button" class="sil-k" data-sil="${esc(p.id)}" aria-label="${esc(p.ad)} projesini sil">${ikon("sil")}Sil</button></div>
        </div>`;
      }).join("") : `<div class="pl-bos">${liste.length ? "Aramaya uyan proje yok." : "Henüz kayıtlı proje yok.<br>Müşteri adını yazıp Kaydet'e basınca burada görünür."}</div>`;
    };
    const yenile = async () => {
      try { liste = (await VT.hepsi()).sort((a, b) => String(b.kayit).localeCompare(String(a.kayit))); }
      catch (e) { console.error(e); listeEl.innerHTML = `<div class="pl-bos">Projeler okunamadı: ${esc(e.message)}</div>`; return; }
      ciz();
    };
    araEl.addEventListener("input", ciz);
    listeEl.addEventListener("click", async e => {
      const ac = e.target.closest("[data-ac]"), sil = e.target.closest("[data-sil]");
      if (ac) {
        const p = liste.find(x => x.id === ac.dataset.ac); if (!p) return;
        if (p.id !== acik.id && !(await kaybolsunMu())) return;
        yukle(p.durum, p.ad, p.id, p.kayit); d.close(); bildir(`“${p.ad}” açıldı.`);
      }
      if (sil) {
        const p = liste.find(x => x.id === sil.dataset.sil); if (!p) return;
        if (!(await sor({ baslik: "Proje silinsin mi?", metin: `“${p.ad}” projesi bu cihazdan silinecek. Bu işlem geri alınamaz.`, evet: "Evet, sil", tehlike: true }))) return;
        try { await VT.sil(p.id); } catch (err) { bildir("Silinemedi: " + err.message, true); return; }
        if (p.id === acik.id) { acik = { id: null, kayit: null }; degisti = true; durumYaz(); taslakYaz(); }
        bildir(`“${p.ad}” silindi.`);
        await yenile();
      }
    });
    d.querySelector("[data-yedek-al]").addEventListener("click", async () => {
      const hepsi = await VT.hepsi();
      if (!hepsi.length) { bildir("Yedeklenecek proje yok.", true); return; }
      const veri = { tur: "aloglu-cam-balkon-3d", surum: 1, tarih: new Date().toISOString(), projeler: hepsi };
      const g = new Date(), ad = `cam-balkon-3d-yedek-${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}.json`;
      indir(new Blob([JSON.stringify(veri)], { type: "application/json" }), ad);
      bildir(`${hepsi.length} proje yedek dosyasına yazıldı (İndirilenler klasörü).`);
    });
    d.querySelector("[data-yedek-yukle]").addEventListener("click", () => dosyaEl.click());
    dosyaEl.addEventListener("change", async () => {
      const f = dosyaEl.files && dosyaEl.files[0]; dosyaEl.value = ""; if (!f) return;
      let veri;
      try { veri = JSON.parse(await f.text()); } catch (e) { bildir("Dosya okunamadı: geçerli bir yedek dosyası değil.", true); return; }
      const gelen = veri && veri.tur === "aloglu-cam-balkon-3d" && Array.isArray(veri.projeler) ? veri.projeler : null;
      if (!gelen) { bildir("Bu dosya Aloğlu Cam Balkon 3D yedeği değil.", true); return; }
      // Aynı proje iki yerde varsa son kaydedilen kalır
      const mevcut = new Map((await VT.hepsi()).map(p => [p.id, p]));
      let eklenen = 0, guncellenen = 0;
      for (const p of gelen) {
        if (!p || typeof p.id !== "string" || !p.durum || !Array.isArray(p.durum.bolumler)) continue;
        const m = mevcut.get(p.id);
        if (m && String(m.kayit) >= String(p.kayit)) continue;
        await VT.yaz({ id: p.id, ad: String(p.ad || "Adsız"), kayit: p.kayit, olusturma: p.olusturma || p.kayit, durum: p.durum, resim: typeof p.resim === "string" && p.resim.startsWith("data:image/") ? p.resim : "" });
        m ? guncellenen++ : eklenen++;
      }
      await yenile();
      bildir(eklenen || guncellenen ? `Yedekten ${eklenen} yeni proje eklendi${guncellenen ? `, ${guncellenen} proje güncellendi` : ""}.` : "Yedekteki projelerin hepsi zaten bu cihazda var.");
    });
    yenile();
  }
  $("pr-ac").addEventListener("click", projeler);

  // ======================================================================
  // Görsel
  // ======================================================================
  const yaziTipleri = () => Promise.race([
    Promise.all(['800 64px "Baloo 2"', '600 24px "Oswald"', '400 24px "Roboto Condensed"', '500 24px "IBM Plex Mono"'].map(f => document.fonts.load(f, "ĞŞİÇÖÜ"))),
    new Promise(c => setTimeout(c, 1500)),
  ]).catch(() => {});
  const logoAl = () => new Promise(coz => {
    const kaynak = document.querySelector(".brand img"); if (!kaynak) return coz(null);
    const i = new Image(); i.onload = () => coz(i); i.onerror = () => coz(null); i.src = kaynak.src;
  });
  const PROFIL_AD = Object.fromEntries(PROFILLER.map(([v, ad]) => [v, ad]));

  async function gorselUret() {
    await yaziTipleri();
    const logo = await logoAl();
    const G = 1800, R = 1100, UST = 170, ozet = A.ozet(), satir = Math.ceil(ozet.length / 2);
    const ALT = 120 + satir * 54 + 70;
    const c = document.createElement("canvas"); c.width = G; c.height = UST + R + ALT;
    const x = c.getContext("2d");
    const KIRMIZI = "#c1342a", KAHVE = "#6d412c", MUREKKEP = "#3a2317", SOLUK = "#7b6151", CIZGI = "#e2d6b6";
    x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);

    // Başlık bandı + tente çizgisi
    x.fillStyle = KIRMIZI; x.fillRect(0, 0, G, 150);
    for (let i = 0; i < G; i += 56) { x.fillStyle = KIRMIZI; x.fillRect(i, 150, 28, 20); x.fillStyle = "#fff"; x.fillRect(i + 28, 150, 28, 20); }
    x.fillStyle = KIRMIZI; x.fillRect(0, 168, G, 2);
    if (logo) {
      x.save(); x.beginPath(); x.arc(95, 75, 52, 0, Math.PI * 2); x.fillStyle = "#fff"; x.fill(); x.clip();
      x.drawImage(logo, 43, 23, 104, 104); x.restore();
      x.beginPath(); x.arc(95, 75, 53, 0, Math.PI * 2); x.strokeStyle = "#fff"; x.lineWidth = 3; x.stroke();
    }
    x.textBaseline = "alphabetic"; x.textAlign = "left"; x.fillStyle = "#fff";
    x.font = '800 66px "Baloo 2", "Arial Rounded MT Bold", sans-serif'; x.fillText("ALOĞLU", 172, 86);
    x.font = '600 23px "Oswald", "Arial Narrow", sans-serif';
    if ("letterSpacing" in x) x.letterSpacing = "4px";
    x.fillText("TENTE – CAM BALKON · 3D TASARIM", 174, 124);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    x.textAlign = "right";
    const ad = adEl.value.trim();
    if (ad) { x.font = '600 44px "Oswald", "Arial Narrow", sans-serif'; x.fillText(ad.length > 38 ? ad.slice(0, 37) + "…" : ad, G - 48, 80); }
    x.font = '400 26px "Roboto Condensed", "Arial Narrow", sans-serif'; x.fillText(new Date().toLocaleDateString("tr-TR"), G - 48, ad ? 122 : 92);

    // 3D görünüm
    x.drawImage(kirp(A.goruntu(2700, 1650), G, R, 60), 0, UST, G, R);

    // Bölümler
    let y = UST + R + 24;
    x.fillStyle = CIZGI; x.fillRect(48, y, G - 96, 2); y += 52;
    x.textAlign = "left"; x.fillStyle = KAHVE; x.font = '600 26px "Oswald", "Arial Narrow", sans-serif';
    if ("letterSpacing" in x) x.letterSpacing = "3px";
    x.fillText("BÖLÜMLER", 48, y);
    if ("letterSpacing" in x) x.letterSpacing = "0px";
    const d = A.durum();
    x.textAlign = "right"; x.fillStyle = MUREKKEP; x.font = '400 25px "Roboto Condensed", "Arial Narrow", sans-serif';
    x.fillText(`${A.sistemAdi()}   ·   Profil: ${PROFIL_AD[d.profil] || d.profil}   ·   Cam: ${d.cam === "siyah" ? "Siyah filmli" : d.cam === "seffaf" ? "Şeffaf" : "Füme"} ${A.camYapi()}`, G - 48, y);
    y += 22;
    const kolon = (G - 96) / 2;
    ozet.forEach((b, i) => {
      const sx = 48 + (i % 2) * kolon, sy = y + Math.floor(i / 2) * 54 + 14;
      x.fillStyle = KIRMIZI; x.beginPath();
      if (x.roundRect) x.roundRect(sx, sy, 40, 40, 8); else x.rect(sx, sy, 40, 40);
      x.fill();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.font = '800 26px "Baloo 2", sans-serif'; x.fillText(String(b.no), sx + 20, sy + 30);
      x.textAlign = "left"; x.fillStyle = MUREKKEP; x.font = '600 25px "Oswald", "Arial Narrow", sans-serif';
      x.fillText(b.yuz.toLocaleUpperCase("tr"), sx + 56, sy + 29);
      const gen = x.measureText(b.yuz.toLocaleUpperCase("tr")).width;
      x.font = '500 23px "IBM Plex Mono", monospace'; x.fillStyle = MUREKKEP;
      x.fillText(`${sayi(b.L)} × ${sayi(b.H)} mm`, sx + 56 + gen + 18, sy + 29);
      const gen2 = x.measureText(`${sayi(b.L)} × ${sayi(b.H)} mm`).width;
      x.font = '400 23px "Roboto Condensed", "Arial Narrow", sans-serif'; x.fillStyle = SOLUK;
      x.fillText(`${b.K} kanat · toplanma ${b.orta ? "iki yana" : b.yon === "SOL" ? "solda" : "sağda"}`, sx + 56 + gen + 18 + gen2 + 18, sy + 29);
    });
    y += satir * 54 + 50;
    x.fillStyle = SOLUK; x.textAlign = "left"; x.font = '400 21px "Roboto Condensed", "Arial Narrow", sans-serif';
    x.fillText("Bu görsel bilgilendirme amaçlıdır; kesin ölçüler yerinde keşifle belirlenir.", 48, y);
    x.textAlign = "right"; x.fillStyle = KIRMIZI; x.font = '600 22px "Oswald", "Arial Narrow", sans-serif';
    x.fillText("Aloğlu Tente – Cam Balkon", G - 48, y);
    return c;
  }

  async function gorsel() {
    const d = pencere("Müşteriye gönderilecek görsel",
      `<div class="gv-bekle">Görsel hazırlanıyor…</div>
       <p class="cb-not" style="margin-top:12px">Görsel, ekrandaki 3D görünümden alınır. Açıyı değiştirmek için bu pencereyi kapatıp modeli çevirin. Ölçülerin görselde yazması için önce “Ölçüleri göster”e basın.</p>`,
      `<span class="ara"></span>
       <button type="button" data-yazdir disabled>${ikon("yazdir")}Yazdır</button>
       <button type="button" data-indir disabled>${ikon("indir")}Bilgisayara indir</button>
       <button type="button" class="birincil" data-paylas disabled hidden>${ikon("paylas")}Paylaş (WhatsApp…)</button>`, "genis");
    let blob = null, url = null;
    d.addEventListener("close", () => { if (url) URL.revokeObjectURL(url); });
    try {
      const c = await gorselUret();
      blob = await blobAl(c, "image/jpeg", 0.92);
      url = URL.createObjectURL(blob);
    } catch (e) {
      console.error(e); d.querySelector(".gv-bekle").textContent = "Görsel hazırlanamadı: " + e.message; return;
    }
    const ad = dosyaAdi(adEl.value) + "-3d.jpg";
    const yer = d.querySelector(".gv-bekle");
    const img = new Image(); img.className = "gv-resim"; img.alt = "Hazırlanan 3D görsel"; img.src = url; yer.replaceWith(img);
    const dosya = new File([blob], ad, { type: "image/jpeg" });
    const paylasBtn = d.querySelector("[data-paylas]");
    let paylasilir = false; try { paylasilir = !!(navigator.canShare && navigator.canShare({ files: [dosya] })); } catch (e) {}
    paylasBtn.hidden = !paylasilir;
    if (!paylasilir) d.querySelector("[data-indir]").classList.add("birincil");
    d.querySelectorAll("button[disabled]").forEach(b => { b.disabled = false; });
    paylasBtn.addEventListener("click", async () => {
      try { await navigator.share({ files: [dosya], title: "Cam balkon 3D tasarım" }); }
      catch (e) { if (e && e.name !== "AbortError") bildir("Paylaşılamadı: " + e.message, true); }
    });
    d.querySelector("[data-indir]").addEventListener("click", () => { indir(blob, ad); bildir("Görsel İndirilenler klasörüne kaydedildi: " + ad); });
    d.querySelector("[data-yazdir]").addEventListener("click", () => {
      let alan = $("yazdir"); if (!alan) { alan = document.createElement("div"); alan.id = "yazdir"; document.body.appendChild(alan); }
      const yi = new Image(); yi.alt = ""; alan.replaceChildren(yi);
      yi.onload = () => setTimeout(() => window.print(), 50);
      yi.src = img.src;
    });
  }
  $("pr-gorsel").addEventListener("click", gorsel);

  // Yardım penceresi kaldırıldı (müşteri istemedi)


  // ======================================================================
  // Açılış: son taslağa devam
  // ======================================================================
  // Ayarlar ekranı kaldırıldı (müşteri yalnız 3D görsel istiyor): eskiden değiştirilmiş değer kaldıysa silinir, Excel değerleri geçerli
  try { localStorage.removeItem("cb3d-sistem-ayarlari"); } catch (e) {}
  const t = lsOku(TASLAK, null);
  if (t && t.durum && Array.isArray(t.durum.bolumler)) {
    yukle(t.durum, t.ad, t.id, t.kayit);
    degisti = !!t.degisti; durumYaz();
  } else {
    yukle(VARSAYILAN, "", null, null);
  }

  // ---------- Çevrimdışı çalışma (yalnız web adresinden açılınca; PC'de dosyadan açılır) ----------
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(e => console.warn("Çevrimdışı önbellek kurulamadı:", e)));
    // Güncelleme: açılış önbellekten olduğu için yeni sürüm arka planda iner; inince kullanıcıya söylenir (ilk kurulumda değil)
    const eskiSurumVardi = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!eskiSurumVardi) return;
      bildir("Programın yeni sürümü hazır.", { eylem: { yazi: "Şimdi aç", f: () => { taslakHemen(); location.reload(); } }, sure: 30000 });
    });
  }
})();
