/* "MSS V3" panel of the long-term projection (user 2026-10-19): MSS V3 BEFORE downscaling.
   2 km grid  = the MSS V3 SINGV-RCM output itself (D:/Claude/MSS/out/_cache), 24 x 36 points, a value per year and month
   subzones   = what each subzone was given before UT&C: its forcing EPW (D:/Claude/SG_UBEM/Forcing_epw), the 20-year
                average year at the land grid point nearest to its centroid (rule of 2026-10-05), so no year dependence
   Data: data/mss_raw/ from web/prepare_mss_raw.py. On the map it replaces the "MSS V3 downscaled data" colouring
   (one at a time, app.js); subzone colours go through MapView.recolor, the grid is its own layer below the subzone
   lines. */
const MssRaw = (()=>{
  const DIR="data/mss_raw/", NA=-32768, SLOTS=62, SRC="mr-grid";
  let map=null, meta=null, on=false, unit="grid", vkey="t", visible=true, onChange=null, geo=null, used=null, perCell=null;
  // grid years: the selected year, or the 20-year average year - the field the forcing EPWs were sampled from
  let avg=false;
  // "Colour range per month": on = min-max of the map now shown, off = the fixed p2-p98 range (land cells, all scenarios / years / months)
  let auto=true;
  // the other view's outlines: subzone outlines over the 2 km grid, the 2 km grid outlines over the subzones
  let olZone=true, olGrid=true;
  const bins={}, arrs={}, $=id=>document.getElementById(id);
  const V=()=>meta.vars.find(v=>v.key===vkey) || meta.vars[0];
  const isMonthly=()=>!meta || V().kind==="monthly";
  const fmt=(v,d)=>v==null || !isFinite(v) ? "—" : (+v).toFixed(d);
  const digits=k=>k==="w" ? 2 : (k==="hot" || k==="warm" || k==="rad" || k==="rain") ? 0 : 1;

  async function load(){ if(!meta){ meta=await fetch(DIR+"meta.json").then(r=>r.json()); build(); } return meta; }
  function bin(sk){ if(!bins[sk]) bins[sk]=fetch(DIR+`grid_${sk}.bin`).then(r=>r.ok ? r.arrayBuffer() : null).then(b=>{ const a=b && new Int16Array(b); arrs[sk]=a; return a; }); return bins[sk]; }
  function build(){
    const [dy, dx]=meta.step, F=[];
    for(let iy=0; iy<meta.ny; iy++) for(let ix=0; ix<meta.nx; ix++){ const y=meta.lat[iy], x=meta.lon[ix], i=iy*meta.nx+ix;
      F.push({type:"Feature", id:i, properties:{i, iy, ix, land:meta.land[i]},
        geometry:{type:"Polygon", coordinates:[[[x-dx/2,y-dy/2],[x+dx/2,y-dy/2],[x+dx/2,y+dy/2],[x-dx/2,y+dy/2],[x-dx/2,y-dy/2]]]}}); }
    geo={type:"FeatureCollection", features:F};
    perCell={}; Object.entries(meta.zones).forEach(([z, a])=>{ const c=a.iy*meta.nx+a.ix; (perCell[c]=perCell[c]||[]).push(z); });
    used=Object.keys(perCell).map(Number);
    const sel=$("mr-var"); sel.innerHTML=meta.vars.map(v=>`<option value="${v.key}">${(t("mr_var_label")||{})[v.key]||v.key}</option>`).join(""); sel.value=vkey;
  }
  function ensureLayers(){
    if(!map || !geo) return false;
    try{
      if(!map.getSource(SRC)) map.addSource(SRC, {type:"geojson", data:geo});
      const below=map.getLayer("sz-line") ? "sz-line" : undefined;     // subzone lines stay on top of the grid
      if(!map.getLayer("mr-fill")) map.addLayer({id:"mr-fill", type:"fill", source:SRC,
        paint:{"fill-color":["coalesce",["feature-state","c"],"#000000"], "fill-opacity":["coalesce",["feature-state","o"],0]}}, below);
      if(!map.getLayer("mr-line")) map.addLayer({id:"mr-line", type:"line", source:SRC, paint:{"line-color":"#ffffff", "line-width":0.5, "line-opacity":0.55}}, below);
      if(!map.getLayer("mr-land")) map.addLayer({id:"mr-land", type:"line", source:SRC, filter:["==",["get","land"],1],
        paint:{"line-color":"#1f2937", "line-width":1.1, "line-opacity":0.6}}, below);
      if(!map.getLayer("mr-used")) map.addLayer({id:"mr-used", type:"line", source:SRC, filter:["in",["get","i"],["literal",used]],
        paint:{"line-color":"#f97316", "line-width":1.4, "line-dasharray":[2,1.2]}});
      return true;
    }catch(e){ return false; }
  }
  function vis(){
    if(!map) return; const show=(id, s)=>map.getLayer(id) && map.setLayoutProperty(id, "visibility", s ? "visible" : "none");
    const g=on && visible && unit==="grid", z=on && visible && unit==="zone";
    show("mr-fill", g); ["mr-line","mr-land"].forEach(id=>show(id, g || (z && olGrid))); show("mr-used", z && olGrid);
    // subzone outlines (map.js layers): only the grid view's switch hides them; outside the long-term tab map.js keeps them off
    if(visible) ["sz-line","sz-cat"].forEach(id=>show(id, !(g && !olZone)));
  }
  const slot=mo=>V().kind==="annual" ? (vkey==="hot" ? 60 : 61) : meta.vars.indexOf(V())*12 + (mo-1);
  /* grid value of cell c, scenario sk, year, month (null outside the scenario's years) */
  function cellVal(arr, sk, year, mo, c){ const ys=meta.years[sk]||[], yi=avg ? meta.avg_index : ys.indexOf(year); if(!arr || yi<0) return null;
    const x=arr[(yi*SLOTS + slot(mo))*meta.ny*meta.nx + c]; return x===NA ? null : x / V().scale; }
  function zoneVal(z, sk, mo){ const e=((meta.zone_values[z]||{})[sk]||{})[vkey]; if(e==null) return null; return Array.isArray(e) ? e[mo-1] : e; }
  const colorOf=(v, r)=>v==null ? null : valueColor(V().cmap, v, r[0], r[1]);
  const SPAN={t:0.2, rh:1, w:0.1, rad:2, rain:2, hot:1, warm:1};      // narrowest stretched range
  /* colour range of the map now shown: grid cells (scenario, year or 20-year mean, month) or the subzones' forcing EPW values */
  function rangeNow(sk, year, mo){ const v=V(); if(!auto) return v.range; let a=[];
    if(unit==="zone") a=Object.keys(meta.zone_values).map(z=>zoneVal(z, sk, mo));
    else { const arr=arrs[sk]; if(!arr) return v.range; for(let c=0; c<meta.ny*meta.nx; c++) a.push(cellVal(arr, sk, year, mo, c)); }
    a=a.filter(x=>x!=null && isFinite(x)); if(!a.length) return v.range;
    let lo=Math.min(...a), hi=Math.max(...a); const s=SPAN[v.key]||0.1;
    if(hi-lo<s){ lo=Math.max(0, (hi+lo)/2-s/2); hi=lo+s; }
    return [lo, hi]; }

  let tok=0;
  async function render(sk, year, mo){
    if(!on || !meta){ vis(); return; } if(!ensureLayers()){ map.once("idle", ()=>render(sk, year, mo)); return; }
    vis(); if(unit!=="grid") return;
    const my=++tok, arr=await bin(sk); if(my!==tok) return;
    const r=rangeNow(sk, year, mo);
    geo.features.forEach((f, c)=>{ const v=cellVal(arr, sk, year, mo, c), col=colorOf(v, r);
      map.setFeatureState({source:SRC, id:c}, {c:col, o:col ? 0.78 : 0, v}); });
    const L=$("legend"); if(L && visible) L.innerHTML=legendHTML(sk, year, mo);   // the range may need the grid just loaded
  }
  function zoneFn(sk, mo){ const r=rangeNow(sk, null, mo); return p=>{ const v=zoneVal(p.id, sk, mo); return {val:v, color:colorOf(v, r)}; }; }
  function legendHTML(sk, year, mo){
    const v=V(), r=rangeNow(sk, year, mo), d=digits(v.key), lab=(t("mr_var_label")||{})[v.key]||v.key;
    const mtxt = v.kind==="monthly" ? " · "+t("months")[mo-1] : "", ys=meta.years[sk]||[];
    const when = unit==="zone" || avg ? `${t("mr_period_avg")} ${ys[0]}–${ys[ys.length-1]}${mtxt}`
                                      : `${year}${mtxt}${ys.includes(year) ? "" : " · "+t("no_data")}`;
    return `<div class="lg-title">MSS V3 · ${lab} · ${when}</div><div class="lg-bar" style="background:${cmapGradient(v.cmap)}"></div>`+
      `<div class="lg-scale"><span>${fmt(r[0], d)}</span><span>${v.unit}</span><span>${fmt(r[1], d)}</span></div>`+
      `<div class="lg-note">${t(auto ? "mr_auto_on" : "mr_auto_off")}</div>`+
      `<div class="lg-note">${t(unit==="grid" ? "mr_legend_grid" : olGrid ? "mr_legend_zone" : "mr_legend_zone_plain")}</div>`;
  }
  function cellText(c){ const iy=Math.floor(c/meta.nx), ix=c%meta.nx;
    return t("mr_cell")(iy, ix, meta.lat[iy].toFixed(3), meta.lon[ix].toFixed(3), meta.land[c]===1, (perCell[c]||[]).length); }
  /* subzone tooltip rows (app.js showTip) */
  function zoneTip(p, sk, mo){ const v=V(), val=zoneVal(p.id, sk, mo), a=meta.zones[p.id];
    const lab=(t("mr_var_label")||{})[v.key]||v.key, c=a ? a.iy*meta.nx+a.ix : null;
    return `<div class="tt-val">${lab}: <b>${fmt(val, digits(v.key))} ${val==null ? "" : v.unit}</b> · ${t("mr_period_avg")}</div>`+
      (a ? `<div class="tt-row">${t("mr_zone_cell")(a.iy, a.ix, meta.lat[a.iy].toFixed(3), meta.lon[a.ix].toFixed(3), a.km, a.moved)}</div>` : ""); }
  function onMove(e){
    if(!on || unit!=="grid" || !visible || !e.features.length || (typeof Measure!=="undefined" && Measure.busy())) return;
    const f=e.features[0], c=f.id, st=map.getFeatureState({source:SRC, id:c}), v=V(), el=$("map-tooltip");
    const names=(perCell[c]||[]).slice(0, 3).map(z=>z.replace(/^\d+_/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, s=>s.toUpperCase()));
    el.innerHTML=`<div class="tt-name">MSS V3 · ${(t("mr_var_label")||{})[v.key]||v.key}</div>`+
      `<div class="tt-val"><b>${fmt(st && st.v, digits(v.key))} ${st && st.v!=null ? v.unit : ""}</b></div>`+
      `<div class="tt-row">${cellText(c)}</div>`+(names.length ? `<div class="tt-row">${names.join(", ")}${(perCell[c]||[]).length>3 ? " …" : ""}</div>` : "");
    const wrap=$("map-wrap").getBoundingClientRect(); let x=e.point.x+14, y=e.point.y+14;
    if(x>wrap.width-260) x=e.point.x-250; if(y>wrap.height-110) y=e.point.y-100;
    el.style.left=x+"px"; el.style.top=y+"px"; el.classList.remove("hidden");
  }
  function hint(){ const h=$("mr-hint"); if(h) h.textContent=on ? t(unit==="grid" ? (avg ? "mr_hint_avg" : "mr_hint_grid") : "mr_hint_zone") : ""; }
  function sync(){
    $("mr-toggle").checked=on; $("mr-auto").checked=auto; $("mr-ol-zone").checked=olZone; $("mr-ol-grid").checked=olGrid;
    $("mr-ol-zone-row").classList.toggle("hidden", unit!=="grid"); $("mr-ol-grid-row").classList.toggle("hidden", unit!=="zone");
    $("mr-unit").querySelectorAll("button").forEach(b=>b.classList.toggle("active", b.dataset.u===unit));
    $("mr-yr").querySelectorAll("button").forEach(b=>b.classList.toggle("active", (b.dataset.y==="avg")===avg));
    $("mr-yr-row").classList.toggle("hidden", unit!=="grid");
    ["mr-unit","mr-var-row","mr-yr-row","mr-auto-row","mr-ol-zone-row","mr-ol-grid-row"].forEach(id=>$(id).classList.toggle("mr-off", !on)); hint();
  }
  async function setOn(v, quiet){ on=!!v; if(on) await load(); sync(); vis(); if(!quiet && onChange) onChange(on); }

  function init(m, cbs){
    map=m; onChange=cbs && cbs.onChange;
    const sel=$("mr-var");                // until meta.json loads (first switch-on), list the variables from the i18n labels
    if(!sel.options.length){ sel.innerHTML=Object.entries(t("mr_var_label")||{}).map(([k, l])=>`<option value="${k}">${l}</option>`).join(""); sel.value=vkey; }
    $("mr-toggle").onchange=e=>setOn(e.target.checked);
    $("mr-auto").onchange=e=>{ auto=e.target.checked; if(on && onChange) onChange(on); };
    $("mr-ol-zone").onchange=e=>{ olZone=e.target.checked; vis(); };
    $("mr-ol-grid").onchange=e=>{ olGrid=e.target.checked; vis(); if(on && onChange) onChange(on); };   // the legend names the frames
    $("mr-unit").querySelectorAll("button").forEach(b=>b.onclick=async()=>{ unit=b.dataset.u; $("map-tooltip").classList.add("hidden"); if(!on) await setOn(true); else { sync(); vis(); onChange && onChange(on); } });
    $("mr-var").onchange=async e=>{ vkey=e.target.value; if(!on) await setOn(true); else onChange && onChange(on); };
    $("mr-yr").querySelectorAll("button").forEach(b=>b.onclick=async()=>{ avg=b.dataset.y==="avg"; if(!on) await setOn(true); else { sync(); onChange && onChange(on); } });
    map.on("mousemove", "mr-fill", onMove);
    map.on("mouseleave", "mr-fill", ()=>{ if(on && unit==="grid") $("map-tooltip").classList.add("hidden"); });
    // a basemap swap drops the layers' state: put them back and redraw
    let waiting=false;
    map.on("styledata", ()=>{ if(!on || !meta || map.getSource(SRC) || waiting) return; waiting=true;
      map.once("idle", ()=>{ waiting=false; if(on && !map.getSource(SRC) && ensureLayers()) onChange && onChange(on); }); });
    sync();
  }
  function refreshText(){ const sel=$("mr-var");
    [...sel.options].forEach(o=>o.textContent=(t("mr_var_label")||{})[o.value]||o.value); hint(); }
  return {init, setOn, render, zoneFn, legendHTML, zoneTip, refreshText, isOn:()=>on, unit:()=>unit, isMonthly,
          setVisible:v=>{ visible=!!v; vis(); if(!visible) $("map-tooltip").classList.add("hidden"); }};
})();
