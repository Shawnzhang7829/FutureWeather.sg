/* Distance measuring (user 2026-10-19): top-bar button, the same on UBEM.sg and Future weather (identical file in
   web/js and web_mss/js). Click the map to add points; each point's label is the distance so far (great circle), a
   live label follows the mouse; double-click or Esc ends, Backspace takes the last point back, the × of the final
   label clears it, the button starts a new measurement. While measuring, the maps' own click / double-click / hover
   actions pause (Measure.busy()). Several camera-locked maps can take part (the Future weather swipe adds its
   observed map with addMap / removeMap). The line survives basemap swaps (re-added on styledata). */
const Measure = (()=>{
  const SRC="measure-src", LINE="measure-line", PTS="measure-pts", COLOR="#f97316", R=6371008.8, RAD=Math.PI/180;
  let maps=[], on=false, pts=[], live=null, btn=null, raf=0, endedAt=0;
  const marks=new Map(), liveMk=new Map();            // map -> [Marker] (fixed labels) / Marker (live label)
  const tt=(k, d)=>{ try{ const v=t(k); return v && v!==k ? v : d; }catch(e){ return d; } };

  function dist(a, b){ const dLa=(b[1]-a[1])*RAD, dLo=(b[0]-a[0])*RAD;
    const h=Math.sin(dLa/2)**2+Math.cos(a[1]*RAD)*Math.cos(b[1]*RAD)*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.min(1, Math.sqrt(h))); }
  const fmt=m=> m<1000 ? `${Math.round(m)} m` : `${(m/1000).toFixed(m<10000 ? 2 : 1)} km`;
  const total=()=>pts.reduce((s, p, i)=>i ? s+dist(pts[i-1], p) : 0, 0);
  function data(){ const c=pts.slice(); if(on && live && pts.length) c.push(live);
    return {type:"FeatureCollection", features:[
      ...(c.length>1 ? [{type:"Feature", properties:{}, geometry:{type:"LineString", coordinates:c}}] : []),
      ...pts.map(p=>({type:"Feature", properties:{}, geometry:{type:"Point", coordinates:p}}))]}; }

  let adding=false;
  function ensure(m){                                  // source + layers on top; false while the style is loading
    if(adding) return false; adding=true;
    try{
      if(!m.getSource(SRC)) m.addSource(SRC, {type:"geojson", data:data()});
      if(!m.getLayer(LINE)) m.addLayer({id:LINE, type:"line", source:SRC, filter:["==", ["geometry-type"], "LineString"],
        layout:{"line-cap":"round", "line-join":"round"}, paint:{"line-color":COLOR, "line-width":2.6, "line-dasharray":[2, 1.4]}});
      if(!m.getLayer(PTS)) m.addLayer({id:PTS, type:"circle", source:SRC, filter:["==", ["geometry-type"], "Point"],
        paint:{"circle-radius":4.5, "circle-color":"#ffffff", "circle-stroke-color":COLOR, "circle-stroke-width":2}});
      return true;
    }catch(e){ return false; } finally{ adding=false; }
  }
  function draw(){ maps.forEach(m=>{ if(ensure(m)){ try{ m.moveLayer(LINE); m.moveLayer(PTS); }catch(e){} m.getSource(SRC).setData(data()); } }); }
  function label(m, ll, html, cls){
    const el=document.createElement("div"); el.className="ms-label"+(cls ? " "+cls : ""); el.innerHTML=html;
    const x=el.querySelector(".ms-x"); if(x){ x.onclick=e=>{ e.stopPropagation(); clear(); }; x.onmousedown=e=>e.stopPropagation(); }
    return new maplibregl.Marker({element:el, anchor:"bottom", offset:[0, -9]}).setLngLat(ll).addTo(m);
  }
  function labels(){                                   // the fixed labels, rebuilt when the points change
    maps.forEach(m=>{ (marks.get(m)||[]).forEach(k=>k.remove()); const L=[]; let s=0;
      pts.forEach((p, i)=>{ if(i) s+=dist(pts[i-1], p);
        const fin=!on && i===pts.length-1 && pts.length>1;
        L.push(label(m, p, fin ? `<b>${tt("ms_total", "Total")} ${fmt(s)}</b><button class="ms-x" title="${tt("ms_clear", "Clear")}">×</button>`
                               : i ? fmt(s) : tt("ms_start", "Start"), fin ? "final" : "")); });
      marks.set(m, L); });
  }
  function liveLabel(){
    maps.forEach(m=>{ let k=liveMk.get(m);
      if(!(on && live && pts.length)){ if(k){ k.remove(); liveMk.delete(m); } return; }
      const txt=fmt(total()+dist(pts[pts.length-1], live));
      if(!k){ liveMk.set(m, label(m, live, txt, "live")); } else { k.setLngLat(live); k.getElement().textContent=txt; } });
  }
  function schedule(){ if(!raf) raf=requestAnimationFrame(()=>{ raf=0; draw(); liveLabel(); }); }

  function cursor(){ maps.forEach(m=>{ m.getCanvas().style.cursor=on ? "crosshair" : ""; }); }
  function start(){ clear(); on=true; if(btn) btn.classList.add("active"); cursor(); }
  function finish(){
    if(!on) return; on=false; endedAt=Date.now(); live=null; if(btn) btn.classList.remove("active"); cursor();
    if(pts.length<2){ clear(); return; } labels(); liveLabel(); draw();
  }
  function clear(){ pts=[]; live=null; marks.forEach(L=>L.forEach(k=>k.remove())); marks.clear(); liveMk.forEach(k=>k.remove()); liveMk.clear(); draw(); }

  const H={
    click:e=>{ if(!on) return; pts.push([e.lngLat.lng, e.lngLat.lat]); labels(); schedule(); },
    move:e=>{ if(!on) return; e.target.getCanvas().style.cursor="crosshair"; if(!pts.length) return; live=[e.lngLat.lng, e.lngLat.lat]; schedule(); },
    dbl:e=>{ if(!on) return; e.preventDefault();
      // the two clicks of the double-click each added a point: keep one
      const m=e.target; if(pts.length>=2){ const a=m.project(pts[pts.length-1]), b=m.project(pts[pts.length-2]); if(Math.hypot(a.x-b.x, a.y-b.y)<6) pts.pop(); }
      // end after this event: the site's own double-click handlers (registered later or earlier) must still see busy()
      setTimeout(finish, 0); },
    style:e=>{ if(pts.length) { const m=e.target; if(!m.getSource(SRC)){ if(ensure(m)) m.getSource(SRC).setData(data()); } } },
  };
  function addMap(m){ if(!m || maps.includes(m)) return; maps.push(m);
    m.on("click", H.click); m.on("mousemove", H.move); m.on("dblclick", H.dbl); m.on("styledata", H.style);
    if(pts.length){ draw(); labels(); liveLabel(); } cursor(); }
  function removeMap(m){ const i=maps.indexOf(m); if(i<0) return; maps.splice(i, 1);
    m.off("click", H.click); m.off("mousemove", H.move); m.off("dblclick", H.dbl); m.off("styledata", H.style);
    (marks.get(m)||[]).forEach(k=>k.remove()); marks.delete(m); const k=liveMk.get(m); if(k){ k.remove(); liveMk.delete(m); } }
  function init(map, button){
    addMap(map); btn=button;
    if(btn) btn.onclick=()=>{ if(on) finish(); else start(); };
    document.addEventListener("keydown", e=>{
      if(!on || /input|select|textarea/i.test(e.target.tagName)) return;
      if(e.key==="Escape"){ e.stopPropagation(); finish(); }
      else if(e.key==="Backspace"){ e.preventDefault(); if(pts.length){ pts.pop(); labels(); schedule(); } }
    }, true);
  }
  // busy a little past the end too: a subzone click acts after a 250 ms double-click wait
  return {init, addMap, removeMap, busy:()=>on || Date.now()-endedAt<350, refreshText:()=>{ if(pts.length) labels(); }};
})();
