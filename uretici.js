// Harf Çarkı seviye üretici.
// Her seviye, numarasından türetilen sabit bir tohumla üretilir: aynı seviye herkeste ve her seferinde aynı çıkar.
// Bu sayede 999.999.999 seviye, hiçbiri tek tek yazılmadan oynanabilir.

const SON_SEVIYE = 999999999;

const Uretici = (() => {
  const sorulan = SORULAN.split(" ");
  const sorulanKume = new Set(sorulan);
  const bonusKume = new Set(BONUS.split(" "));
  const tabanlar = {};
  for (const L of [4, 5, 6, 7]) tabanlar[L] = TABAN[L].split(" ");

  // Küçük, hızlı, tohumlu rastgele sayı üreteci
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function tohum(seviye, deneme) {
    let h = 2166136261 ^ deneme;
    const s = String(seviye) + ":" + deneme;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  const sec = (rng, dizi) => dizi[Math.floor(rng() * dizi.length)];
  function karistir(rng, dizi) {
    const a = dizi.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sayac(kelime) {
    const c = {};
    for (const h of kelime) c[h] = (c[h] || 0) + 1;
    return c;
  }
  function sigar(kelime, c) {
    const k = {};
    for (const h of kelime) { k[h] = (k[h] || 0) + 1; if (!c[h] || k[h] > c[h]) return false; }
    return true;
  }
  const altOnbellek = new Map();
  function altKelimeler(taban) {
    if (altOnbellek.has(taban)) return altOnbellek.get(taban);
    const c = sayac(taban);
    const sonuc = sorulan.filter(w => w.length <= taban.length && sigar(w, c));
    altOnbellek.set(taban, sonuc);
    return sonuc;
  }

  // Seviyeye göre zorluk: çarktaki harf sayısı ve bulmacadaki kelime sayısı
  function zorluk(seviye, rng) {
    let L, k;
    if (seviye <= 5) { L = 4; k = 3; }
    else if (seviye <= 20) { L = rng() < 0.6 ? 4 : 5; k = L === 4 ? 3 : 4; }
    else if (seviye <= 60) { L = 5; k = 4 + (rng() < 0.4 ? 1 : 0); }
    else if (seviye <= 200) { L = rng() < 0.5 ? 5 : 6; k = L === 5 ? 5 : 6; }
    else if (seviye <= 1000) { L = 6; k = 6 + (rng() < 0.5 ? 1 : 0); }
    else {
      L = rng() < 0.12 ? 7 : 6;
      // Basamak sayısı arttıkça biraz daha kalabalık bulmacalar
      k = Math.min(10, 7 + Math.floor(Math.log10(seviye) - 3) + (rng() < 0.5 ? 1 : 0));
    }
    const kisaAgirlik = seviye <= 60 ? 1 : seviye <= 1000 ? 0.6 : 0.35; // 3 harflilerin seçilme ağırlığı
    return { L, k, kisaAgirlik };
  }

  // --- Bulmaca yerleşimi (çengel bulmaca) ---
  function yerlestir(kelimeler, rng, sinir) {
    const hucre = new Map(); // "x,y" -> { h: harf, yon: Set }
    const yerler = [];
    const al = (x, y) => hucre.get(x + "," + y);

    function uygun(w, x, y, yatay) {
      const dx = yatay ? 1 : 0, dy = yatay ? 0 : 1;
      if (al(x - dx, y - dy) || al(x + dx * w.length, y + dy * w.length)) return -1;
      let kesisim = 0;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i;
        const c = al(cx, cy);
        if (c) {
          if (c.h !== w[i] || c.yon.has(yatay ? "y" : "d")) return -1;
          kesisim++;
        } else {
          // Boş hücrenin yanları boş olmalı, yoksa istenmeyen kelimeler oluşur
          if (al(cx + dy, cy + dx) || al(cx - dy, cy - dx)) return -1;
        }
      }
      return kesisim;
    }
    function koy(w, x, y, yatay) {
      const dx = yatay ? 1 : 0, dy = yatay ? 0 : 1;
      for (let i = 0; i < w.length; i++) {
        const key = (x + dx * i) + "," + (y + dy * i);
        const c = hucre.get(key) || { h: w[i], yon: new Set() };
        c.yon.add(yatay ? "y" : "d");
        hucre.set(key, c);
      }
      yerler.push({ kelime: w, x, y, yatay });
    }
    function kutu(ekX = [], ekY = []) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const k of hucre.keys()) {
        const [x, y] = k.split(",").map(Number);
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
      for (const x of ekX) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      for (const y of ekY) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      return { x0, y0, x1, y1, g: x1 - x0 + 1, y: y1 - y0 + 1 };
    }

    koy(kelimeler[0], 0, 0, rng() < 0.5);
    const kalan = kelimeler.slice(1);
    const yerlesmeyen = [];
    for (const w of kalan) {
      const adaylar = [];
      for (const p of yerler) {
        const yatay = !p.yatay;
        for (let j = 0; j < p.kelime.length; j++) {
          for (let i = 0; i < w.length; i++) {
            if (w[i] !== p.kelime[j]) continue;
            const px = p.x + (p.yatay ? j : 0), py = p.y + (p.yatay ? 0 : j);
            const x = px - (yatay ? i : 0), y = py - (yatay ? 0 : i);
            const kes = uygun(w, x, y, yatay);
            if (kes < 1) continue;
            const b = kutu([x, x + (yatay ? w.length - 1 : 0)], [y, y + (yatay ? 0 : w.length - 1)]);
            if (b.g > sinir.g || b.y > sinir.y) continue;
            const puan = kes * 6 - (b.g * b.y) / 6 - Math.abs(b.g - b.y * 1.3) + rng() * 4;
            adaylar.push({ x, y, yatay, puan });
          }
        }
      }
      if (!adaylar.length) { yerlesmeyen.push(w); continue; }
      adaylar.sort((a, b) => b.puan - a.puan);
      const e = adaylar[0];
      koy(w, e.x, e.y, e.yatay);
    }
    const b = kutu();
    for (const p of yerler) { p.x -= b.x0; p.y -= b.y0; }
    return { yerler, genislik: b.g, yukseklik: b.y, yerlesmeyen };
  }

  function uret(seviye) {
    for (let deneme = 0; deneme < 60; deneme++) {
      const rng = mulberry32(tohum(seviye, deneme));
      const z = zorluk(seviye, rng);
      const taban = sec(rng, tabanlar[z.L]);
      const alt = altKelimeler(taban);
      if (alt.length < 3) continue;
      // En uzun kelimelerden biri mutlaka olsun
      const enUzun = Math.max(...alt.map(w => w.length));
      const uzunlar = alt.filter(w => w.length === enUzun);
      const ilk = sec(rng, uzunlar);
      const digerleri = alt.filter(w => w !== ilk)
        .map(w => ({ w, s: rng() * (w.length === 3 ? z.kisaAgirlik : 1) * (1 + w.length / 10) }))
        .sort((a, b) => b.s - a.s).map(o => o.w);
      const secilen = [ilk, ...digerleri.slice(0, z.k + 2)];
      // Uzundan kısaya yerleştir; fazladan seçilenler yerleşemeyenlerin yerini doldurur
      const sirali = [ilk, ...secilen.slice(1).sort((a, b) => b.length - a.length || (rng() - 0.5))];
      const sinir = z.L >= 6 ? { g: 10, y: 10 } : { g: 8, y: 8 };
      const y = yerlestir(sirali, rng, sinir);
      if (y.yerler.length < Math.min(z.k, alt.length) && deneme < 59) continue;
      // Fazla yerleştiyse hedef sayıya indir (son yerleşenleri at, bağlantı bozulmaz)
      // Her kelime kendinden öncekilere bağlandığı için baştan bir dilim almak bulmacayı bozmaz
      const yerler = y.yerler.slice(0, z.k);
      const kutuBul = yerler;
      let gx = 0, gy = 0, mx = Infinity, my = Infinity;
      for (const p of kutuBul) {
        mx = Math.min(mx, p.x); my = Math.min(my, p.y);
        gx = Math.max(gx, p.x + (p.yatay ? p.kelime.length : 1));
        gy = Math.max(gy, p.y + (p.yatay ? 1 : p.kelime.length));
      }
      for (const p of kutuBul) { p.x -= mx; p.y -= my; }
      const harfler = karistir(rng, Array.from(taban));
      return { seviye, taban, harfler, yerler, genislik: gx - mx, yukseklik: gy - my };
    }
    return null;
  }

  function gecerliBonus(w) { return sorulanKume.has(w) || bonusKume.has(w); }

  return { uret, gecerliBonus, sigar, sayac };
})();

if (typeof module !== "undefined") module.exports = { Uretici, SON_SEVIYE };
