import re
from collections import Counter
t=open("kelimeler.js").read()
S=re.search(r'SORULAN = "([^"]*)"',t).group(1).split()
B=re.search(r'BONUS = "([^"]*)"',t).group(1).split()
SC=[(w,Counter(w)) for w in S]
def alt(w):
    c=Counter(w); return [a for a,ac in SC if len(a)<=len(w) and all(c[k]>=v for k,v in ac.items())]
esik={4:3,5:4,6:5,7:6}
sonuc={}
for L in range(4,8):
    aday=set(w for w in S+B if len(w)==L)
    iyi=[]
    for w in aday:
        a=alt(w)
        # en az bir uzun kelime (L veya L-1) olsun ki bulmaca dolgun dursun
        if len(a)>=esik[L] and any(len(x)>=L-1 for x in a): iyi.append((w,len(a)))
    sonuc[L]=sorted(iyi)
    print(L,len(iyi),"ort",round(sum(n for _,n in iyi)/len(iyi),1), sorted(iyi,key=lambda x:-x[1])[:5])
satirlar=[f'  {L}: "{" ".join(w for w,_ in v)}",' for L,v in sonuc.items()]
t=re.sub(r"\n// Çark harf setleri.*","",t,flags=re.S)
open("kelimeler.js","w").write(t+"\n// Çark harf setleri (araclar/tabanlar.py ile üretildi): bu harflerden en az birkaç sorulan kelime çıkar.\nconst TABAN = {\n"+"\n".join(satirlar)+"\n};\n")
