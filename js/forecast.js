/* MSS downscaled data - "Short-term forecast" tab (user 2026-10-18): Google WeatherNext V3 ensemble statistics as
   coloured grid cells over Singapore (0.05 deg: station-calibrated 2 m temperature / dewpoint; 0.1 deg: wind,
   temperature, radiation, precipitation), grid / variable / statistic from drop-downs, and an hourly time bar at the
   bottom of the map over the forecast window (each hour from the newest init that covers it).
   Data: data/wn3/meta.json + data/wn3/<grid>/<var>.bin, float32 [stat][hour][cell] (web/prepare_wn3.py). */
const Forecast = (()=>{
  const DIR="data/wn3/", HR=3600e3, SGT=8*HR;
  let meta=null, map=null, active=false, ready=false;
  const measuring=()=>typeof Measure!=="undefined" && Measure.busy();   // distance tool active: map clicks / hover pause
  // default view (user 2026-10-18): the 332 subzones (area-weighted grid cells) on the 0.05 deg grid, 2 m temperature, mean
  let grid="0p05", vkey="t2m", stat="mean", cur=0, showGrid=false, timer=null, hoverCell=null, hoverPt=null;
  // colour range: adapted to the shown hour (default, as the reference maps) or fixed over the whole window
  let auto=true, rng=[0,1], speed=1, fill=true;        // fill: the colours on (off = outlines + coastline only)
  // grid switch off: the 332 subzones, each the area-weighted mean of the grid cells it overlaps (weights = subzone ∩
  // cell area, meta.grids[g].zw from web/prepare_wn3.py; nearest grid point only where a subzone overlaps no cell)
  let zones=null, hoverZone=null; const weights={};
  // MSS station dots, one switch of their own (user 2026-10-19; off by default): over the forecast without the swipe,
  // on the observed side of the swipe when it is on
  let stMain=false, stMainNow=null, hoverSt=null;
  function weightsOf(g){ if(weights[g]) return weights[g]; const zw=meta.grids[g].zw||{};
    weights[g]=zones.features.map(f=>zw[f.properties.id] || null); return weights[g]; }
  /* area-weighted value of subzone k for statistic si at the current hour (null if none of its cells has data) */
  function zoneVal(a, si, k){ const W=weightsOf(grid)[k]; if(!W) return null; const C=G().cells.length; let s=0, sw=0;
    W.forEach(([c,w])=>{ const x=a[(si*T()+cur)*C+c]; if(isFinite(x)){ s+=w*x; sw+=w; } }); return sw>0 ? s/sw : null; }
  function rangeOf(v, vals){ if(!auto) return v.range;
    const a=vals.filter(x=>x!=null && isFinite(x)); if(!a.length) return v.range;
    let lo=Math.min(...a), hi=Math.max(...a);
    if(v.kind==="div"){ const m=Math.max(Math.abs(lo), Math.abs(hi), 0.5); return [-m, m]; }
    if(v.kind==="precip") return [0, Math.max(hi, 0.5)];
    if(hi-lo<0.2){ const c=(hi+lo)/2; lo=c-0.1; hi=c+0.1; }
    return [lo, hi]; }
  const cache=new Map();
  const $=id=>document.getElementById(id);
  const G=()=>meta.grids[grid];
  const V=()=>G().vars.find(v=>v.key===vkey) || G().vars[0];
  const T=()=>meta.hours, t0=()=>Date.parse(meta.start_utc);
  const fmt=(v,d)=>v==null || !isFinite(v) ? "—" : (+v).toFixed(d);
  const digits=v=>v.kind==="precip" ? 2 : (v.unit==="W/m²" ? 0 : 1);

  function data(g, k){ const key=g+"/"+k;
    if(!cache.has(key)) cache.set(key, fetch(`${DIR}${g}/${k}.bin`).then(r=>r.ok ? r.arrayBuffer() : null).then(b=>b ? new Float32Array(b) : null));
    return cache.get(key); }

  /* ---- labels (SGT) ---- */
  const sgt=ms=>new Date(ms+SGT);
  const two=n=>String(n).padStart(2,"0");
  function timeLabel(ms){ const d=sgt(ms), wd=t("wn_wday")[d.getUTCDay()], M=t("months")||[];
    return LANG==="zh" ? `${d.getUTCMonth()+1}月${d.getUTCDate()}日 ${wd} ${two(d.getUTCHours())}:00 SGT`
                       : `${wd} ${d.getUTCDate()} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${two(d.getUTCHours())}:00 SGT`; }
  function initLabel(i){ const it=meta.inits[i]; if(!it) return ""; const u=new Date(Date.parse(it.utc)), s=sgt(Date.parse(it.utc));
    return `${u.getUTCFullYear()}-${two(u.getUTCMonth()+1)}-${two(u.getUTCDate())} ${two(u.getUTCHours())}:00 UTC（${two(s.getUTCHours())}:00 SGT）`.replace(/（/g, LANG==="zh"?"（":" (").replace(/）/g, LANG==="zh"?"）":")"); }

  /* ---- map layers ---- */
  function cellsGeo(){ const s=G().step/2;
    return {type:"FeatureCollection", features:G().cells.map(([x,y],i)=>({type:"Feature", id:i, properties:{i, c:null, o:0},
      geometry:{type:"Polygon", coordinates:[[[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s],[x-s,y-s]]]}}))}; }
  let geo=null;
  // isStyleLoaded() is false while tiles still load: add the layers when possible, else retry once the map is idle
  function ensureLayers(){
    if(!map) return false;
    try{ addLayers(); }catch(err){ map.once("idle", ()=>{ if(active) render(); }); return false; }
    vis(); return true;
  }
  function addLayers(){
    if(!map.getSource("wn-grid")) map.addSource("wn-grid", {type:"geojson", data:geo || {type:"FeatureCollection", features:[]}});
    if(!map.getSource("wn-coast")) map.addSource("wn-coast", {type:"geojson", data:DIR+"sg_outline.geojson"});
    if(zones && !map.getSource("wn-sz")) map.addSource("wn-sz", {type:"geojson", data:zones, promoteId:"id"});
    // cell colours by feature-state (as the subzones): stepping the time no longer re-sends the GeoJSON to the worker
    if(!map.getLayer("wn-fill")) map.addLayer({id:"wn-fill", type:"fill", source:"wn-grid",
      paint:{"fill-color":["coalesce",["feature-state","c"],"#000000"], "fill-opacity":["coalesce",["feature-state","o"],0]}});
    if(!map.getLayer("wn-line")) map.addLayer({id:"wn-line", type:"line", source:"wn-grid",
      paint:{"line-color":"#ffffff", "line-width":0.9, "line-opacity":0.8}});
    if(zones && !map.getLayer("wn-sz-fill")) map.addLayer({id:"wn-sz-fill", type:"fill", source:"wn-sz",
      paint:{"fill-color":["coalesce",["feature-state","c"],"#000000"], "fill-opacity":["coalesce",["feature-state","o"],0]}});
    if(zones && !map.getLayer("wn-sz-line")) map.addLayer({id:"wn-sz-line", type:"line", source:"wn-sz",
      paint:{"line-color":"#ffffff", "line-width":0.6, "line-opacity":0.7}});
    if(zones && !map.getLayer("wn-sz-hover")) map.addLayer({id:"wn-sz-hover", type:"line", source:"wn-sz",
      filter:["==",["get","id"],"__none__"], paint:{"line-color":"#0f1419", "line-width":2.2}});
    // Singapore coastline over the cells, as the reference maps (union of the subzones, web/prepare_wn3.py)
    if(!map.getLayer("wn-coast-line")) map.addLayer({id:"wn-coast-line", type:"line", source:"wn-coast",
      paint:{"line-color":"#5b1a2b", "line-width":1.5, "line-opacity":0.95}});
    if(!map.getLayer("wn-hover")) map.addLayer({id:"wn-hover", type:"line", source:"wn-grid",
      filter:["==",["get","i"],-1], paint:{"line-color":"#0f1419", "line-width":2.4}});
    if(!map.getSource("wn-st")) map.addSource("wn-st", {type:"geojson", data:{type:"FeatureCollection", features:[]}});
    if(!map.getLayer("wn-st-dot")) map.addLayer({id:"wn-st-dot", type:"circle", source:"wn-st",
      paint:{"circle-radius":["interpolate",["linear"],["zoom"],10,4.5,14,8], "circle-color":["coalesce",["get","c"],"#ffffff"],
             "circle-stroke-color":"#0f1419", "circle-stroke-width":1.4}});
    if(!ready){ ready=true;
      // a station dot under the pointer wins over the cell / subzone beneath it
      const onDot=pt=>stMain && !cmp && map.getLayer("wn-st-dot") && map.queryRenderedFeatures(pt, {layers:["wn-st-dot"]}).length>0;
      map.on("mousemove", "wn-st-dot", e=>{ if(!active || !e.features.length || measuring()) return; hoverSt=e.features[0].properties; hoverPt=e.point;
        hoverCell=null; hoverZone=null; map.setFilter("wn-hover", ["==",["get","i"],-1]); if(map.getLayer("wn-sz-hover")) map.setFilter("wn-sz-hover", ["==",["get","id"],"__none__"]);
        map.getCanvas().style.cursor="pointer"; tipSt(); });
      map.on("mouseleave", "wn-st-dot", ()=>{ hoverSt=null; map.getCanvas().style.cursor=""; $("map-tooltip").classList.add("hidden"); });
      map.on("mousemove", "wn-fill", e=>{ if(!active || !e.features.length || onDot(e.point) || measuring()) return; hoverCell=e.features[0].properties.i; hoverPt=e.point;
        map.getCanvas().style.cursor="crosshair"; map.setFilter("wn-hover", ["==",["get","i"],hoverCell]); tip(); });
      map.on("mouseleave", "wn-fill", ()=>{ hoverCell=null; map.getCanvas().style.cursor=""; if(map.getLayer("wn-hover")) map.setFilter("wn-hover", ["==",["get","i"],-1]);
        $("map-tooltip").classList.add("hidden"); });
      map.on("mousemove", "wn-sz-fill", e=>{ if(!active || showGrid || !e.features.length || onDot(e.point) || measuring()) return; hoverZone=e.features[0].properties; hoverPt=e.point;
        map.getCanvas().style.cursor="crosshair"; map.setFilter("wn-sz-hover", ["==",["get","id"],hoverZone.id]); tip(); });
      map.on("mouseleave", "wn-sz-fill", ()=>{ hoverZone=null; map.getCanvas().style.cursor=""; if(map.getLayer("wn-sz-hover")) map.setFilter("wn-sz-hover", ["==",["get","id"],"__none__"]);
        $("map-tooltip").classList.add("hidden"); }); }
  }
  function vis(){ if(!map) return; const on=(id, show)=>map.getLayer(id) && map.setLayoutProperty(id, "visibility", show ? "visible" : "none");
    on("wn-coast-line", active);
    ["wn-fill","wn-line","wn-hover"].forEach(id=>on(id, active && showGrid));            // grid cells
    ["wn-sz-fill","wn-sz-line","wn-sz-hover"].forEach(id=>on(id, active && !showGrid));  // subzones, area-weighted cells
    on("wn-st-dot", active && stMain && !cmp);                                           // station dots without the swipe
    // fill off: the fill layers stay (so hover still finds the cells / subzones) at zero opacity; outlines turn grey to stay visible
    if(map.getLayer("wn-fill")) map.setPaintProperty("wn-fill", "fill-opacity", fill ? ["coalesce",["feature-state","o"],0] : 0);
    if(map.getLayer("wn-sz-fill")) map.setPaintProperty("wn-sz-fill", "fill-opacity", fill ? ["coalesce",["feature-state","o"],0] : 0);
    if(map.getLayer("wn-line")) map.setPaintProperty("wn-line", "line-color", fill ? "#ffffff" : "#64748b");
    if(map.getLayer("wn-sz-line")) map.setPaintProperty("wn-sz-line", "line-color", fill ? "#ffffff" : "#64748b");
    const lg=$("wn-legend"); if(lg) lg.style.visibility=fill ? "" : "hidden";
    visR(); }

  /* ---- colour the cells for the current grid / variable / statistic / hour ---- */
  let token=0, geoOn=null;                       // geoOn: the cell GeoJSON the "wn-grid" source holds now
  async function render(){
    if(!meta || !active) return; const my=++token, v=V(), a=await data(grid, v.key); if(my!==token || !a) return;
    legend(); timeText();
    if(!ensureLayers()) return;
    const C=G().cells.length, si=Math.max(0, v.stats.indexOf(stat));
    geo.features.forEach((f,i)=>{ const x=a[(si*T()+cur)*C+i]; f.properties.v=isFinite(x) ? x : null; });
    // swipe comparison: forecast and observed share one colour range
    let extra=[]; if(cmp && mapR){ obsNow=await obsValues(); if(my!==token) return;
      extra=[...(showEra && obsNow.era ? obsNow.era.vals : []), ...(stMain && obsNow.st ? obsNow.st.vals : [])]; }
    else if(stMain){ const st=await stationVals(); if(my!==token) return; stMainNow=st; extra=st ? st.vals : []; }   // dots share the range
    rng=rangeOf(v, [...geo.features.map(f=>f.properties.v), ...extra]); const [lo,hi]=rng; legend();
    geo.features.forEach(f=>{ const p=f.properties;
      if(p.v==null || (v.kind==="precip" && p.v<0.01)){ p.c=null; p.o=0; }       // dry cells: transparent (as the reference maps)
      else { p.c=valueColor(v.cmap, p.v, lo, hi); p.o=0.8; } });
    if(geoOn!==geo){ map.getSource("wn-grid").setData(geo); geoOn=geo; }          // only when the grid changes
    geo.features.forEach((f,i)=>map.setFeatureState({source:"wn-grid", id:i}, {c:f.properties.c, o:f.properties.o}));
    if(!showGrid && zones && map.getSource("wn-sz")){
      zones.features.forEach((f,k)=>{ const x=zoneVal(a, si, k);
        const dry=x==null || (v.kind==="precip" && x<0.01);
        map.setFeatureState({source:"wn-sz", id:f.properties.id}, dry ? {c:null, o:0} : {c:valueColor(v.cmap, x, lo, hi), o:0.82}); }); }
    renderSt(v, lo, hi);
    if(hoverSt) tipSt(); else if(hoverCell!=null || hoverZone) tip();
    if(cmp && mapR && obsNow) renderR(obsNow, v, lo, hi);
  }
  function legend(){
    const v=V(), el=$("wn-legend"); if(!el) return;
    const sl=v.stats.length>1 ? (t("wn_stat_label")[stat]||stat) : t("wn_stat_label").mean;
    el.innerHTML=`<div class="lg-title">${(t("wn_var_label")||{})[v.key]||v.key} · ${sl}</div>`+
      `<div class="lg-bar" style="background:${cmapGradient(v.cmap)}"></div>`+
      `<div class="lg-scale"><span>${fmt(rng[0],digits(v))}</span><span>${v.unit}</span><span>${fmt(rng[1],digits(v))}</span></div>`+
      `<div class="lg-note">${t(auto ? "wn_auto_on" : "wn_auto_off")}</div>`+
      (v.kind==="precip" ? `<div class="lg-note">${t("wn_dry_note")}</div>` : "");
      // the grid / subzone note and the swipe rule are in the short-term About now (user 2026-10-19), see helpInfo()
  }
  async function tip(){
    const el=$("map-tooltip"), v=V(), a=await data(grid, v.key); if(!a || !hoverPt) return;
    let cell=hoverCell, head="", foot="", at;
    const C=G().cells.length, d=digits(v);
    if(!showGrid && hoverZone){ const k=zones.features.findIndex(f=>f.properties.id===hoverZone.id); if(k<0) return;
      const W=weightsOf(grid)[k]||[], [c0,w0]=W[0]||[0,1], [cx,cy]=G().cells[c0];
      at=s=>zoneVal(a, s, k);                       // every statistic area-weighted the same way
      head=`<div class="tt-name">${hoverZone.name_disp||hoverZone.id}</div>`;
      foot=`<div class="tt-row">${t("wn_aw")(W.length, fmt(w0*100,0), fmt(cy,2), fmt(cx,2))}</div>`; }
    else { if(cell==null) return; at=s=>a[(s*T()+cur)*C+cell]; }
    const [x,y]=cell!=null ? G().cells[cell] : [0,0];
    const rows=v.stats.length>1
      ? `<div class="tt-val">${t("wn_stat_label")[stat]}: <b>${fmt(at(v.stats.indexOf(stat)),d)} ${v.unit}</b></div>`+
        `<div class="tt-row">${t("wn_stat_label").mean} ${fmt(at(0),d)} · p10–p90 ${fmt(at(1),d)} – ${fmt(at(5),d)} ${v.unit}</div>`
      : `<div class="tt-val">${fmt(at(0),d)} ${v.unit}</div><div class="tt-row">${t("wn_rh_note")}</div>`;
    el.innerHTML=head+`<div class="tt-name">${(t("wn_var_label")||{})[v.key]||v.key}</div>${rows}`+
      `<div class="tt-row">${timeLabel(t0()+cur*HR)}${head ? "" : ` · ${fmt(y,2)}°N ${fmt(x,2)}°E`}</div>`+foot;
    el.style.left=(hoverPt.x+14)+"px"; el.style.top=(hoverPt.y+14)+"px"; el.classList.remove("hidden");
  }

  /* ======== forecast vs observed: swipe comparison (user 2026-10-18) ========
     A second, camera-locked map lies over the first and is clipped to the right of a draggable divider: left = the
     forecast, right = ERA5-Land or ERA5 (2 m T / Td / RH, chosen in the panel) or ERA5 (wind, radiation, rain) for the same hour on the
     same colour range, plus the MSS station observations as dots. Data (web/prepare_wn3.py): data/wn3/obs/<src>/
     <var>.bin float32 [hour][cell] and data/wn3/stations.bin float32 [column][hour][station]. */
  let cmp=false, mapR=null, rReady=false, splitF=0.5, syncing=false, syncA=null, obsNow=null, rGeo=null, rSrc=null, rHover=null, rGeoOn=null;
  const obsBins=new Map();
  function obsBin(path){ if(!obsBins.has(path)) obsBins.set(path, fetch(DIR+path).then(r=>r.ok ? r.arrayBuffer() : null)
      .then(b=>b ? new Float32Array(b) : null).catch(()=>null)); return obsBins.get(path); }
  // 2 m T / Td / RH: the panel picks ERA5-Land (0.1°, land only; default) or ERA5 (0.25°, sea too) (user 2026-10-19)
  const ERA_PICK=["t2m","d2m","rh"]; let eraT="era5land";
  const eraBoth=k=>{ const E=(meta.obs||{}).era5||{}; return ERA_PICK.includes(k) && ["era5land","era5"].every(s=>E[s] && E[s].vars.includes(k)); };
  function eraOf(k){ const O=meta.obs||{}, E=O.era5||{}, m=(O.era_src||{})[k]; if(!m) return null; let [src,vr]=m;
    if(eraBoth(k)){ src=eraT; vr=k; }
    if(!(E[src] && E[src].vars.includes(vr))){ if(E.era5 && E.era5.vars.includes(vr)) src="era5"; else return null; }
    return {src, vr, g:E[src]}; }
  // the reanalysis cells (swipe option) and the station dots (stMain, a switch of its own) can each be shown / hidden
  // (user 2026-10-19); a hidden one is also left out of the colour range
  let showEra=true;
  function eraRow(){ const row=$("wn-era-row"), s=$("wn-era"); if(!row || !meta) return;
    s.innerHTML=["era5land","era5"].map(k=>`<option value="${k}">${t("cmp_era_opt")[k]}</option>`).join(""); s.value=eraT;
    s.disabled=!showEra; $("wn-obs").classList.toggle("hidden", !cmp); row.classList.toggle("hidden", !(cmp && eraBoth(vkey))); }
  async function obsValues(){
    const out={era:null, st:null}, e=eraOf(vkey);
    if(e){ const a=await obsBin(`obs/${e.src}/${e.vr}.bin`), C=e.g.cells.length;
      if(a){ const vals=e.g.cells.map((_,i)=>{ const x=a[cur*C+i]; return isFinite(x) ? x : null; }); if(vals.some(x=>x!=null)) out.era={...e, vals}; } }
    out.st=await stationVals();
    return out; }
  const stCol=()=>{ const S=(meta.obs||{}).stations; return S && S.map[vkey]; };
  async function stationVals(){                              // the station observations of the shown variable / hour
    const S=(meta.obs||{}).stations, col=stCol(); if(!col) return null;
    const a=await obsBin("stations.bin"), k=S.cols.indexOf(col), N=S.stations.length; if(!a || k<0) return null;
    const vals=S.stations.map((_,i)=>{ const x=a[(k*T()+cur)*N+i]; return isFinite(x) ? x : null; });
    return vals.some(x=>x!=null) ? {vals, list:S.stations} : null; }
  const stFeats=(st, colOf)=>st ? st.list.map(([id,name,lat,lon],i)=>({type:"Feature", geometry:{type:"Point", coordinates:[lon,lat]},
      properties:{id, name, v:st.vals[i], c:colOf(st.vals[i])}})).filter(f=>f.properties.v!=null) : [];
  function renderSt(v, lo, hi){                              // the dots over the forecast (no swipe)
    const src=map.getSource("wn-st"); if(!src) return;
    const colOf=x=>x==null || (v.kind==="precip" && x<0.01) ? null : valueColor(v.cmap, x, lo, hi);
    src.setData({type:"FeatureCollection", features:stMain && !cmp ? stFeats(stMainNow, colOf) : []});
    $("wn-st-note").textContent=stMain && !stCol() ? t("wn_st_none") : ""; }
  function tipSt(){
    const el=$("map-tooltip"), v=V(), h=hoverSt; if(!h || !hoverPt) return;
    const i=stMainNow ? stMainNow.list.findIndex(s=>s[0]===h.id) : -1, val=i>=0 ? stMainNow.vals[i] : null;
    el.innerHTML=`<div class="tt-name">${t("cmp_st_one")} · ${h.name}</div><div class="tt-val">${(t("wn_var_label")||{})[v.key]||v.key}: <b>${fmt(val,digits(v))} ${v.unit}</b></div>`+
      `<div class="tt-row">${t("cmp_obs")} · ${timeLabel(t0()+cur*HR)} · ${t("cmp_st_note")}</div>`;
    el.style.left=(hoverPt.x+14)+"px"; el.style.top=(hoverPt.y+14)+"px"; el.classList.remove("hidden"); }
  const cellsGeoOf=(cells, step)=>{ const s=step/2; return {type:"FeatureCollection", features:cells.map(([x,y],i)=>({type:"Feature", id:i,
      properties:{i, c:null, o:0}, geometry:{type:"Polygon", coordinates:[[[x-s,y-s],[x+s,y-s],[x+s,y+s],[x-s,y+s],[x-s,y-s]]]}}))}; };
  const camOf=m=>({center:m.getCenter(), zoom:m.getZoom(), bearing:m.getBearing(), pitch:m.getPitch()});
  function enableCmp(){
    if(mapR || !map) return;
    const wrap=$("map-wrap"), el=document.createElement("div"); el.id="map-r"; wrap.appendChild(el);
    const key=$("basemap-select") ? $("basemap-select").value : "grey";
    mapR=new maplibregl.Map({container:el, style:BASEMAPS[key]||BASEMAPS.grey, ...camOf(map), attributionControl:{compact:true}});
    mapR.addControl(new maplibregl.NavigationControl({showCompass:false}), "top-right"); mapR.doubleClickZoom.disable();
    mapR.addControl(new maplibregl.ScaleControl({maxWidth:110, unit:"metric"}), "bottom-right");   // the swipe covers the main map's corner
    if(typeof Measure!=="undefined") Measure.addMap(mapR);                    // measuring works on the observed side too
    const sync=(a,b)=>()=>{ if(syncing || !b) return; syncing=true; b.jumpTo(camOf(a)); syncing=false; };
    syncA=sync(map, mapR); map.on("move", syncA); mapR.on("move", sync(mapR, map));
    mapR.on("load", ()=>{ rReady=true; addLayersR(); render(); });
    ["wn-swipe","wn-sw-l","wn-sw-r"].forEach(id=>$(id).classList.remove("hidden"));
    placeSplit();
  }
  function disableCmp(){
    if(!mapR) return; if(syncA) map.off("move", syncA); if(typeof Measure!=="undefined") Measure.removeMap(mapR);
    mapR.remove(); mapR=null; rReady=false; rSrc=null; rGeo=null; rHover=null; obsNow=null; rGeoOn=null;
    const el=$("map-r"); if(el) el.remove();
    ["wn-swipe","wn-sw-l","wn-sw-r","wn-sw-msg"].forEach(id=>$(id).classList.add("hidden"));
  }
  // flip (double-click the ⇆ handle, user 2026-10-19): observed on the left of the divider, forecast on the right
  let flip=false;
  function placeSplit(){
    const wrap=$("map-wrap"), el=$("map-r"); if(!wrap || !el) return; const w=wrap.getBoundingClientRect().width, x=Math.round(w*splitF);
    el.style.clipPath=flip ? `inset(0 ${w-x}px 0 0)` : `inset(0 0 0 ${x}px)`; $("wn-swipe").style.left=x+"px";
    const L=$(flip ? "wn-sw-r" : "wn-sw-l"), R=$(flip ? "wn-sw-l" : "wn-sw-r");
    L.style.left=""; L.style.right=`calc(100% - ${x}px + 12px)`; R.style.right=""; R.style.left=(x+12)+"px";
    $("wn-sw-msg").style.left=flip ? `${x/2}px` : `${x+(w-x)/2}px`;
  }
  function addLayersR(){
    const m=mapR; if(!m || !rReady) return;
    if(!m.getSource("ob-grid")){ m.addSource("ob-grid", {type:"geojson", data:rGeo || {type:"FeatureCollection", features:[]}}); rGeoOn=rGeo; }
    if(zones && !m.getSource("ob-sz")) m.addSource("ob-sz", {type:"geojson", data:zones, promoteId:"id"});
    if(!m.getSource("ob-coast")) m.addSource("ob-coast", {type:"geojson", data:DIR+"sg_outline.geojson"});
    if(!m.getSource("ob-st")) m.addSource("ob-st", {type:"geojson", data:{type:"FeatureCollection", features:[]}});
    if(!m.getLayer("ob-fill")) m.addLayer({id:"ob-fill", type:"fill", source:"ob-grid", paint:{"fill-color":["coalesce",["feature-state","c"],"#000000"], "fill-opacity":["coalesce",["feature-state","o"],0]}});
    if(!m.getLayer("ob-line")) m.addLayer({id:"ob-line", type:"line", source:"ob-grid", paint:{"line-color":"#ffffff", "line-width":0.9, "line-opacity":0.8}});
    if(zones && !m.getLayer("ob-sz-fill")) m.addLayer({id:"ob-sz-fill", type:"fill", source:"ob-sz",
      paint:{"fill-color":["coalesce",["feature-state","c"],"#000000"], "fill-opacity":["coalesce",["feature-state","o"],0]}});
    if(zones && !m.getLayer("ob-sz-line")) m.addLayer({id:"ob-sz-line", type:"line", source:"ob-sz", paint:{"line-color":"#ffffff", "line-width":0.6, "line-opacity":0.7}});
    if(!m.getLayer("ob-coast-line")) m.addLayer({id:"ob-coast-line", type:"line", source:"ob-coast", paint:{"line-color":"#5b1a2b", "line-width":1.5, "line-opacity":0.95}});
    if(!m.getLayer("ob-st-dot")) m.addLayer({id:"ob-st-dot", type:"circle", source:"ob-st",
      paint:{"circle-radius":["interpolate",["linear"],["zoom"],10,4.5,14,8], "circle-color":["coalesce",["get","c"],"#ffffff"],
             "circle-stroke-color":"#0f1419", "circle-stroke-width":1.4}});
    m.off("mousemove", onMoveR); m.on("mousemove", onMoveR);
    m.getCanvas().addEventListener("mouseleave", ()=>{ rHover=null; $("map-tooltip").classList.add("hidden"); });
    visR();
  }
  function visR(){ const m=mapR; if(!m || !rReady) return; const on=(id, show)=>m.getLayer(id) && m.setLayoutProperty(id, "visibility", show ? "visible" : "none");
    ["ob-fill","ob-line"].forEach(id=>on(id, showGrid)); ["ob-sz-fill","ob-sz-line"].forEach(id=>on(id, !showGrid));
    if(m.getLayer("ob-fill")) m.setPaintProperty("ob-fill", "fill-opacity", fill ? ["coalesce",["feature-state","o"],0] : 0);
    if(m.getLayer("ob-sz-fill")) m.setPaintProperty("ob-sz-fill", "fill-opacity", fill ? ["coalesce",["feature-state","o"],0] : 0);
    ["ob-line","ob-sz-line"].forEach(id=>m.getLayer(id) && m.setPaintProperty(id, "line-color", fill ? "#ffffff" : "#64748b")); }
  function renderR(ob, v, lo, hi){
    if(!mapR || !rReady) return; addLayersR();
    const colOf=x=>x==null || (v.kind==="precip" && x<0.01) ? null : valueColor(v.cmap, x, lo, hi);
    ob={...ob, era:showEra ? ob.era : null, st:stMain ? ob.st : null};
    // cells by feature-state too; the GeoJSON is re-sent only when the source (ERA5-Land / ERA5 / none) changes
    if(ob.era){ if(rSrc!==ob.era.src){ rSrc=ob.era.src; rGeo=cellsGeoOf(ob.era.g.cells, ob.era.g.step); }
      if(rGeoOn!==rGeo){ mapR.getSource("ob-grid").setData(rGeo); rGeoOn=rGeo; }
      rGeo.features.forEach((f,i)=>{ const x=ob.era.vals[i], c=colOf(x); Object.assign(f.properties, {v:x, c, o:c ? 0.8 : 0});
        mapR.setFeatureState({source:"ob-grid", id:i}, {c, o:c ? 0.8 : 0}); }); }
    else if(rGeoOn){ mapR.getSource("ob-grid").setData({type:"FeatureCollection", features:[]}); rGeoOn=null; }
    if(zones && mapR.getSource("ob-sz")){ const zw=ob.era ? (ob.era.g.zw||{}) : {};
      zones.features.forEach(f=>{ let s=0, sw=0; (zw[f.properties.id]||[]).forEach(([c,w])=>{ const x=ob.era.vals[c]; if(x!=null){ s+=w*x; sw+=w; } });
        const x=sw>0 ? s/sw : null, c=colOf(x); mapR.setFeatureState({source:"ob-sz", id:f.properties.id}, {c, o:c ? 0.82 : 0, v:x}); }); }
    const feats=ob.st ? ob.st.list.map(([id,name,lat,lon],i)=>({type:"Feature", geometry:{type:"Point", coordinates:[lon,lat]},
      properties:{id, name, v:ob.st.vals[i], c:colOf(ob.st.vals[i])}})).filter(f=>f.properties.v!=null) : [];
    mapR.getSource("ob-st").setData({type:"FeatureCollection", features:feats});
    const sl=v.stats.length>1 ? (t("wn_stat_label")[stat]||stat) : t("wn_stat_label").mean;
    $("wn-sw-l").innerHTML=`<b>${t("cmp_fc")}</b> · WeatherNext V3 · ${sl}`;
    const parts=[...(showEra ? [ob.era ? t("cmp_src")[ob.era.src] : t("cmp_noera")] : []), ...(feats.length ? [t("cmp_st")(feats.length)] : [])];
    $("wn-sw-r").innerHTML=`<b>${t("cmp_obs")}</b> · ${parts.join(" + ") || t("cmp_none")}`;
    const msg=$("wn-sw-msg"), nSt=stMain ? feats.length : -1; msg.classList.toggle("hidden", !showEra || !!ob.era);   // -1: dots hidden on purpose
    if(showEra && !ob.era) msg.innerHTML=eraOf(vkey) || (meta.obs && meta.obs.era5 && Object.keys(meta.obs.era5).length) ? t("cmp_noera_hour")(nSt) : t("cmp_noera_msg")(nSt);
    if(rHover) tipR();
  }
  function onMoveR(e){
    if(!mapR || measuring()) return;                                  // no ERA5 for this hour: only the station dots answer the hover
    const L=[...(stMain ? ["ob-st-dot"] : []), ...(showEra && obsNow && obsNow.era ? [showGrid ? "ob-fill" : "ob-sz-fill"] : [])].filter(id=>mapR.getLayer(id));
    const fs=mapR.queryRenderedFeatures(e.point, {layers:L}); if(!fs.length){ rHover=null; $("map-tooltip").classList.add("hidden"); return; }
    const f=fs[0]; rHover={layer:f.layer.id, p:f.properties, id:f.properties.id ?? f.id, pt:e.point}; tipR(); }
  function tipR(){
    const el=$("map-tooltip"), v=V(), d=digits(v), h=rHover; if(!h || !obsNow) return; let head="", val=null, foot="";
    if(h.layer==="ob-st-dot"){ const i=obsNow.st ? obsNow.st.list.findIndex(s=>s[0]===h.p.id) : -1; val=i>=0 ? obsNow.st.vals[i] : null;
      head=`${t("cmp_st_one")} · ${h.p.name}`; foot=t("cmp_st_note"); }
    else if(h.layer==="ob-fill"){ val=obsNow.era ? obsNow.era.vals[h.p.i] : null; const [x,y]=obsNow.era ? obsNow.era.g.cells[h.p.i] : [0,0];
      head=obsNow.era ? t("cmp_src")[obsNow.era.src] : ""; foot=`${fmt(y,2)}°N ${fmt(x,2)}°E`; }
    else { const st=mapR.getFeatureState({source:"ob-sz", id:h.p.id}); val=st ? st.v : null;
      head=h.p.name_disp || h.p.id; foot=obsNow.era ? `${t("cmp_src")[obsNow.era.src]} · ${t("cmp_aw")}` : ""; }
    el.innerHTML=`<div class="tt-name">${head}</div><div class="tt-val">${(t("wn_var_label")||{})[v.key]||v.key}: <b>${fmt(val,d)} ${v.unit}</b></div>`+
      `<div class="tt-row">${t("cmp_obs")} · ${timeLabel(t0()+cur*HR)}${foot ? " · "+foot : ""}</div>`;
    el.style.left=(h.pt.x+14)+"px"; el.style.top=(h.pt.y+14)+"px"; el.classList.remove("hidden");
  }

  /* ---- controls ---- */
  function buildSelects(){
    const gs=$("wn-grid"), vs=$("wn-var"), ss=$("wn-stat"); if(!gs) return;
    gs.innerHTML=Object.keys(meta.grids).map(g=>`<option value="${g}">${t("wn_grid_label")[g]||g}</option>`).join(""); gs.value=grid;
    if(!G().vars.some(v=>v.key===vkey)) vkey=G().vars[0].key;
    vs.innerHTML=G().vars.map(v=>`<option value="${v.key}">${(t("wn_var_label")||{})[v.key]||v.key}</option>`).join(""); vs.value=vkey;
    const st=V().stats; if(!st.includes(stat)) stat=st[0];
    ss.innerHTML=meta.stats.map(s=>`<option value="${s}"${st.includes(s)?"":" disabled"}>${t("wn_stat_label")[s]||s}</option>`).join(""); ss.value=stat;
    ss.disabled=st.length<2; $("wn-stat-note").textContent=st.length<2 ? t("wn_rh_note") : "";
    eraRow();
  }
  /* "current data" paragraphs of the short-term About (user 2026-10-19): the latest init / time-axis summary (was in
     the panel) and what the map shows now - grid or area-weighted subzones, the swipe rule (were in the legend) */
  function helpInfo(){
    if(!meta) return []; const last=meta.inits.length-1, a=t0(), b=t0()+(T()-1)*HR;
    const view=showGrid ? t("wn_grid_label")[grid] : t("wn_zone_note")(t("wn_grid_label")[grid]);
    return [t("wn_info")(initLabel(last), timeLabel(a), timeLabel(b), meta.inits.length),
            t("wn_view_now")(view) + (cmp ? " " + t("cmp_legend_help")(flip) : stMain ? " " + t("wn_view_st") : "")];
  }
  function timeText(){
    const ms=t0()+cur*HR, i=G().init_idx[cur], lead=G().lead[cur], now=Date.now();
    $("wn-time").textContent=timeLabel(ms);
    $("wn-init").textContent=i>=0 ? t("wn_init")(initLabel(i), t("wn_kind")[meta.inits[i].kind], lead) : t("wn_none");
    $("wn-when").textContent=ms+HR<=now ? t("wn_past") : (ms<=now ? t("wn_now_lbl") : "");
    $("wn-slider").value=cur;
  }
  function ticks(){
    const el=$("wn-ticks"); if(!el) return; const n=T(), out=[];
    // with ~30 days on the axis (15 past + 15 ahead) a label per day overlaps: label every 2nd / 5th day as width needs
    const perDay=(el.clientWidth || 460)/(n/24), every=perDay>=26 ? 1 : perDay>=13 ? 2 : perDay>=6 ? 5 : 10;
    for(let k=0, j=0;k<n;k++){ const d=sgt(t0()+k*HR); if(d.getUTCHours()===0 && (j++)%every===0)
      out.push(`<span style="left:${(k/(n-1)*100).toFixed(2)}%">${d.getUTCDate()}${LANG==="zh"?"日":""}</span>`); }
    const now=(Date.now()-t0())/HR;
    if(now>=0 && now<=n-1) out.push(`<i class="wn-nowmark" style="left:${(now/(n-1)*100).toFixed(2)}%" title="${t("wn_now_lbl")}"></i>`);
    el.innerHTML=out.join("");
  }
  const nowIndex=()=>Math.max(0, Math.min(T()-1, Math.floor((Date.now()-t0())/HR)));
  // dragging the slider fires an input event per hour passed: the time text follows at once, the maps redraw at most
  // once per frame (user 2026-10-19: dragging was not smooth)
  let rafT=0;
  function setT(k){ cur=Math.max(0, Math.min(T()-1, k)); timeText();
    if(!rafT) rafT=requestAnimationFrame(()=>{ rafT=0; render(); }); }
  /* the time label can be typed in (user 2026-10-19): a click turns it into a datetime-local box in SGT, whole hours */
  const sgtStr=ms=>sgt(ms).toISOString().slice(0,16);                    // "YYYY-MM-DDTHH:MM", SGT wall clock
  const fromSgtStr=s=>{ const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(s||""); return m ? Date.UTC(+m[1], m[2]-1, +m[3], +m[4]) - SGT : NaN; };
  let editFrom=null;
  function editTime(on){ const lb=$("wn-time"), inp=$("wn-time-in");
    if(on){ play(false); editFrom=cur; inp.min=sgtStr(t0()); inp.max=sgtStr(t0()+(T()-1)*HR); inp.value=sgtStr(t0()+cur*HR);
      lb.classList.add("hidden"); inp.classList.remove("hidden"); inp.focus(); }
    else { editFrom=null; inp.classList.add("hidden"); lb.classList.remove("hidden"); } }   // editFrom first: hiding blurs
  function applyTime(){ const ms=fromSgtStr($("wn-time-in").value); if(isFinite(ms)) setT(Math.floor((ms-t0())/HR)); }
  function play(on){ const b=$("wn-play");
    if(on===undefined) on=!timer;
    if(timer){ clearInterval(timer); timer=null; }
    if(on){ if(cur>=T()-1) cur=0; timer=setInterval(()=>{ if(cur>=T()-1){ play(false); return; } setT(cur+1); }, 450/speed); }
    b.innerHTML=timer ? "❚❚" : "▶"; b.title=t(timer ? "wn_pause" : "wn_play"); }
  function wire(){
    const unhover=()=>{ hoverCell=null; $("map-tooltip").classList.add("hidden"); if(map && map.getLayer("wn-hover")) map.setFilter("wn-hover", ["==",["get","i"],-1]); };
    $("wn-grid").onchange=e=>{ grid=e.target.value; geo=cellsGeo(); unhover(); buildSelects(); render(); };
    $("wn-auto").onchange=e=>{ auto=e.target.checked; render(); };
    $("wn-fill").onchange=e=>{ fill=e.target.checked; vis(); };
    $("wn-cmp").onchange=e=>{ cmp=e.target.checked; if(cmp) enableCmp(); else disableCmp(); eraRow(); render(); };
    const obsSwitch=f=>e=>{ f(e.target.checked); rHover=null; $("map-tooltip").classList.add("hidden"); eraRow(); render(); };
    $("wn-era").onchange=obsSwitch(()=>{ eraT=$("wn-era").value; });
    $("wn-show-era").onchange=obsSwitch(on=>{ showEra=on; });
    $("wn-st-main").onchange=e=>{ stMain=e.target.checked; hoverSt=null; stMainNow=null; $("map-tooltip").classList.add("hidden"); vis(); render(); };
    $("wn-swipe").onpointerdown=e=>{ e.preventDefault(); const r=$("map-wrap").getBoundingClientRect();
      const mv=ev=>{ splitF=Math.min(0.95, Math.max(0.05, (ev.clientX-r.left)/r.width)); placeSplit(); };
      const up=()=>{ window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); };
      window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up); };
    $("wn-swipe").ondblclick=e=>{ e.preventDefault(); e.stopPropagation(); flip=!flip; rHover=null; $("map-tooltip").classList.add("hidden"); placeSplit(); };
    window.addEventListener("resize", ()=>{ if(mapR) placeSplit(); if(active) ticks(); });
    $("wn-var").onchange=e=>{ vkey=e.target.value; buildSelects(); render(); };
    $("wn-stat").onchange=e=>{ stat=e.target.value; render(); };
    $("wn-gridline").onchange=e=>{ showGrid=e.target.checked; unhover(); hoverZone=null; vis(); render(); };
    $("wn-slider").oninput=e=>setT(+e.target.value);
    $("wn-time").onclick=()=>editTime(true);
    $("wn-time").onkeydown=e=>{ if(e.key==="Enter" || e.key===" "){ e.preventDefault(); e.stopPropagation(); editTime(true); } };   // not play / pause
    const tin=$("wn-time-in");
    tin.onchange=applyTime;                                   // a complete date + hour jumps there at once
    tin.onkeydown=e=>{ if(e.key==="Enter"){ e.preventDefault(); applyTime(); editTime(false); $("wn-time").focus(); }
      else if(e.key==="Escape"){ e.stopPropagation(); const k=editFrom; editTime(false); if(k!=null) setT(k); } };
    tin.onblur=()=>{ if(editFrom!=null){ applyTime(); editTime(false); } };
    $("wn-prev").onclick=()=>{ play(false); setT(cur-1); };
    $("wn-next").onclick=()=>{ play(false); setT(cur+1); };
    $("wn-play").onclick=()=>play();
    // playback speed 1x / 2x / 4x (user 2026-10-18): 450 / 225 / 112 ms per hour; a running playback picks it up at once
    $("wn-speed").querySelectorAll("button").forEach(b=>b.onclick=()=>{ speed=+b.dataset.s;
      $("wn-speed").querySelectorAll("button").forEach(x=>x.classList.toggle("active", x===b)); if(timer) play(true); });
    $("wn-now").onclick=()=>{ play(false); setT(nowIndex()); };
    document.addEventListener("keydown", e=>{ if(!active || /input|select|textarea/i.test(e.target.tagName)) return;
      if(e.key==="ArrowLeft"){ play(false); setT(cur-1); } else if(e.key==="ArrowRight"){ play(false); setT(cur+1); } else if(e.key===" "){ e.preventDefault(); play(); } });
  }

  /* ---- public ---- */
  let wired=false;
  async function activate(m, subzones){
    map=m; active=true; if(subzones && !zones) zones=subzones;
    if(!meta){ try{ meta=await fetch(DIR+"meta.json").then(r=>r.json()); }catch(err){ $("wn-info").textContent=t("wn_nodata"); return; }
      geo=cellsGeo(); cur=nowIndex(); $("wn-slider").max=T()-1; }
    if(!wired){ wire(); wired=true; }
    buildSelects(); ticks(); ensureLayers(); render();
    fitGrid(); if(cmp) enableCmp();
  }
  /* camera on the forecast grids (both resolutions), room left for the time bar at the bottom */
  function fitGrid(){ let x0=180, y0=90, x1=-180, y1=-90;
    if(!showGrid && zones){                                  // subzone view: frame Singapore itself
      const scan=c=>{ if(typeof c[0]==="number"){ x0=Math.min(x0,c[0]); x1=Math.max(x1,c[0]); y0=Math.min(y0,c[1]); y1=Math.max(y1,c[1]); } else c.forEach(scan); };
      zones.features.forEach(f=>scan(f.geometry.coordinates)); }
    else Object.values(meta.grids).forEach(g=>g.cells.forEach(([x,y])=>{ const s=g.step/2;
      x0=Math.min(x0,x-s); x1=Math.max(x1,x+s); y0=Math.min(y0,y-s); y1=Math.max(y1,y+s); }));
    map.fitBounds([[x0,y0],[x1,y1]], {padding:{top:30, left:30, right:30, bottom:150}, duration:700}); }
  function deactivate(){ active=false; play(false); hoverCell=null; hoverSt=null; vis(); disableCmp(); }
  // render() also redraws the legend, the time text and the swipe badges in the new language
  function refreshText(){ if(!meta) return; buildSelects(); ticks(); if(active) render(); }
  /* after a basemap swap the carried layers come back; make sure the hover handlers and visibility still hold */
  function restyle(){ if(active) setTimeout(()=>{ geoOn=null; ensureLayers(); if(mapR){ disableCmp(); enableCmp(); } render(); }, 60); }
  return {activate, deactivate, refreshText, restyle, helpInfo, isActive:()=>active};
})();
