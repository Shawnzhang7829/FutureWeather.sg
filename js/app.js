/* Main app: load data, wire controls, drive map / charts / modals. */
const CAT_COLORS = {utc:"#3b82f6", crown_shrunk:"#22c55e", tree_shortened:"#e64a19",
  tree_taller:"#eab308", no_building:"#9ca3af", crown_overshrunk:"#a855f7"};
const RANGES=[[1995,2014],[2040,2059],[2080,2099]];

const App = (()=>{
  let manifest, monthly, hot, hotNights, geojson, jurong, features=[];
  let allKeys=[];
  // state
  let mode="temp_wind", element="temp", month=6, scen="mid_2040_2059_ssp245", year=2050;
  let showFill=true;                 // green header switch: subzone coloring on/off (off = basemap only)
  let activeId=null;
  const selected=new Set();
  // dom shortcuts
  const $=id=>document.getElementById(id);

  function scMeta(k){ return manifest.scenarios.find(s=>s.key===k); }
  function mapScen(){ return scen==="all" ? "hist_1995_2014" : scen; }
  function ssp(k){ return t("ssp_label")[scMeta(k).ssp]; }
  function periodShort(k){ const p=scMeta(k).period; return p==="1995-2014"?"Hist":(p==="2040-2059"?"Mid":"End"); }
  function scShort(k){ const m=scMeta(k); return m.ssp==="historical"?ssp(k):`${periodShort(k)} ${ssp(k)}`; }
  function scLabel(k){ const m=scMeta(k); return `${ssp(k)} · ${m.period}`; }
  function snapYear(y){ for(const[a,b]of RANGES) if(y>=a&&y<=b) return y;
    let best=y,bd=1e9; for(const[a,b]of RANGES) for(const e of[a,b]){ if(Math.abs(e-y)<bd){bd=Math.abs(e-y);best=e;} } return best; }
  function clampScen(y,k){ const m=scMeta(k); return Math.min(m.y1,Math.max(m.y0,y)); }

  async function init(){
    [manifest, monthly, hot, hotNights, geojson, jurong] = await Promise.all([
      fetch("data/manifest.json").then(r=>r.json()),
      fetch("data/map_monthly.json").then(r=>r.json()),
      fetch("data/hot_hours.json").then(r=>r.json()),
      fetch("data/hot_nights.json").then(r=>r.json()),
      fetch("data/subzones.geojson").then(r=>r.json()),
      fetch("data/jurong_gateway.geojson").then(r=>r.json()),
    ]);
    features = geojson.features.slice().sort((a,b)=>a.properties.id<b.properties.id?-1:1);
    allKeys = manifest.scenarios.map(s=>s.key);
    EPW.setCols(manifest.epw_cols);
    Downloader.init(manifest.paths.epw, s=>{ if(s) $("dl-hint").textContent=s; else updateHints(); });   // status cleared: the selection count again
    SubzoneModal.init(manifest, (id,sc)=>{ scen=sc; $("scenario-select").value=sc; onScenarioChanged(false); setActive(id); });

    buildScenarioSelect(); buildBasemapSelect();
    Charts.init($("chart-diurnal"), $("chart-annual"), $("chart-heatwave"), $("chart-warmnight"));
    Compare.init(manifest, monthly, hot, geojson, hotNights);
    MapView.init("map", geojson, jurong, {
      onHover:(p,pt)=>showTip(p,pt), onLeave:()=>$("map-tooltip").classList.add("hidden"),
      onClick:(p)=>{ setActive(p.id); MapView.flyTo(p.lon,p.lat); },              // single-click: select just this subzone (curves window)
      onDbl:(p)=>{ setActive(p.id); SubzoneModal.open(p,"download"); },           // double-click: open download window
      onCtrlClick:(p)=>ctrlPick(p.id),                                             // Ctrl / Cmd + click: (de)select + compare (one scenario)
      onReady:()=>{ $("map-loading").classList.add("hidden"); refresh();
        let m="lt"; try{ m=localStorage.getItem("mss.appMode")||"lt"; }catch(e){}
        if(m==="st") setAppMode("st"); },
    });
    Measure.init(MapView.getMap(), $("btn-measure"));
    // MSS V3 before downscaling (js/mssraw.js): one colouring at a time with "MSS V3 downscaled data"
    MssRaw.init(MapView.getMap(), {onChange:on=>{ if(on && showFill){ showFill=false; $("fill-toggle").checked=false; } if(on) catFill=false; refresh(); }});
    wire();
    initHoverTips();
    makeChartsFloatDraggable();
    setLang("en");
    syncYearToScen(); buildList();
  }

  /* ---- data tabs (user 2026-10-18): long-term projection / short-term forecast ---- */
  let appMode="lt";
  function setAppMode(m){
    appMode = m==="st" ? "st" : "lt";
    document.body.classList.toggle("am-st", appMode==="st");
    $("app-mode").querySelectorAll("button").forEach(b=>b.classList.toggle("active", b.dataset.am===appMode));
    MapView.setLongTermVisible(appMode==="lt"); MssRaw.setVisible(appMode==="lt"); $("map-tooltip").classList.add("hidden");
    if(appMode==="st"){ $("charts-float").classList.add("hidden"); Forecast.activate(MapView.getMap(), geojson); }
    else { Forecast.deactivate(); MapView.fit(MapView.isJurongOnly()); }
    try{ localStorage.setItem("mss.appMode", appMode); }catch(e){}
  }

  /* ---- builders ---- */
  function buildScenarioSelect(){
    const sel=$("scenario-select"); sel.innerHTML="";
    manifest.scenarios.forEach(s=>{ const o=document.createElement("option");
      o.value=s.key; o.textContent=scLabel(s.key); sel.appendChild(o); });
    const all=document.createElement("option"); all.value="all"; all.dataset.all="1"; sel.appendChild(all);
    sel.value=scen;
  }
  function buildBasemapSelect(){
    const sel=$("basemap-select"); if(!sel) return; sel.innerHTML="";
    const opts=[["grey","bm_grey"],["satellite","bm_sat"],["openfreemap",""],["onemap",""]];
    opts.forEach(([val,key])=>{ const o=document.createElement("option"); o.value=val; o.dataset.bm=key;
      o.textContent = key ? t(key) : (val==="openfreemap"?"OpenFreeMap":"OneMap"); sel.appendChild(o); });
    sel.value="grey";
  }

  /* list circles = subzone category: 1.5 s hover help, grouped downscaled / not downscaled (user 2026-10-10) */
  const CAT_DS=["utc","crown_shrunk","tree_shortened"], CAT_NODS=["tree_taller","no_building","crown_overshrunk"];

  /* "Colour subzones by category" (user 2026-10-26): the subzone fill takes each subzone's list-circle colour,
     the legend lists the categories with their counts; a second click restores the map's own colours */
  let catFill=false;
  const catFn = p=>({val:p.category, color:CAT_COLORS[p.category]||"#888888"});
  function catLegendHTML(){
    const n={}; features.forEach(f=>{ const c=f.properties.category; n[c]=(n[c]||0)+1; });
    const L=t("cat_label")||{}, sum=a=>a.reduce((s,c)=>s+(n[c]||0),0);
    const grp=(head, cats)=>`<div class="lg-cat-g">${head}</div>`+cats.map(c=>
      `<div class="lg-cat"><i style="background:${CAT_COLORS[c]}"></i>${L[c]||c}<span>${n[c]||0}</span></div>`).join("");
    return `<div class="lg-title">${t("cat_fill_title")}</div>`+grp(t("cat_grp_ds")(sum(CAT_DS)), CAT_DS)+
      (showNods ? grp(t("cat_grp_nods")(sum(CAT_NODS)), CAT_NODS) : "");
  }
  function syncCatBtn(){ const b=$("btn-cat-fill"); if(!b) return;
    b.textContent=t(catFill ? "cat_fill_off" : "cat_fill_on"); b.dataset.tip=t("cat_fill_tip"); b.classList.toggle("active", catFill); }
  const catTipRow = p=>`<div class="tt-val">${t("cat_fill_lab")}: <b>${(t("cat_label")||{})[p.category]||p.category}</b></div>`;
  function catTips(){
    const n={}; features.forEach(f=>{ const c=f.properties.category; n[c]=(n[c]||0)+1; });
    const L=t("cat_label"), sum=a=>a.reduce((s,c)=>s+(n[c]||0),0);
    const grp=(head, cats)=>`<div class="ct-g"><b>${head}</b>`+cats.map(c=>
      `<div class="ct-r"><i style="background:${CAT_COLORS[c]}"></i>${L[c]||c}<span>${n[c]||0}</span></div>`).join("")+`</div>`;
    const html=`<div class="ct-h">${t("cat_tip_head")}</div>`+grp(t("cat_grp_ds")(sum(CAT_DS)), CAT_DS)+grp(t("cat_grp_nods")(sum(CAT_NODS)), CAT_NODS);
    document.querySelectorAll('[data-i18n="subzone_title"]').forEach(el=>{ el.dataset.tipHtml=html; });
  }
  const dotTip = c=>`${(t("cat_label")||{})[c]||c}: ${CAT_NODS.includes(c) ? t("cat_nods") : t("cat_ds")}`.replace(/"/g,"&quot;");
  /* category tabs under the panel title (user 2026-10-10): filter the list by one of the 6 categories (synced with
     the category dropdown); "select" adds every subzone of the list to the selection */
  let lastShown=[], catFilter="", showNods=true;      // "" = all categories; showNods: the switch next to "Without downscaled"
  function setShowNods(on){ showNods=!!on; MapView.setHideNods(!showNods);
    if(!showNods){ features.forEach(f=>{ if(CAT_NODS.includes(f.properties.category)) selected.delete(f.properties.id); });
      MapView.setSelected([...selected]); if(CAT_NODS.includes(catFilter)) catFilter=""; }
    buildList(); if(typeof colorBuildings==="function") colorBuildings(); updateHints(); refreshCharts(); if(catFill) updateLegend(); }
  function buildCatTabs(){
    const box=$("sz-cat-tabs"); if(!box) return;
    const n={}; features.forEach(f=>{ const c=f.properties.category; n[c]=(n[c]||0)+1; });
    const L=t("cat_label")||{}, cur=catFilter;
    const tab=(c,label,cnt)=>`<button class="sz-tab${cur===c?" active":""}" data-c="${c}"${c?` data-tip="${dotTip(c)}"`:""}>`+
      `${c?`<i style="background:${CAT_COLORS[c]}"></i>`:""}${label}<span>${cnt}</span></button>`;
    box.dataset.tip=t("cat_tab_hint");
    box.innerHTML=`<div class="sz-tab-row">${tab("", t("cat_all"), features.length)}</div>`+
      `<div class="sz-tab-g">${t("cat_tab_ds")}</div><div class="sz-tab-row">${CAT_DS.map(c=>tab(c, L[c]||c, n[c]||0)).join("")}</div>`+
      `<div class="sz-tab-g sz-tab-gn"><span>${t("cat_tab_nods")}</span><label class="fill-switch sz-nods-sw" data-tip="${t("nods_sw_tip")}">`+
        `<span class="fs-label">${t(showNods ? "nods_sw_on" : "nods_sw_off")}</span><input type="checkbox" id="nods-toggle"${showNods?" checked":""} />`+
        `<span class="fs-track"><span class="fs-knob"></span></span></label></div>`+
      `<div class="sz-tab-row${showNods?"":" off"}">${CAT_NODS.map(c=>tab(c, L[c]||c, n[c]||0)).join("")}</div>`;
    const nt=box.querySelector("#nods-toggle"); if(nt) nt.onchange=e=>setShowNods(e.target.checked);
    box.querySelectorAll(".sz-tab").forEach(b=>b.onclick=()=>{ catFilter=b.dataset.c; buildList(); });
    const sb=$("btn-sel-cat"); if(sb){ sb.textContent=t("sel_cat")(lastShown.length); sb.dataset.tip=t("sel_cat_tip"); sb.disabled=!lastShown.length; }
    const jb=$("btn-sel-jurong"), jg=jurongIds();       // greyed out once all of them are selected
    if(jb){ jb.textContent=t("sel_jurong")(jg.length); jb.dataset.tip=t("sel_jurong_tip"); jb.disabled=!jg.length || jg.every(id=>selected.has(id)); }
  }
  /* the subzones of Jurong Gateway (>=5% of the area inside, prepare_data.py), minus the non-downscaled ones when switched off */
  const jurongIds=()=>features.filter(f=>f.properties.in_jurong && (showNods || !CAT_NODS.includes(f.properties.category))).map(f=>f.properties.id);
  /* search (user 2026-10-19): several subzones at once, separated by commas (, ， 、 ; ； or new lines); a term equal
     to a subzone's name picks just that subzone, any other term matches the id / name as a substring */
  const normQ=s=>String(s||"").toLowerCase().replace(/[_\s]+/g," ").trim();
  function searchMatcher(){
    const terms=($("subzone-search").value||"").split(/[,，、;；\n]+/).map(normQ).filter(Boolean);
    const hay=p=>normQ(`${p.id} ${p.name||""} ${p.name_disp}`);
    const rules=terms.map(q=>{ const ex=features.filter(f=>normQ(f.properties.name)===q || normQ(f.properties.name_disp)===q).map(f=>f.properties.id);
      return ex.length ? {q, ids:new Set(ex)} : {q}; });
    const hit=p=>r=>r.ids ? r.ids.has(p.id) : hay(p).includes(r.q);
    const miss=rules.filter(r=>!features.some(f=>hit(f.properties)(r))).map(r=>r.q.toUpperCase());
    return {terms, miss, test:p=>!rules.length || rules.some(hit(p))};
  }
  function buildList(){
    const M=searchMatcher(), cat=catFilter;
    const ul=$("subzone-list"); ul.innerHTML="";
    let shown=0; lastShown=[];
    features.forEach(f=>{ const p=f.properties;
      if(cat && p.category!==cat) return;
      if(!showNods && CAT_NODS.includes(p.category)) return;           // non-downscaled subzones switched off
      if(!M.test(p)) return;
      shown++; lastShown.push(p.id);
      const row=document.createElement("div"); row.className="sz-item"+(selected.has(p.id)?" sel":"")+(activeId===p.id?" sel":"");
      row.innerHTML=`<span class="dot" data-tip="${dotTip(p.category)}" style="background:${CAT_COLORS[p.category]||'#888'}"></span>`+
        `<span class="nm">${p.name_disp}</span><span class="id">${p.id.split("_")[0]}</span>`;
      row.onclick=(e)=>{ const add=!selected.has(p.id); $("charts-float").classList.remove("hidden"); toggleSel(p.id);   // any number (user 2026-10-24)
        if(add && !(e.ctrlKey || e.metaKey)) MapView.flyTo(p.lon,p.lat); };
      row.ondblclick=()=>SubzoneModal.open(p,"download");
      ul.appendChild(row);
    });
    if(!shown){ ul.innerHTML=`<div class="hint" style="padding:10px">—</div>`; }
    const sh=$("subzone-search-hint");      // several terms: how many subzones they found, which terms found none
    if(sh) sh.textContent=(M.terms.length>1 ? t("search_multi")(shown, M.terms.length) : "") +
      (M.miss.length ? (M.terms.length>1 ? " · " : "") + t("search_miss")(M.miss.join(", ")) : "");
    catTips(); buildCatTabs();
    MapView.setCategory(cat, CAT_COLORS);              // outline the filtered category on the map in its circle colour
  }

  /* ---- map coloring ---- */
  function valueFn(){
    if(!showFill) return null;        // coloring switched off => map shows basemap + boundaries only
    if(mode==="temp_wind"){
      const cm = element==="temp"?manifest.colormaps.temp:manifest.colormaps.wind;
      const fld= element==="temp"?"t":"w"; const sc=mapScen();
      const data=(monthly.data[sc]||{})[String(year)]||{};   // no clamp: out-of-data year => empty
      return p=>{ const r=data[p.id]; if(!r) return {val:null}; const v=r[fld][month-1];
        return {val:v, color:valueColor(cm.cmap,v,cm.vmin,cm.vmax)}; };
    }
    // hot_hours / warm_nights: one count per subzone per year (MSS CSV_yearly, pre-downscaling)
    const warmMode = mode==="warm_nights";
    const cm=warmMode?manifest.colormaps.warm:manifest.colormaps.hot, sc=mapScen(), m=scMeta(sc);
    if(year<m.y0 || year>m.y1) return ()=>({val:null});       // no data this year => empty
    const yi=year-m.y0, data=(warmMode?hotNights:hot).data[sc]||{};
    return p=>{ const arr=data[p.id]; if(!arr) return {val:null}; const v=arr[yi];
      return {val:v, color:valueColor(cm.cmap,v,cm.vmin,cm.vmax)}; };
  }
  function refresh(){
    if(catFill){ MssRaw.render(null); MapView.recolor(catFn); }
    else if(MssRaw.isOn()){ const sk=mapScen(); MapView.recolor(MssRaw.unit()==="zone" ? MssRaw.zoneFn(sk, month) : null); MssRaw.render(sk, year, month); }
    else { MssRaw.render(null); MapView.recolor(valueFn()); }
    updateLegend(); updateHints(); syncModeCtrl(); }
  /* the month slider: mode 1 of the downscaled data, or a monthly variable of the MSS V3 panel */
  function syncModeCtrl(){ const raw=MssRaw.isOn();
    document.querySelectorAll(".mode-ctrl").forEach(el=>{ const show = raw ? (el.classList.contains("month-block") && MssRaw.isMonthly()) : el.dataset.for===mode;
      el.style.display=show ? "" : "none"; }); }

  function hasYearData(){
    const sc=mapScen();
    if(mode==="temp_wind") return !!((monthly.data[sc]||{})[String(year)]);
    if(mode==="hot_hours" || mode==="warm_nights"){ const m=scMeta(sc); return year>=m.y0 && year<=m.y1; }
    return true;
  }
  function updateLegend(){
    const L=$("legend"); syncCatBtn();
    if(catFill){ L.classList.remove("hidden"); L.innerHTML=catLegendHTML(); return; }
    if(MssRaw.isOn()){ L.classList.remove("hidden"); L.innerHTML=MssRaw.legendHTML(mapScen(), year, month); return; }
    if(!showFill){ L.classList.add("hidden"); return; } L.classList.remove("hidden");
    let cm,title;
    if(mode==="temp_wind"){ cm=element==="temp"?manifest.colormaps.temp:manifest.colormaps.wind;
      title=`${element==="temp"?t("legend_temp"):t("legend_wind")} · ${year} · ${t("months")[month-1]}`; }
    else if(mode==="warm_nights"){ cm=manifest.colormaps.warm; title=`${t("legend_warm")} · ${year}`; }
    else { cm=manifest.colormaps.hot; title=`${t("legend_hot")} · ${year}`; }
    if(!hasYearData()) title+=` · ${t("no_data")}`;
    L.innerHTML=`<div class="lg-title">${title}</div>`+
      `<div class="lg-bar" style="background:${cmapGradient(cm.cmap)}"></div>`+
      `<div class="lg-scale"><span>${cm.vmin}</span><span>${cm.unit}</span><span>${cm.vmax}</span></div>`;
  }
  function updateHints(){
    $("scenario-hint").textContent = (scen==="all" && showFill) ? t("map_single_hint") : "";
    const n=selected.size; $("dl-hint").textContent = n? t("selected_n")(n) : "";
  }

  /* delayed hover help (user 2026-10-10): any [data-tip] element shows its text after 1.5 s of hovering
     ("Label: text" -> the label in bold); [data-tip-html] holds markup built by this code */
  function initHoverTips(){
    const tip=document.createElement("div"); tip.className="hover-tip hidden"; document.body.appendChild(tip);
    let timer=null, cur=null;
    const hide=()=>{ clearTimeout(timer); timer=null; cur=null; tip.classList.add("hidden"); };
    const esc=s=>s.replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
    document.addEventListener("mouseover", e=>{
      const el=e.target.closest ? e.target.closest("[data-tip],[data-tip-html]") : null;
      if(el===cur) return;
      hide(); if(!el) return; cur=el;
      timer=setTimeout(()=>{
        if(!cur || !cur.isConnected) return;
        if(cur.dataset.tipHtml) tip.innerHTML=cur.dataset.tipHtml;
        else { const s=cur.dataset.tip, i=s.indexOf(": ");
          tip.innerHTML = i>0 && i<40 ? `<b>${esc(s.slice(0,i))}</b>: ${esc(s.slice(i+2))}` : esc(s); }
        tip.classList.remove("hidden");
        const r=cur.getBoundingClientRect(), w=tip.offsetWidth, h=tip.offsetHeight;
        let y=r.bottom+6; if(y+h>innerHeight-8) y=Math.max(8, r.top-h-6);
        tip.style.left=Math.min(Math.max(8, r.left), innerWidth-w-8)+"px"; tip.style.top=y+"px";
      }, 1500);
    });
    document.addEventListener("mousedown", hide); document.addEventListener("scroll", hide, true);
  }
  function showTip(p,pt){
    const el=$("map-tooltip"); let body;
    if(catFill){ body=catTipRow(p)+`<div class="tt-hint">${t("click_download")}</div>`; }
    else if(MssRaw.isOn()){ if(MssRaw.unit()==="grid") return;                 // the grid cells answer the hover themselves
      body=MssRaw.zoneTip(p, mapScen(), month)+`<div class="tt-hint">${t("click_download")}</div>`; }
    else if(!showFill){ body=`<div class="tt-hint">${t("click_download")}</div>`; }
    else { const v=MapView.getVal(p.id); let unit,label;
      if(mode==="temp_wind"){ const cm=element==="temp"?manifest.colormaps.temp:manifest.colormaps.wind;
        unit=cm.unit; label=element==="temp"?t("legend_temp"):t("legend_wind"); }
      else if(mode==="warm_nights"){ unit=manifest.colormaps.warm.unit; label=t("legend_warm"); }
      else { unit=manifest.colormaps.hot.unit; label=t("legend_hot"); }
      const vt = v==null?"—":(mode!=="temp_wind"? v : (+v).toFixed(element==="wind"?2:1));
      body=`<div class="tt-val">${label}: ${vt}${v==null?"":" "+unit}</div><div class="tt-hint">${t("click_download")}</div>`;
    }
    const nods = CAT_NODS.includes(p.category) ? `<div class="tt-row tt-nods">${t("nods_tip")}</div>` : "";
    el.innerHTML=`<div class="tt-name">${p.name_disp} <span style="color:var(--muted)">${p.id.split("_")[0]}</span></div>${nods}${body}`;
    const wrap=$("map-wrap").getBoundingClientRect();
    let x=pt.x+14, y=pt.y+14; if(x>wrap.width-240)x=pt.x-226; if(y>wrap.height-90)y=pt.y-80;
    el.style.left=x+"px"; el.style.top=y+"px"; el.classList.remove("hidden");
  }

  /* ---- selection & charts ---- */
  /* the curves window shows the selection (user 2026-10-24): a plain click selects just that subzone, Ctrl / Cmd + click
     adds / removes one (ctrlPick); every change of the selection redraws the window */
  function selChanged(){ MapView.setSelected([...selected]); buildList(); updateHints(); refreshCharts(); }
  function toggleSel(id){ if(selected.has(id))selected.delete(id); else selected.add(id); selChanged(); }
  function setActive(id){ selected.clear(); if(id){ selected.add(id); $("charts-float").classList.remove("hidden"); } selChanged(); }

  /* ---- several subzones in the curves window (user 2026-10-24): with ONE scenario, Ctrl / Cmd + click on the map or the
     list compares the selected subzones - at most the CMP_MAX most recently selected; a plain click or Clear ends it ---- */
  // 6 colours clear of the 35°C (red) and 26.3°C (fuchsia) threshold lines
  // ... and of the orange selection outline on the map
  const CMP_MAX=6, CMP_COLORS=["#38bdf8","#f472b6","#a3e635","#a78bfa","#facc15","#e2e8f0"];
  let chartTok=0, dropped=null;
  function ctrlPick(id){
    // a 7th pick pushes the earliest selected subzone out of the selection (and off the map; user 2026-10-24)
    dropped=null;
    if(!selected.has(id) && selected.size>=CMP_MAX){ dropped=selected.values().next().value; selected.delete(dropped); }
    $("charts-float").classList.remove("hidden");
    toggleSel(id);
  }
  /* the curves window = the selection: 2-6 compared (outlined on the map in their curve colours), else one subzone - the
     most recently selected (more than CMP_MAX selected, or "All scenarios": its 7 scenarios) */
  function refreshCharts(){
    const ids=[...selected], open=!$("charts-float").classList.contains("hidden");
    // 2-6 selected: compared; more than CMP_MAX: no comparison (orange outlines only), the most recently selected is shown
    const cmp = scen!=="all" && ids.length>=2 && ids.length<=CMP_MAX ? ids : [];
    MapView.setCompare(open ? cmp.map((id, k)=>[id, CMP_COLORS[k]]) : []);
    if(!open) return;
    if(!ids.length){ activeId=null; ++chartTok; emptyCharts(); return; }
    if(cmp.length) return loadCompare(cmp);
    activeId=ids[ids.length-1]; return loadCharts(activeId);
  }
  function emptyCharts(){ unpin(); Charts.clear(); $("charts-sub").textContent=t("charts_hint");
    ["chart-annual","chart-heatwave","chart-warmnight"].forEach(id=>$(id).classList.add("hidden")); }
  function compareHeader(data){
    const el=$("charts-sub"); unpin();
    const C=t("mz_cols"), H=t("mz_cols_tip");
    const dz=dropped && features.find(f=>f.properties.id===dropped), drop=dz ? `<div class="cs-note mz-drop">${t("mz_dropped")(dz.properties.name_disp, CMP_MAX)}</div>` : "";
    dropped=null;
    el.innerHTML=`<div class="mz-head"><span class="cl-kind zone">${t("mz_kind")}</span><span class="mz-scen">${scLabel(scen)}</span></div>`+
      `<table class="mz-tab"><thead><tr><th></th>${C.map((c, i)=>`<th data-tip="${H[i]||""}">${c}</th>`).join("")}</tr></thead><tbody>`+
      data.map(d=>`<tr data-id="${d.id}"><td><i style="background:${d.color}"></i></td><td class="mz-nm">${d.name} <span class="cs-id">${d.id.split("_")[0]}</span>`+
        `${d.nods ? ` <span class="cl-nods-tag">${t("nods_badge")}</span>` : ""}</td><td>${d.hot}</td><td>${d.hotNight}</td><td>${d.hw}</td><td>${d.wn}</td></tr>`).join("")+
      `</tbody></table>${drop}<div class="cs-note">${t("mz_how")}</div>`;
    el.querySelectorAll("tr[data-id]").forEach(r=>{ r.onmouseenter=()=>MapView.setPin(r.dataset.id); r.onmouseleave=()=>MapView.setPin(null);
      r.ondblclick=()=>zoomToZone(r.dataset.id); });
  }
  async function loadCompare(ids){
    const my=++chartTok;
    let data;
    try{
      data=await Promise.all(ids.map(async (id, k)=>{
        const e=await EPW.load(Downloader.url(id, scen)), p=features.find(f=>f.properties.id===id)?.properties || {name_disp:id};
        const dmax=EPW.dailyMax(e.T), dmean=EPW.dailyMean(e.T), dmin=EPW.dailyMin(e.T), hw=Charts.hwFlags(dmax, dmean);
        return {id, name:p.name_disp, nods:CAT_NODS.includes(p.category), color:CMP_COLORS[k], e, T:e.T, dmax, dmean, dmin, hwFlags:hw,
          hot:EPW.countAbove(e.T, 35), hotNight:EPW.countNightAbove(e.T, e.hour, EPW.WARM_T),
          hw:hw.filter(Boolean).length, wn:dmin.filter(v=>v!=null && v>EPW.WARM_T).length};
      }));
    }catch(err){ console.warn(err); return; }
    if(my!==chartTok) return;                // a newer request is on its way
    compareHeader(data);
    Charts.renderDiurnal(data.map(d=>({key:d.id, name:d.name, color:d.color,
      T:EPW.diurnal(d.e.T, d.e.hour), RH:EPW.diurnal(d.e.RH, d.e.hour), W:EPW.diurnal(d.e.W, d.e.hour), GHI:EPW.diurnal(d.e.GHI, d.e.hour)})));
    ["chart-annual","chart-heatwave","chart-warmnight"].forEach(id=>$(id).classList.remove("hidden"));
    Charts.renderAnnualMulti(data, scShort(scen)); Charts.renderHeatwaveMulti(data, scShort(scen)); Charts.renderWarmNightsMulti(data, scShort(scen));
  }

  /* window header: subzone name in bold + code; non-downscaled subzones get the magenta tag (as UBEM.sg) */
  /* Subzone tag (user 2026-10-11, as UBEM.sg): hover = highlight on the map, click = pin on / off, double-click =
     zoom the map to the subzone (+ pin); the pin is dropped when another subzone is shown or the window closes */
  let pinnedId=null, tagT=null;
  function zoomToZone(id){
    const f=features.find(f=>f.properties.id===id); if(!f) return;
    let x0=180, y0=90, x1=-180, y1=-90;
    const scan=c=>{ if(typeof c[0]==="number"){ x0=Math.min(x0,c[0]); x1=Math.max(x1,c[0]); y0=Math.min(y0,c[1]); y1=Math.max(y1,c[1]); } else c.forEach(scan); };
    scan(f.geometry.coordinates);
    const m=$("map").getBoundingClientRect(), w=$("charts-float"), r=w && !w.classList.contains("hidden") ? w.getBoundingClientRect() : null;
    const right=r && r.left<m.right ? Math.max(60, Math.min(m.right-r.left+30, m.width*0.6)) : 60;
    MapView.zoomTo([[x0,y0],[x1,y1]], 15.5, {top:60, bottom:60, left:60, right});
  }
  function unpin(){ pinnedId=null; MapView.setPin(null); }
  function chartsHeader(id){
    const p=features.find(f=>f.properties.id===id)?.properties; const el=$("charts-sub");
    if(pinnedId && pinnedId!==id) unpin();
    if(!p){ el.textContent=""; return; }
    el.innerHTML=`<span class="cl-kind zone${pinnedId===id?" pinned":""}" data-tip="${t("cl_kind_tip_z")}">${t("cl_kind_zone")}</span>`+
      `<b class="cs-name">${p.name_disp}</b> <span class="cs-id">${p.id.split("_")[0]}</span>`+
      (CAT_NODS.includes(p.category) ? `<span class="cl-nods-tag">${t("nods_badge")}</span>` : "")+
      (scen==="all" && selected.size>=2 ? `<div class="cs-note">${t("mz_need_single")}</div>` : "")+
      (scen!=="all" && selected.size>CMP_MAX ? `<div class="cs-note">${t("mz_over")(selected.size, CMP_MAX)}</div>` : "");
    const kb=el.querySelector(".cl-kind");
    kb.onmouseenter=()=>MapView.setPin(id);
    kb.onmouseleave=()=>{ if(pinnedId!==id) MapView.setPin(pinnedId); };
    kb.onclick=()=>{ clearTimeout(tagT); tagT=setTimeout(()=>{
      if(pinnedId===id){ pinnedId=null; kb.classList.remove("pinned"); MapView.setPin(kb.matches(":hover") ? id : null); }
      else { pinnedId=id; kb.classList.add("pinned"); MapView.setPin(id); } }, 260); };
    kb.ondblclick=e=>{ e.preventDefault(); clearTimeout(tagT); pinnedId=id; kb.classList.add("pinned"); MapView.setPin(id); zoomToZone(id); };
  }
  async function loadCharts(id){
    if(!id){ Charts.clear(); return; }
    const my=++chartTok;
    chartsHeader(id);
    const scs = scen==="all" ? allKeys : [scen];
    try{
      const series = await Promise.all(scs.map(async sc=>{
        const e=await EPW.load(Downloader.url(id,sc));
        return {key:sc, name:scShort(sc), color:SCEN_COLORS[sc],
          T:EPW.diurnal(e.T,e.hour), RH:EPW.diurnal(e.RH,e.hour),
          W:EPW.diurnal(e.W,e.hour), GHI:EPW.diurnal(e.GHI,e.hour)};
      }));
      if(my!==chartTok) return;
      Charts.renderDiurnal(series);
    }catch(err){ console.warn(err); }
    // annual (single scenario)
    const annEl=$("chart-annual"), hwEl=$("chart-heatwave"), wnEl=$("chart-warmnight");
    if(scen!=="all"){
      try{
        const e=await EPW.load(Downloader.url(id,scen)); if(my!==chartTok) return;
        const hc=EPW.countAbove(e.T,35);   // hours>35 in this hourly downscaled EPW (matches the curve)
        const hnc=EPW.countNightAbove(e.T,e.hour,EPW.WARM_T);   // 19:00–07:00 hours >26.3°C, same curve
        annEl.classList.remove("hidden");
        Charts.renderAnnual({hourly:e.T, color:SCEN_COLORS[scen], scenarioName:scShort(scen), hotCount:hc, hotNightCount:hnc});
        hwEl.classList.remove("hidden");
        Charts.renderHeatwave({dmax:EPW.dailyMax(e.T), dmean:EPW.dailyMean(e.T), scenarioName:scShort(scen)});
        wnEl.classList.remove("hidden");
        Charts.renderWarmNights({dmin:EPW.dailyMin(e.T), scenarioName:scShort(scen)});
      }catch(err){ console.warn(err); }
    } else { annEl.classList.add("hidden"); hwEl.classList.add("hidden"); wnEl.classList.add("hidden"); }
  }

  /* ---- control handlers ---- */
  function onScenarioChanged(reYear){
    if(reYear!==false) syncYearToScen();
    refresh(); refreshCharts();
  }
  function syncYearToScen(){
    if(scen==="all") return;
    year=clampScen(year,scen); $("year-slider").value=year; $("year-val").textContent=year;
  }

  function openLightbox(src){ const lb=$("lightbox"), im=$("lightbox-img");
    im.src=src; im.classList.remove("zoomed"); lb.classList.remove("zoom"); lb.classList.remove("hidden"); }
  window.openLightbox=openLightbox;

  function toggleChartsCollapse(){
    const win=$("charts-float");
    if(win.classList.contains("collapsed")){          // expand
      win.classList.remove("collapsed");
      if(win.dataset.h) win.style.height=win.dataset.h;   // restore resized height
      setTimeout(()=>Charts.resize(),30);
    } else {                                           // collapse to just the title bar
      win.dataset.h = win.style.height||"";
      win.style.height="";
      win.classList.add("collapsed");
    }
  }
  function makeChartsFloatDraggable(){
    const win=$("charts-float"), h=$("charts-fw-head");
    let sx,sy,ox,oy,drag=false,moved=false,lastT=0;
    h.addEventListener("mousedown", e=>{
      if(e.target.closest(".fw-close")) return;
      drag=true; moved=false; sx=e.clientX; sy=e.clientY;
      const r=win.getBoundingClientRect(); ox=r.left; oy=r.top;
      win.style.right="auto"; win.style.left=ox+"px"; win.style.top=oy+"px";
      document.body.style.userSelect="none"; e.preventDefault();
    });
    window.addEventListener("mousemove", e=>{ if(!drag) return;
      if(Math.abs(e.clientX-sx)>3 || Math.abs(e.clientY-sy)>3) moved=true;
      const nl=Math.max(0,Math.min(ox+(e.clientX-sx), innerWidth-120));
      const nt=Math.max(0,Math.min(oy+(e.clientY-sy), innerHeight-40));
      win.style.left=nl+"px"; win.style.top=nt+"px"; });
    window.addEventListener("mouseup", ()=>{ if(!drag) return; drag=false; document.body.style.userSelect="";
      // a click (no drag) on the title bar rolls it up/down; the 2nd click of a double-click is ignored
      if(!moved && Date.now()-lastT>400){ lastT=Date.now(); toggleChartsCollapse(); }
    });
    if(window.ResizeObserver) new ResizeObserver(()=>Charts.resize()).observe(win);
  }

  function wire(){
    // mode
    $("mode-seg").querySelectorAll("button").forEach(b=>b.onclick=()=>{
      mode=b.dataset.mode; $("mode-seg").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));
      refresh();
    });
    syncModeCtrl();
    // fill on/off (green switch) — applies in any mode
    $("fill-toggle").onchange=e=>{ showFill=e.target.checked; if(showFill && MssRaw.isOn()) MssRaw.setOn(false, true); refresh(); };
    // element
    $("elem-seg").querySelectorAll("button").forEach(b=>b.onclick=()=>{
      element=b.dataset.elem; $("elem-seg").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b)); refresh(); });
    // month: full 12-month slider (data has all 12 monthly means per subzone)
    $("month-slider").oninput=e=>{ month=+e.target.value; $("month-val").textContent=t("months")[month-1];
      if(mode==="temp_wind" || MssRaw.isOn()) refresh(); };
    // scenario
    $("scenario-select").onchange=e=>{ scen=e.target.value; onScenarioChanged(); };
    // year
    $("year-slider").oninput=e=>{ year=+e.target.value; $("year-val").textContent=year;
      refresh(); refreshCharts(); };
    // jurong
    $("jurong-toggle").onchange=e=>{ MapView.setJurongOnly(e.target.checked); $("jg-others-row").classList.toggle("hidden", !e.target.checked); };
    $("jg-others").onchange=e=>MapView.setJurongOthers(e.target.checked);
    // exclusive with the MSS V3 raw data panel, as that panel is with the subzone fill
    $("btn-cat-fill").onclick=async ()=>{ catFill=!catFill; if(catFill && MssRaw.isOn()) await MssRaw.setOn(false, true); refresh(); };
    $("btn-sel-jurong").onclick=()=>{ jurongIds().forEach(id=>selected.add(id)); selChanged(); MapView.fit(true); };
    // category + search
    $("basemap-select").onchange=e=>{ MapView.setBasemap(e.target.value); Forecast.restyle(); };
    // data tabs: long-term projection (this page) / short-term forecast (WeatherNext V3, js/forecast.js)
    $("app-mode").querySelectorAll("button").forEach(b=>b.onclick=()=>setAppMode(b.dataset.am));
    $("subzone-search").oninput=buildList;
    // downloads
    $("btn-dl-selected").onclick=()=>{ const keys = scen==="all"?allKeys:[scen];
      Downloader.selected([...selected], keys); };
    $("btn-sel-cat").onclick=()=>{ lastShown.forEach(id=>selected.add(id)); selChanged(); };
    $("btn-clear-sel").onclick=()=>{ selected.clear(); selChanged(); };
    // modals
    $("btn-compare").onclick=()=>Compare.open({ metric: mode==="hot_hours"?"hot" : mode==="warm_nights"?"warm" : element,
      month, ssp: scMeta(mapScen()).ssp });
    $("charts-fw-close").onclick=()=>{ $("charts-float").classList.add("hidden"); unpin(); MapView.setCompare([]); };
    $("btn-dl-all").onclick=()=>{ if(confirm(t("dl_all_confirm"))) window.location.href="/api/all_epw"; };
    $("btn-help").onclick=()=>{ renderHelp(); $("modal-help").classList.remove("hidden"); };
    document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest(".modal").classList.add("hidden"));
    document.querySelectorAll(".modal").forEach(m=>m.onclick=e=>{ if(e.target===m) m.classList.add("hidden"); });
    $("lightbox").onclick=(e)=>{ const lb=$("lightbox"), im=$("lightbox-img");
      if(e.target===im){ lb.classList.toggle("zoom"); im.classList.toggle("zoomed"); }
      else { lb.classList.add("hidden"); lb.classList.remove("zoom"); im.classList.remove("zoomed"); } };
    // lang
    $("lang-toggle").querySelectorAll("button").forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"){
      document.querySelectorAll(".modal,.lightbox").forEach(m=>m.classList.add("hidden"));
      $("lightbox").classList.remove("zoom"); $("lightbox-img").classList.remove("zoomed"); } });
  }

  /* About follows the top tab (user 2026-10-19): long-term = help text + the computation workflow diagram as its
     last section (was a top-bar "Workflow" button); short-term = the forecast notes, led by the current-data summary
     that used to sit in the forecast panel */
  function renderHelp(){
    $("help-scope").textContent="· "+t(appMode==="st" ? "am_st" : "am_lt");
    if(appMode==="st"){ const now=Forecast.helpInfo();
      $("help-body").innerHTML=(now.length ? `<h4>${t("wn_now_title")}</h4>`+now.map(s=>`<p>${s}</p>`).join("") : "") + t("help_wn"); return; }
    const src=manifest?.paths?.flow_image;
    $("help-body").innerHTML=t("help_html") + (src ? `<h4 id="help-flow">${t("flow_title")}</h4>`+
      `<img class="help-flow zoomable" src="${src}" alt="computation workflow" />`+
      `<div class="hint help-flow-hint">${t("zoom_hint")}</div>` : "");
    const im=$("help-body").querySelector(".help-flow"); if(im) im.onclick=()=>openLightbox(src);
  }

  // re-render dynamic, language-dependent bits
  window.onLangChange = ()=>{
    Measure.refreshText(); MssRaw.refreshText();
    if(!manifest) return;
    // scenario option labels
    const sel=$("scenario-select");
    [...sel.options].forEach(o=>{ o.textContent = o.dataset.all? t("scenario_all") : scLabel(o.value); });
    // category labels
    [...$("basemap-select").options].forEach(o=>{ if(o.dataset.bm) o.textContent=t(o.dataset.bm); });
    $("month-val").textContent=t("months")[month-1];
    updateLegend(); updateHints(); buildList();
    refreshCharts();
    if(Compare.isOpen()) Compare.render();
    if($("modal-help").classList.contains("hidden")===false) renderHelp();
    Forecast.refreshText();
  };

  return {init};
})();
document.addEventListener("DOMContentLoaded", App.init);
