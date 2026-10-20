// Kar Çarkı oyun mantığı ve arayüzü
(() => {
  const KAYIT = "karcarki-v1";
  const IPUCU_FIYAT = 20;
  const BONUS_ODUL = 2;
  const $ = id => document.getElementById(id);
  const buyuk = s => s.toLocaleUpperCase("tr");
  const sayi = n => n.toLocaleString("tr-TR");

  // ---- Kayıt ----
  let durum = { seviye: 1, para: 40, bulunan: [], bonus: [], ipucu: [], ilk: true };
  try {
    const k = JSON.parse(localStorage.getItem(KAYIT));
    if (k && k.seviye) durum = Object.assign(durum, k);
  } catch (e) {}
  function kaydet() { try { localStorage.setItem(KAYIT, JSON.stringify(durum)); } catch (e) {} }

  let seviye = null;      // üretilmiş seviye
  let hucreler = {};      // "x,y" -> { el, h }
  let harfler = [];       // çarktaki harfler (sıra karıştırılabilir)
  let bitti = false;

  // ---- Seviye kur ----
  function seviyeKur() {
    seviye = Uretici.uret(durum.seviye);
    harfler = seviye.harfler.slice();
    bitti = false;
    $("seviyeNo").textContent = sayi(durum.seviye);
    $("para").textContent = sayi(durum.para);
    tabloCiz();
    carkCiz();
    bonusGuncelle();
    // Kaydedilmiş ilerlemeyi geri yükle
    for (const w of durum.bulunan) kelimeAc(w, false);
    for (const k of durum.ipucu) if (hucreler[k]) hucreAc(k, "ipucu", false);
    if (tamamMi()) setTimeout(seviyeBitti, 400);
  }

  function tabloCiz() {
    const t = $("tablo");
    t.innerHTML = "";
    hucreler = {};
    const harita = {};
    for (const p of seviye.yerler) {
      for (let i = 0; i < p.kelime.length; i++) {
        harita[(p.x + (p.yatay ? i : 0)) + "," + (p.y + (p.yatay ? 0 : i))] = p.kelime[i];
      }
    }
    t.style.gridTemplateColumns = `repeat(${seviye.genislik}, var(--h))`;
    for (let y = 0; y < seviye.yukseklik; y++) {
      for (let x = 0; x < seviye.genislik; x++) {
        const el = document.createElement("div");
        const k = x + "," + y;
        el.className = "hucre";
        if (harita[k]) {
          el.classList.add("dolu");
          hucreler[k] = { el, h: harita[k], acik: false };
        }
        t.appendChild(el);
      }
    }
    boyutla();
  }

  function boyutla() {
    if (!seviye) return;
    const alan = $("tabloAlan");
    const w = alan.clientWidth, h = alan.clientHeight - 20;
    const bosluk = 4;
    const boy = Math.floor(Math.min(
      (w - bosluk * (seviye.genislik - 1)) / seviye.genislik,
      (h - bosluk * (seviye.yukseklik - 1)) / seviye.yukseklik,
      58
    ));
    document.documentElement.style.setProperty("--h", Math.max(18, boy) + "px");
  }
  window.addEventListener("resize", boyutla);

  function hucreAc(k, tur, animasyon) {
    const c = hucreler[k];
    if (!c) return;
    if (c.acik && tur === "ipucu") return;
    c.el.textContent = buyuk(c.h);
    c.el.classList.add("acik");
    if (tur === "ipucu" && !c.acik) c.el.classList.add("ipucu");
    if (tur !== "ipucu") c.el.classList.remove("ipucu");
    if (animasyon) {
      c.el.classList.remove("yeni"); void c.el.offsetWidth; c.el.classList.add("yeni");
    }
    c.acik = true;
  }

  function kelimeHucreleri(p) {
    const s = [];
    for (let i = 0; i < p.kelime.length; i++) s.push((p.x + (p.yatay ? i : 0)) + "," + (p.y + (p.yatay ? 0 : i)));
    return s;
  }

  function kelimeAc(w, animasyon) {
    for (const p of seviye.yerler) {
      if (p.kelime !== w) continue;
      kelimeHucreleri(p).forEach((k, i) => {
        if (animasyon) {
          const c = hucreler[k];
          const oncedenAcik = c.acik && !c.el.classList.contains("ipucu");
          c.acik = true; // durum hemen güncellensin, görüntü sırayla gelsin
          if (!oncedenAcik) setTimeout(() => { c.acik = false; hucreAc(k, "kelime", true); }, i * 60);
        } else hucreAc(k, "kelime", false);
      });
    }
  }

  function tamamMi() {
    return Object.values(hucreler).every(c => c.acik);
  }

  // İpucuyla tamamen açılan kelimeleri de bulunmuş say
  function ipucuylaBitenler() {
    for (const p of seviye.yerler) {
      if (durum.bulunan.includes(p.kelime)) continue;
      if (kelimeHucreleri(p).every(k => hucreler[k].acik)) durum.bulunan.push(p.kelime);
    }
  }

  // ---- Çark ----
  const cark = $("cark");
  const cizgi = $("cizgi");
  let harfEl = [];
  function carkCiz() {
    cark.querySelectorAll(".harf").forEach(e => e.remove());
    harfEl = harfler.map(h => {
      const el = document.createElement("div");
      el.className = "harf";
      el.textContent = buyuk(h);
      cark.appendChild(el);
      return el;
    });
    harfYerlestir();
  }
  function harfYerlestir() {
    const n = harfler.length;
    const r = n <= 4 ? 32 : n <= 6 ? 34 : 35; // yüzde
    harfEl.forEach((el, i) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      el.style.left = (50 + r * Math.cos(a)) + "%";
      el.style.top = (50 + r * Math.sin(a)) + "%";
    });
  }

  let yol = [];        // seçilen harf indeksleri
  let suruyor = false;
  let imlec = null;

  function merkez(i) {
    const cr = cark.getBoundingClientRect();
    const r = harfEl[i].getBoundingClientRect();
    return { x: r.left + r.width / 2 - cr.left, y: r.top + r.height / 2 - cr.top, yaricap: r.width / 2 };
  }
  function harfBul(e) {
    const cr = cark.getBoundingClientRect();
    const px = e.clientX - cr.left, py = e.clientY - cr.top;
    for (let i = 0; i < harfEl.length; i++) {
      const m = merkez(i);
      if (Math.hypot(px - m.x, py - m.y) < m.yaricap * 1.05) return i;
    }
    return -1;
  }
  function cizgiGuncelle() {
    if (!yol.length) { cizgi.innerHTML = ""; return; }
    const noktalar = yol.map(i => { const m = merkez(i); return m.x + "," + m.y; });
    if (imlec && suruyor) noktalar.push(imlec.x + "," + imlec.y);
    cizgi.innerHTML = `<polyline points="${noktalar.join(" ")}"/>`;
  }
  function onizlemeGoster(sinif) {
    const o = $("onizleme");
    o.className = "onizleme" + (sinif ? " " + sinif : "");
    const kelime = yol.map(i => harfler[i]).join("");
    o.innerHTML = kelime ? `<span>${buyuk(kelime)}</span>` : "";
  }
  function secimGuncelle() {
    harfEl.forEach((el, i) => el.classList.toggle("secili", yol.includes(i)));
    cizgiGuncelle();
    onizlemeGoster();
  }

  cark.addEventListener("pointerdown", e => {
    if (bitti) return;
    const i = harfBul(e);
    if (i < 0) return;
    e.preventDefault();
    clearTimeout(temizleZamani);
    cark.setPointerCapture(e.pointerId);
    suruyor = true;
    yol = [i];
    titret(8);
    secimGuncelle();
  });
  cark.addEventListener("pointermove", e => {
    if (!suruyor) return;
    const cr = cark.getBoundingClientRect();
    imlec = { x: e.clientX - cr.left, y: e.clientY - cr.top };
    const i = harfBul(e);
    if (i >= 0) {
      if (yol.length > 1 && yol[yol.length - 2] === i) { yol.pop(); titret(5); secimGuncelle(); return; }
      if (!yol.includes(i)) { yol.push(i); titret(8); secimGuncelle(); return; }
    }
    cizgiGuncelle();
  });
  function birak() {
    if (!suruyor) return;
    suruyor = false;
    imlec = null;
    const kelime = yol.map(i => harfler[i]).join("");
    yol.length > 1 ? dene(kelime) : temizle(0);
  }
  cark.addEventListener("pointerup", birak);
  cark.addEventListener("pointercancel", birak);

  let temizleZamani;
  function temizle(gecikme) {
    clearTimeout(temizleZamani);
    temizleZamani = setTimeout(() => {
      if (suruyor) return;
      yol = [];
      harfEl.forEach(el => el.classList.remove("secili"));
      cizgi.innerHTML = "";
      if (!suruyor) $("onizleme").innerHTML = "";
    }, gecikme);
    harfEl.forEach(el => el.classList.remove("secili"));
    cizgi.innerHTML = "";
  }

  // ---- Kelime denemesi ----
  function dene(w) {
    const yerdeki = seviye.yerler.some(p => p.kelime === w);
    if (yerdeki) {
      if (durum.bulunan.includes(w)) {
        onizlemeGoster("zaten");
        bildir("Bunu zaten buldun");
        parlat(w);
      } else {
        onizlemeGoster("dogru");
        durum.bulunan.push(w);
        kelimeAc(w, true);
        titret([10, 40, 10]);
        ipucuylaBitenler();
        kaydet();
        if (tamamMi()) setTimeout(seviyeBitti, w.length * 60 + 450);
      }
    } else if (w.length >= 3 && Uretici.gecerliBonus(w)) {
      if (durum.bonus.includes(w)) {
        onizlemeGoster("zaten");
        bildir("Bonus olarak zaten buldun");
      } else {
        onizlemeGoster("bonus");
        durum.bonus.push(w);
        paraEkle(BONUS_ODUL);
        bildir(`Bonus kelime! +${BONUS_ODUL} ❄`);
        bonusGuncelle();
        kaydet();
      }
    } else {
      onizlemeGoster("yanlis");
      titret(30);
    }
    temizle(650);
  }

  function parlat(w) {
    for (const p of seviye.yerler) if (p.kelime === w) {
      for (const k of kelimeHucreleri(p)) {
        const el = hucreler[k].el;
        el.classList.remove("parla"); void el.offsetWidth; el.classList.add("parla");
      }
    }
  }

  // ---- Butonlar ----
  $("karistirBtn").addEventListener("click", () => {
    if (suruyor) return;
    const sira = harfler.map((h, i) => i);
    // Aynı sıra çıkmasın diye birkaç kez dene
    let yeni;
    for (let d = 0; d < 6; d++) {
      yeni = sira.slice().sort(() => Math.random() - 0.5);
      if (yeni.some((v, i) => v !== i)) break;
    }
    harfler = yeni.map(i => harfler[i]);
    harfEl = yeni.map(i => harfEl[i]);
    harfYerlestir();
  });

  $("ipucuBtn").addEventListener("click", () => {
    if (bitti) return;
    if (durum.para < IPUCU_FIYAT) { bildir(`İpucu için ${IPUCU_FIYAT} ❄ gerekir`); return; }
    const kapali = Object.keys(hucreler).filter(k => !hucreler[k].acik);
    if (!kapali.length) return;
    // Rastgele değil, en az açılmış kelimenin ilk kapalı harfini aç: daha yardımcı olur
    let hedef = null, enAz = Infinity;
    for (const p of seviye.yerler) {
      if (durum.bulunan.includes(p.kelime)) continue;
      const ks = kelimeHucreleri(p);
      const acik = ks.filter(k => hucreler[k].acik).length;
      const ilkKapali = ks.find(k => !hucreler[k].acik);
      if (ilkKapali && acik < enAz) { enAz = acik; hedef = ilkKapali; }
    }
    hedef = hedef || kapali[0];
    paraEkle(-IPUCU_FIYAT);
    durum.ipucu.push(hedef);
    hucreAc(hedef, "ipucu", true);
    ipucuylaBitenler();
    kaydet();
    if (tamamMi()) setTimeout(seviyeBitti, 500);
  });

  function bonusGuncelle() {
    $("bonusSay").textContent = durum.bonus.length;
    $("ipucuBtn").classList.toggle("pasif", durum.para < IPUCU_FIYAT);
  }
  $("bonusBtn").addEventListener("click", () => {
    const l = $("bonusListe");
    l.innerHTML = durum.bonus.length
      ? durum.bonus.map(w => `<span>${buyuk(w)}</span>`).join("")
      : `<p class="soluk">Bu seviyede henüz bonus kelime bulmadın.</p>`;
    $("bonusPerde").hidden = false;
  });
  document.querySelectorAll("[data-kapat]").forEach(b =>
    b.addEventListener("click", () => { b.closest(".perde").hidden = true; }));
  $("paraBtn").addEventListener("click", () => { $("bilgiPerde").hidden = false; });

  function paraEkle(n) {
    durum.para = Math.max(0, durum.para + n);
    $("para").textContent = sayi(durum.para);
    const p = $("paraBtn");
    p.classList.remove("artti"); void p.offsetWidth; p.classList.add("artti");
    bonusGuncelle();
  }

  // ---- Seviye sonu ----
  function seviyeBitti() {
    if (bitti) return;
    bitti = true;
    const odul = 5 + seviye.yerler.length;
    paraEkle(odul);
    const mesajlar = ["Harika!", "Süpersin!", "Buz gibi!", "Tam isabet!", "Müthiş!", "Kar topu gibi!"];
    $("bitisBaslik").textContent = durum.seviye >= SON_SEVIYE ? "Oyunu bitirdin!" : mesajlar[durum.seviye % mesajlar.length];
    $("bitisMetin").innerHTML = durum.seviye >= SON_SEVIYE
      ? "999.999.999 seviyenin hepsini bitirdin. İnanılmaz!"
      : `Seviye ${sayi(durum.seviye)} tamam. <b>+${odul} ❄</b><br><span class="soluk">Kalan: ${sayi(SON_SEVIYE - durum.seviye)} seviye</span>`;
    $("sonrakiBtn").hidden = durum.seviye >= SON_SEVIYE;
    $("bitisPerde").hidden = false;
    kaydet();
  }
  $("sonrakiBtn").addEventListener("click", () => {
    $("bitisPerde").hidden = true;
    durum.seviye = Math.min(SON_SEVIYE, durum.seviye + 1);
    durum.bulunan = []; durum.bonus = []; durum.ipucu = [];
    kaydet();
    seviyeKur();
  });

  // ---- Küçük yardımcılar ----
  let bildirimZamani;
  function bildir(metin) {
    const b = $("bildirim");
    b.textContent = metin;
    b.classList.add("goster");
    clearTimeout(bildirimZamani);
    bildirimZamani = setTimeout(() => b.classList.remove("goster"), 1600);
  }
  function titret(d) { try { navigator.vibrate && navigator.vibrate(d); } catch (e) {} }

  // ---- Kar yağışı ----
  (function karYagdir() {
    const c = $("kar"), x = c.getContext("2d");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let taneler = [];
    function boy() {
      c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio;
      taneler = Array.from({ length: Math.round(innerWidth / 14) }, () => ({
        x: Math.random() * c.width, y: Math.random() * c.height,
        r: (Math.random() * 1.8 + 0.6) * devicePixelRatio, v: Math.random() * 0.5 + 0.25, s: Math.random() * 6
      }));
    }
    boy(); addEventListener("resize", boy);
    (function ciz() {
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = "rgba(255,255,255,0.55)";
      for (const t of taneler) {
        t.y += t.v * devicePixelRatio; t.s += 0.01; t.x += Math.sin(t.s) * 0.3;
        if (t.y > c.height) { t.y = -5; t.x = Math.random() * c.width; }
        x.beginPath(); x.arc(t.x, t.y, t.r, 0, Math.PI * 2); x.fill();
      }
      requestAnimationFrame(ciz);
    })();
  })();

  // ---- Başlat ----
  seviyeKur();
  if (durum.ilk) { $("bilgiPerde").hidden = false; durum.ilk = false; kaydet(); }
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
