/* Multi-year comparison: 2–4 side-by-side SVG choropleths of Singapore subzones.
   Each panel picks its own scenario + year; all share one fixed colormap so the
   maps are directly comparable. Pure SVG (no WebGL) — light and robust. */
const Compare = (()=>{
  let man, monthly, hot, hotNights, feats, PATHS={}, VW=1000, VH=620;
  let metric="temp", month=6, panels=[];
  const $=id=>document.getElementById(id);
  const yearly=()=> metric==="hot" || metric==="warm";   // one count per year: no month slider

  function scMeta(k){ return man.scenarios.find(s=>s.key===k); }
  function scShort(k){ const m=scMeta(k);
    if(m.ssp==="historical") return t("ssp_label").historical;
    const p = m.period==="2040-2059" ? "Mid" : "End";
    return `${p} ${t("ssp_label")[m.ssp]}`; }

  function project(){
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
    const scan=c=>{ if(typeof c[0]==="number"){ if(c[0]<x0)x0=c[0]; if(c[0]>x1)x1=c[0]; if(c[1]<y0)y0=c[1]; if(c[1]>y1)y1=c[1]; } else c.forEach(scan); };
    feats.forEach(f=>scan(f.geometry.coordinates));
    const lonR=x1-x0, latR=y1-y0;
    VH = Math.round(VW*latR/lonR);
    const px=lon=>((lon-x0)/lonR*VW).toFixed(1), py=lat=>((y1-lat)/latR*VH).toFixed(1);
    feats.forEach(f=>{
      const g=f.geometry; const polys = g.type==="Polygon" ? [g.coordinates] : g.coordinates;
      let d="";
      polys.forEach(poly=>poly.forEach(ring=>{
        ring.forEach((pt,i)=> d += (i?"L":"M")+px(pt[0])+","+py(pt[1])+" ");
        d+="Z ";
      }));
      PATHS[f.properties.id]=d;
    });
  }

  function init(manifest, mon, ht, geojson, hn){
    man=manifest; monthly=mon; hot=ht; hotNights=hn; feats=geojson.features;
    project();
    document.querySelectorAll("#cmp-metric button").forEach(b=>b.onclick=()=>{
      metric=b.dataset.metric;
      document.querySelectorAll("#cmp-metric button").forEach(x=>x.classList.toggle("active",x===b));
      $("cmp-month-row").style.display = yearly() ? "none" : "";
      render(); });
    $("cmp-month").oninput=e=>{ month=+e.target.value; $("cmp-month-val").textContent=t("months")[month-1];
      if(!yearly()) render(); };
    document.querySelectorAll("#cmp-count button").forEach(b=>b.onclick=()=>{
      document.querySelectorAll("#cmp-count button").forEach(x=>x.classList.toggle("active",x===b));
      setCount(+b.dataset.n); });
  }

  function open(o){
    o=o||{}; metric=o.metric||"temp"; month=o.month||6;
    const sp = (o.ssp && o.ssp!=="historical") ? o.ssp : "ssp245";
    panels = [ {scen:"hist_1995_2014", year:2005},
               {scen:"mid_2040_2059_"+sp, year:2050},
               {scen:"end_2080_2099_"+sp, year:2099} ];
    document.querySelectorAll("#cmp-metric button").forEach(x=>x.classList.toggle("active",x.dataset.metric===metric));
    document.querySelectorAll("#cmp-count button").forEach(x=>x.classList.toggle("active",+x.dataset.n===panels.length));
    $("cmp-month").value=month; $("cmp-month-val").textContent=t("months")[month-1];
    $("cmp-month-row").style.display = yearly() ? "none" : "";
    render();
    $("modal-compare").classList.remove("hidden");
  }

  function setCount(n){
    while(panels.length<n) panels.push({...panels[panels.length-1]});
    panels.length=n; render();
  }

  function cmap(){ return metric==="temp"?man.colormaps.temp : metric==="wind"?man.colormaps.wind
    : metric==="warm"?man.colormaps.warm : man.colormaps.hot; }
  function valueFor(p, id){
    if(yearly()){ const m=scMeta(p.scen); if(p.year<m.y0||p.year>m.y1) return null;
      const src = metric==="warm" ? hotNights : hot;
      const a=(src.data[p.scen]||{})[id]; return a? a[p.year-m.y0] : null; }
    const fld = metric==="wind" ? "w" : "t";
    const rec=((monthly.data[p.scen]||{})[String(p.year)]||{})[id];
    return rec ? rec[fld][month-1] : null;
  }

  function svgFor(p){
    const cm=cmap();
    let s=`<svg viewBox="0 0 ${VW} ${VH}" class="cmp-map" preserveAspectRatio="xMidYMid meet">`;
    s+=`<rect x="0" y="0" width="${VW}" height="${VH}" fill="#eceef1"/>`;
    for(const f of feats){ const id=f.properties.id, v=valueFor(p,id);
      const col = v==null ? "#dfe3e7" : valueColor(cm.cmap, v, cm.vmin, cm.vmax);
      const vt = v==null ? "—" : v+" "+cm.unit;
      s+=`<path d="${PATHS[id]}" fill="${col}" stroke="rgba(255,255,255,.4)" stroke-width="0.6"><title>${f.properties.name_disp}: ${vt}</title></path>`;
    }
    return s+"</svg>";
  }

  function render(){
    if(!panels.length) return;
    const grid=$("cmp-grid"); grid.innerHTML="";
    grid.style.gridTemplateColumns = `repeat(${panels.length===4?2:panels.length}, 1fr)`;
    panels.forEach(p=>{
      const card=document.createElement("div"); card.className="cmp-card";
      const ctr=document.createElement("div"); ctr.className="cmp-ctrls";
      const ssel=document.createElement("select");
      man.scenarios.forEach(s=>{ const o=document.createElement("option"); o.value=s.key; o.textContent=scShort(s.key);
        if(s.key===p.scen)o.selected=true; ssel.appendChild(o); });
      const ysel=document.createElement("select");
      const fillYears=()=>{ ysel.innerHTML=""; const m=scMeta(p.scen);
        for(let y=m.y0;y<=m.y1;y++){ const o=document.createElement("option"); o.value=y; o.textContent=y;
          if(y===p.year)o.selected=true; ysel.appendChild(o); } };
      fillYears();
      ssel.onchange=()=>{ p.scen=ssel.value; const m=scMeta(p.scen);
        if(p.year<m.y0||p.year>m.y1) p.year=Math.round((m.y0+m.y1)/2); render(); };
      ysel.onchange=()=>{ p.year=+ysel.value; render(); };
      ctr.appendChild(ssel); ctr.appendChild(ysel); card.appendChild(ctr);
      const mw=document.createElement("div"); mw.className="cmp-mapwrap"; mw.innerHTML=svgFor(p);
      card.appendChild(mw);
      grid.appendChild(card);
    });
    const cm=cmap();
    $("cmp-legend").innerHTML =
      `<span>${cm.vmin}</span><div class="cmp-bar" style="background:${cmapGradient(cm.cmap)}"></div>`+
      `<span>${cm.vmax} ${cm.unit}</span>`;
  }

  function isOpen(){ return !$("modal-compare").classList.contains("hidden"); }
  return {init, open, render, isOpen};
})();
