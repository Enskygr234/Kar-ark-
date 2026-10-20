# Kelime havuzunu derler: araclar/yaygin.txt + Ayazle listeleri -> kelimeler.js
import re, sys, json
from collections import Counter
AYAZLE = sys.argv[1]
CIKAR = set("sali sava kos saka pak ece edebi tabla bezik ası ırk içki mezar ölü ecel efe beniz form far tıp".split())
def temiz(w):
    w = w.strip().lower().replace("â","a").replace("î","i").replace("û","u")
    return w if re.fullmatch(r"[abcçdefgğhıijklmnoöprsştuüvyz]+", w) else None
yaygin = set()
for w in open("araclar/yaygin.txt").read().split():
    w = temiz(w)
    if w and 3 <= len(w) <= 7 and w not in CIKAR: yaygin.add(w)
k = open(f"{AYAZLE}/kelimeler.js").read()
cevap = re.search(r"CEVAP_METNI = `(.*?)`", k, re.S).group(1)
for satir in cevap.strip().splitlines():
    w = temiz(satir.split("|")[0])
    if w and w not in CIKAR: yaygin.add(w)
ek = re.search(r"EK_KELIMELER = `(.*?)`", k, re.S).group(1).split()
soz = re.search(r'"([^"]+)"', open(f"{AYAZLE}/sozluk.js").read()).group(1).split()
bonus = set(filter(None, map(temiz, ek + soz))) - yaygin
KABA = set("fahişe götler ibne kahpe kaltak orospu piçler piçlik puşt sikler sikmek sürtük taşak yarak yavşak zina göt piç sik".split())
bonus = {w for w in bonus if 3 <= len(w) <= 7 and w not in KABA}
print("sorulacak", len(yaygin), Counter(map(len, yaygin)))
print("bonus", len(bonus))
# Taban (çarktaki harfler) adayları: her uzunluk için en az kaç alt kelime çıkıyor
def sigar(alt, ust):
    c = Counter(ust); c.subtract(Counter(alt)); return min(c.values()) >= 0
liste = sorted(yaygin)
for L in range(4, 8):
    tabanlar = [w for w in liste if len(w) == L]
    say = [sum(1 for a in liste if len(a) <= L and sigar(a, w)) for w in tabanlar]
    iyi = [s for s in say if s >= {4:3,5:4,6:5,7:6}[L]]
    print(L, len(tabanlar), "iyi:", len(iyi), "ort alt:", round(sum(say)/max(1,len(say)),1))
open("kelimeler.js","w").write(
 "// Harf Çarkı kelime havuzu (araclar/derle.py ile üretildi).\n"
 "// SORULAN: bulmacada sorulan yaygın kelimeler. BONUS: kabul edilen, ekstra puan veren kelimeler.\n"
 "// Bonus sözlük kaynağı: Vikisözlük sözcük listesi (github.com/mertemin/turkish-word-list), CC BY-SA 3.0.\n"
 f"const SORULAN = \"{' '.join(liste)}\";\n"
 f"const BONUS = \"{' '.join(sorted(bonus))}\";\n")
