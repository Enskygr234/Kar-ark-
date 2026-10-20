const fs=require("fs"),vm=require("vm");
const ctx={module:{exports:{}},console,Math,Set,Map,String,Array,Object,Infinity};vm.createContext(ctx);
vm.runInContext(fs.readFileSync("kelimeler.js","utf8")+"\n"+fs.readFileSync("uretici.js","utf8")+"\nthis.U=Uretici;",ctx);
const U=ctx.U;
function kontrol(s){
  const lv=U.uret(s); if(!lv) return "null";
  const g={}; const c=U.sayac(lv.taban);
  for(const p of lv.yerler){ if(!U.sigar(p.kelime,c)) return "çarktan çıkmıyor "+p.kelime;
    for(let i=0;i<p.kelime.length;i++){const k=(p.x+(p.yatay?i:0))+","+(p.y+(p.yatay?0:i)); if(g[k]&&g[k]!==p.kelime[i]) return "çakışma"; g[k]=p.kelime[i];}}
  // tablodaki her yatay/dikey 2+ harf dizisi bir yerleşen kelime olmalı
  const ks=new Set(lv.yerler.map(p=>p.kelime+(p.yatay?"y":"d")+p.x+","+p.y));
  for(const [yon,dx,dy] of [["y",1,0],["d",0,1]]) for(const k in g){const [x,y]=k.split(",").map(Number);
    if(g[(x-dx)+","+(y-dy)]) continue; let w="",i=0; while(g[(x+dx*i)+","+(y+dy*i)]) w+=g[(x+dx*i)+","+(y+dy*i)],i++;
    if(w.length>1&&!ks.has(w+yon+x+","+y)) return "fazladan dizi "+w;}
  if(new Set(lv.yerler.map(p=>p.kelime)).size!==lv.yerler.length) return "tekrar";
  if(lv.genislik>10||lv.yukseklik>10) return "büyük";
  return lv;
}
const ornek=[1,2,3,10,25,100,500,1500,123456,999999999];
let hata={},say={},t=Date.now();
const deneme=[...Array(3000).keys()].map(i=>i+1).concat([...Array(3000)].map(()=>1+Math.floor(Math.random()*999999999)));
for(const s of deneme){const r=kontrol(s); if(typeof r==="string"){hata[r.split(" ")[0]]=(hata[r.split(" ")[0]]||0)+1; if(Object.keys(hata).length<4&&hata[r.split(" ")[0]]<3)console.log(s,r);} else {const k=r.yerler.length; const b=s<=1000?"≤1000":">1000"; say[b+":"+k]=(say[b+":"+k]||0)+1;}}
console.log("hatalar",hata,"süre ms/seviye",((Date.now()-t)/deneme.length).toFixed(2));
console.log(Object.entries(say).sort().join("  "));
for(const s of ornek){const l=kontrol(s);console.log(s,l.taban,l.harfler.join(""),l.genislik+"x"+l.yukseklik,l.yerler.map(p=>p.kelime).join(","));}
// tekrar eden seviye oranı
const set=new Set();for(let s=1;s<=3000;s++){const l=U.uret(s);set.add(l.yerler.map(p=>p.kelime).sort().join());}console.log("ilk 3000 seviyede farklı bulmaca:",set.size);
