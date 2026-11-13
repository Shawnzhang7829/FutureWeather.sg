/* MapLibre map: switchable basemap + subzone choropleth, hover, click,
   selection highlight, Jurong-Gateway restriction. */
function _raster(tiles, attribution, bg, extra){
  const src = { type:"raster", tiles:(Array.isArray(tiles)?tiles:[tiles]), tileSize:256, attribution };
  if(extra) Object.assign(src, extra);
  return { version:8, sources:{ base:src },
    layers:[ {id:"bg",type:"background",paint:{"background-color":bg||"#e7e9ec"}},
             {id:"base",type:"raster",source:"base"} ] };
}
const BASEMAPS = {
  grey: _raster(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    "Tiles © Esri", "#e7e9ec", {maxzoom:16}),
  satellite: _raster(
    ["https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
     "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
     "https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
     "https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
    "© Google", "#000000", {maxzoom:20}),
  openfreemap: "https://tiles.openfreemap.org/styles/positron",    // vector style URL (grey)
  onemap: _raster(
    "https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png",
    '© OneMap · <a href="https://www.sla.gov.sg">SLA</a>', "#e7e9ec",
    {minzoom:11, maxzoom:19}),
};
const SG_BOUNDS = [[103.59,1.20],[104.06,1.48]];

const MapView = (()=>{
  let map, geo, jgeo, cbHover, cbClick, cbLeave, cbDbl, cbCtrl, onReady;
  let jurongOnly=false, valueFn=null, lastSelected=[], dblTimer=null, ready=false;

  /* subzones that were not downscaled (UT&C passthrough: source EPW) get a magenta hover / selection outline
     instead of teal / orange (user 2026-10-10; same as UBEM.sg) */
  const NODS_CAT = ["tree_taller", "no_building", "crown_overshrunk"], C_NODS = "#ff00ff";
  const nodsColor = c=>["case", ["in", ["get","category"], ["literal", NODS_CAT]], C_NODS, c];
  function bbox(g){
    let x0=180,y0=90,x1=-180,y1=-90;
    const scan=c=>{ if(typeof c[0]==="number"){x0=Math.min(x0,c[0]);x1=Math.max(x1,c[0]);y0=Math.min(y0,c[1]);y1=Math.max(y1,c[1]);} else c.forEach(scan); };
    g.features.forEach(f=>scan(f.geometry.coordinates));
    return [[x0,y0],[x1,y1]];
  }

  // ---- interaction handlers (named so they can be off/on across basemap swaps) ----
  const measuring=()=>typeof Measure!=="undefined" && Measure.busy();   // distance tool active: map clicks / hover pause
  function onMove(e){ if(!e.features.length || measuring()) return; const p=e.features[0].properties;
    map.getCanvas().style.cursor="pointer"; map.setFilter("sz-hover",["==",["get","id"],p.id]); cbHover&&cbHover(p,e.point); }
  function onLeaveFill(){ map.getCanvas().style.cursor=""; map.setFilter("sz-hover",["==",["get","id"],"__none__"]); cbLeave&&cbLeave(); }
  function onClickFill(e){ if(!e.features.length || measuring()) return; const p=e.features[0].properties;
    const oe=e.originalEvent;                                               // Ctrl / Cmd + click: (de)select at once
    if(cbCtrl && oe && (oe.ctrlKey || oe.metaKey)){ if(dblTimer){ clearTimeout(dblTimer); dblTimer=null; } cbCtrl(p); return; }
    if(dblTimer){ clearTimeout(dblTimer); dblTimer=null; return; }          // 2nd click of a pair
    dblTimer=setTimeout(()=>{ dblTimer=null; cbClick&&cbClick(p); }, 250); }
  function onDblFill(e){ if(dblTimer){ clearTimeout(dblTimer); dblTimer=null; } if(measuring()) return;
    if(e.features.length) cbDbl&&cbDbl(e.features[0].properties); }

  function bindInteractions(){
    map.off("mousemove","sz-fill",onMove);       map.on("mousemove","sz-fill",onMove);
    map.off("mouseleave","sz-fill",onLeaveFill); map.on("mouseleave","sz-fill",onLeaveFill);
    map.off("click","sz-fill",onClickFill);      map.on("click","sz-fill",onClickFill);
    map.off("dblclick","sz-fill",onDblFill);     map.on("dblclick","sz-fill",onDblFill);
  }

  let hideNods=false;                 // non-downscaled subzones switched off (category tabs, user 2026-10-10)
  // Jurong Gateway only: also outline the subzones outside it (no colours; user 2026-10-21)
  let jgOthers=false;
  function zoneFilter(lines){ const c=[];
    if(jurongOnly && !(lines && jgOthers)) c.push(["==",["get","in_jurong"],true]);
    if(hideNods) c.push(["!", ["in", ["get","category"], ["literal", NODS_CAT]]]);
    return c.length ? (c.length>1 ? ["all", ...c] : c[0]) : null; }
  let ltOn=true;                      // long-term projection tab shown (false = short-term forecast, js/forecast.js)
  function applyJurong(){
    if(!map.getLayer("jg-line")) return;
    map.setLayoutProperty("jg-casing","visibility", jurongOnly && ltOn?"visible":"none");
    map.setLayoutProperty("jg-line","visibility", jurongOnly && ltOn?"visible":"none");
    map.setFilter("sz-fill", zoneFilter());
    map.setFilter("sz-line", zoneFilter(true));
  }
  function setJurongOthers(on){ jgOthers=!!on; if(map && map.getLayer("sz-line")) applyJurong(); }
  function setHideNods(on){ hideNods=!!on; if(map && map.getLayer("sz-fill")){ applyJurong(); applyCat(); } }

  /* add subzone + jurong sources/layers and re-apply all state. Idempotent, so
     it can run again after setStyle (which wipes custom sources/layers). */
  function addOverlays(){
    if(!map.getSource("subzones")) map.addSource("subzones",{type:"geojson", data:geo});
    if(!map.getSource("jurong"))   map.addSource("jurong",{type:"geojson", data:jgeo});
    if(!map.getLayer("sz-fill")) map.addLayer({id:"sz-fill", type:"fill", source:"subzones",
      paint:{"fill-color":["coalesce",["get","_color"],"#9aa3ad"], "fill-opacity":["coalesce",["get","_fill"],0]}});
    if(!map.getLayer("sz-line")) map.addLayer({id:"sz-line", type:"line", source:"subzones",
      paint:{"line-color":"#9aa3ad","line-width":0.7,"line-opacity":0.85}});
    // category highlight (Subzone selection & download tabs): outline in the category's circle colour
    if(!map.getLayer("sz-cat")) map.addLayer({id:"sz-cat", type:"line", source:"subzones",
      filter:["==",["get","category"],"__none__"], paint:{"line-color":"#888888","line-width":2.2,"line-opacity":0.95}});
    if(!map.getLayer("sz-hover")) map.addLayer({id:"sz-hover", type:"line", source:"subzones",
      filter:["==",["get","id"],"__none__"], paint:{"line-color":nodsColor("#0ea5b7"),"line-width":2.4}});
    if(!map.getLayer("sz-sel")) map.addLayer({id:"sz-sel", type:"line", source:"subzones",
      filter:["in",["get","id"],["literal",[]]], paint:{"line-color":nodsColor("#f97316"),"line-width":2.8}});
    // the subzones compared in the curves window, each in its curve colour (user 2026-10-24)
    if(!map.getLayer("sz-cmp")) map.addLayer({id:"sz-cmp", type:"line", source:"subzones",
      filter:["in",["get","id"],["literal",[]]], paint:{"line-color":"#ffffff","line-width":3.2}});
    // the curves window's subzone, selected from its Subzone tag (hover / click)
    if(!map.getLayer("sz-pin")) map.addLayer({id:"sz-pin", type:"line", source:"subzones",
      filter:["==",["get","id"],pinId||"__none__"], paint:{"line-color":"#2dd4bf","line-width":4,"line-opacity":0.95}});
    if(!map.getLayer("jg-casing")) map.addLayer({id:"jg-casing", type:"line", source:"jurong",
      layout:{visibility:"none","line-join":"round","line-cap":"round"},
      paint:{"line-color":"#161616","line-width":7,"line-opacity":0.9}});
    if(!map.getLayer("jg-line")) map.addLayer({id:"jg-line", type:"line", source:"jurong",
      layout:{visibility:"none","line-join":"round","line-cap":"round"},
      paint:{"line-color":"#ffffff","line-width":3.2}});
    bindInteractions();
    // re-apply state
    recolor(valueFn);
    map.setFilter("sz-sel",["in",["get","id"],["literal",lastSelected]]);
    applyCompare();
    applyCat();
    applyJurong();
  }

  function init(container, subGeo, jurongGeo, cbs){
    geo=subGeo; jgeo=jurongGeo;
    cbHover=cbs.onHover; cbClick=cbs.onClick; cbLeave=cbs.onLeave; cbDbl=cbs.onDbl; cbCtrl=cbs.onCtrlClick; onReady=cbs.onReady;
    geo.features.forEach(f=>{ f.properties._color="#9aa3ad"; f.properties._val=null; f.properties._fill=0; });
    map=new maplibregl.Map({container, style:BASEMAPS.grey, bounds:SG_BOUNDS,
      fitBoundsOptions:{padding:30}, attributionControl:{compact:true}});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    map.addControl(new maplibregl.ScaleControl({maxWidth:110, unit:"metric"}), "bottom-right");   // both tabs (user 2026-10-19)
    map.doubleClickZoom.disable();   // double-click is reserved for "download"
    function firstSetup(){
      if(ready || !map.isStyleLoaded()) return;
      ready=true;
      addOverlays();
      map.resize();
      if(onReady) onReady();
    }
    map.on("load", firstSetup);
    map.on("idle", firstSetup);
    map.on("styledata", firstSetup);
  }

  /* switch the basemap, keeping the subzone overlays + camera + state */
  function setBasemap(key){
    const b=BASEMAPS[key]; if(!b||!map) return;
    const KEEP=["subzones","jurong","wn-grid","wn-coast","wn-sz","wn-st"],
          MINE=["sz-fill","sz-line","sz-cat","sz-hover","sz-sel","sz-cmp","sz-pin","jg-casing","jg-line",
                "wn-fill","wn-line","wn-sz-fill","wn-sz-line","wn-sz-hover","wn-coast-line","wn-hover","wn-st-dot"];
    // carry overlays (with current data/filters/visibility) into the new style,
    // appended ABOVE the basemap layers — so the choropleth never disappears
    map.setStyle(b, { diff:false, transformStyle:(prev,next)=>{
      const sources={...next.sources};
      if(prev) KEEP.forEach(s=>{ if(prev.sources[s]) sources[s]=prev.sources[s]; });
      const carried = prev ? prev.layers.filter(l=>MINE.includes(l.id)) : [];
      return { ...next, sources, layers:[...next.layers, ...carried] };
    }});
    bindInteractions();
  }

  /* fn(props) -> {val:Number|null, color:hexString} ; null => grey/hidden */
  function recolor(fn){
    valueFn=fn;
    geo.features.forEach(f=>{
      const p=f.properties;
      const empty=()=>{ p._val=null; p._color="#9aa3ad"; p._fill=0; };
      if(jurongOnly && !p.in_jurong){ empty(); return; }
      if(!fn){ empty(); return; }
      const r=fn(p);
      if(r && r.val!=null){ p._val=r.val; p._color=r.color; p._fill=0.82; }
      else empty();
    });
    const src=map && map.getSource("subzones"); if(src) src.setData(geo);
  }
  function getVal(id){ const f=geo.features.find(f=>f.properties.id===id); return f?f.properties._val:null; }

  /* outline every subzone of one category in its list-circle colour; cat "" = none (user 2026-10-10) */
  let lastCat="", lastCatColors=null;
  function applyCat(){
    if(!map || !map.getLayer("sz-cat")) return;
    map.setFilter("sz-cat", lastCat && !(hideNods && NODS_CAT.includes(lastCat)) ? ["==",["get","category"],lastCat] : ["==",["get","category"],"__none__"]);
    if(lastCatColors) map.setPaintProperty("sz-cat", "line-color",
      ["match", ["get","category"], ...Object.entries(lastCatColors).flat(), "#888888"]);
  }
  function setCategory(cat, colors){ lastCat=cat||""; if(colors) lastCatColors=colors; applyCat(); }
  let cmpList=[];                     // [[id, colour]] compared in the curves window
  function applyCompare(){ if(!map || !map.getLayer("sz-cmp")) return;
    map.setFilter("sz-cmp", ["in", ["get","id"], ["literal", cmpList.map(x=>x[0])]]);
    map.setPaintProperty("sz-cmp", "line-color", cmpList.length ? ["match", ["get","id"], ...cmpList.flat(), "#ffffff"] : "#ffffff"); }
  function setCompare(list){ cmpList=list || []; applyCompare(); }
  function setSelected(ids){
    lastSelected = ids||[];
    if(!map||!map.getLayer("sz-sel")) return;
    map.setFilter("sz-sel",["in",["get","id"],["literal",lastSelected]]);
  }

  function setJurongOnly(on){
    jurongOnly=on;
    if(!map) return;
    applyJurong();
    if(valueFn!==undefined) recolor(valueFn);
    fit(on);
  }
  function fit(jurong){
    map.fitBounds(jurong? bbox(jgeo): SG_BOUNDS, {padding: jurong?60:30, duration:700});
  }
  function flyTo(lon,lat){ map.flyTo({center:[lon,lat], zoom:Math.max(map.getZoom(),12.5), duration:700}); }
  let pinId=null;
  function setPin(id){ pinId=id||null; if(map && map.getLayer("sz-pin")) map.setFilter("sz-pin", ["==", ["get","id"], pinId || "__none__"]); }
  /* zoom to lon/lat bounds [[x0,y0],[x1,y1]] (double-click on the curves window's Subzone tag) */
  function zoomTo(b, maxZoom, padding){ if(!map || !b) return;
    map.fitBounds(b, {padding:padding||60, maxZoom:maxZoom||16, bearing:map.getBearing(), duration:900}); }
  function getMap(){ return map; }
  /* the subzone layers belong to the long-term tab; the forecast tab draws its own grid (js/forecast.js) */
  function setLongTermVisible(on){ ltOn=!!on; if(!map) return;
    ["sz-fill","sz-line","sz-cat","sz-hover","sz-sel","sz-cmp","sz-pin"].forEach(id=>map.getLayer(id) && map.setLayoutProperty(id, "visibility", ltOn ? "visible" : "none"));
    applyJurong(); }
  function resize(){ map&&map.resize(); }
  function isJurongOnly(){ return jurongOnly; }

  return {init, recolor, getVal, setSelected, setCompare, setCategory, setHideNods, setJurongOnly, setJurongOthers, setBasemap, fit, flyTo, setPin, zoomTo, getMap, setLongTermVisible, resize, isJurongOnly};
})();
