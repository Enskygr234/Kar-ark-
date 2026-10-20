<div align="center">

# ❄ Kar Çarkı

**999.999.999 seviyeli Türkçe harf çarkı kelime oyunu.**

[![Tarayıcıda oyna](https://img.shields.io/badge/▶_Tarayıcıda_oyna-Kar_Çarkı-f0a03c?style=for-the-badge)](https://enskygr234.github.io/Kar-ark-/)

</div>

Çarktaki harflerin üstünde parmağını kaydır, kelime yaz, bulmacayı doldur. Kış gecesinde, kar yağarken.

## Nasıl oynanır

- Çarktaki harfleri sırayla birleştirerek kelime yaz. Bulduğun kelime bulmacaya yerleşir.
- Bulmacadaki bütün kelimeleri bulunca seviye biter ve ❄ kazanırsın.
- Bulmacada olmayan ama gerçek bir kelime bulursan **bonus** sayılır: +2 ❄.
- Takıldığında 💡 ile bir harf açabilirsin (20 ❄).
- ⟳ harflerin yerini karıştırır, bazen kelimeyi görmek kolaylaşır.

## 999.999.999 seviye nasıl?

Seviyeler tek tek yazılmadı. Oyun, her seviyeyi seviye numarasından **kendisi üretir**: aynı seviye herkeste ve her açılışta aynı çıkar. İlerledikçe zorlaşır:

| Seviye | Çarktaki harf | Bulmacadaki kelime |
|---|---|---|
| 1–5 | 4 | 3 |
| 6–60 | 4–5 | 3–5 |
| 61–1.000 | 5–6 | 5–7 |
| 1.000+ | 6–7 | 7–10 |

Kısacası bitmez. 🙂

## Özellikler

- Telefonda kaydırarak oynanır, bilgisayarda fareyle de olur
- İlerleme cihazda kayıtlı kalır, kaldığın yerden devam edersin
- Ana ekrana eklenebilir (PWA), internetsiz de oynanır
- Kaba kelimeler ayıklandı, çocuklar da oynayabilir

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html`, `style.css` | Oyun ekranı |
| `oyun.js` | Çark, bulmaca, ipucu, kayıt |
| `uretici.js` | Seviye üretici (harfler + bulmaca yerleşimi) |
| `kelimeler.js` | Kelime havuzu |
| `araclar/` | Kelime havuzunu yeniden üreten betikler ve test |

Sorulan kelimeleri değiştirmek için `araclar/yaygin.txt` dosyasını düzenle, sonra:

```sh
python3 araclar/derle.py ../ayazle   # Ayazle reposunun yolu (bonus sözlük oradan gelir)
python3 araclar/tabanlar.py
node araclar/test.js                  # binlerce seviyeyi kontrol eder
```

## Lisans

Kod MIT lisanslıdır. Bonus kelime sözlüğü [Vikisözlük sözcük listesinden](https://github.com/mertemin/turkish-word-list) gelir ve CC BY-SA 3.0 lisanslıdır.
