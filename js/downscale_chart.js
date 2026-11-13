/* Live "Pre/post ΔT, AH, LE (7 scenarios)" chart for the subzone modal (replaces the static
   step3 PNG). Reads the UT&C 16-series npz (outputs/downscaled_epw/_npz_16/<id>__<scen>.npz)
   in the browser with JSZip + a small .npy parser, plus the pre-downscaling forcing reference
   (data/downscale_ref.json, built by prepare_data.py). Same definitions as
   tools/plot_step3_diurnal_7scen_batch.py: ΔT = TCanyon − T_forcing, AH = Qf_canyon,
   LE = LE_canyon, each as a mean diurnal cycle (hour 0..23 local). */
const DownscaleChart = (()=>{
  const SCEN = ["hist_1995_2014","mid_2040_2059_ssp126","mid_2040_2059_ssp245","mid_2040_2059_ssp585",
                "end_2080_2099_ssp126","end_2080_2099_ssp245","end_2080_2099_ssp585"];
  // colours / dashes of the original figure (white background)
  const STYLE = {
    hist_1995_2014:      {color:"#a8336f", type:"solid",  width:1.8},
    mid_2040_2059_ssp126:{color:"#5bafe8", type:"solid",  width:1.5},
    mid_2040_2059_ssp245:{color:"#f0a23a", type:"solid",  width:1.5},
    mid_2040_2059_ssp585:{color:"#d9534f", type:"solid",  width:1.5},
    end_2080_2099_ssp126:{color:"#1c5d8f", type:"dashed", width:1.6},
    end_2080_2099_ssp245:{color:"#a35a00", type:"dashed", width:1.6},
    end_2080_2099_ssp585:{color:"#7a1e1c", type:"dashed", width:1.6},
  };
  const HIST_FILL = "rgba(252,220,238,0.65)", NIGHT = "rgba(230,230,242,0.55)", INK = "#333", GRID = "#e3e3e8";
  const cache = new Map();          // subzone id -> computed series
  let refP = null;

  function label(sc){
    const ssp = t("ssp_label");
    if(sc==="hist_1995_2014") return `${ssp.historical} 1995–2014`;
    return `${sc.startsWith("mid")?"Mid":"End"} · ${ssp[sc.split("_").pop()]}`;
  }

  /* .npy -> typed array (little-endian float32/float64, C order, 1-D) */
  function parseNpy(buf){
    const u8 = new Uint8Array(buf);
    if(u8[0]!==0x93 || String.fromCharCode(u8[1],u8[2],u8[3],u8[4],u8[5])!=="NUMPY") throw new Error("not an .npy file");
    const dv = new DataView(buf), major = u8[6];
    const hstart = major===1 ? 10 : 12, hlen = major===1 ? dv.getUint16(8,true) : dv.getUint32(8,true);
    let header = ""; for(let i=hstart;i<hstart+hlen;i++) header += String.fromCharCode(u8[i]);
    const descr = (/'descr':\s*'([^']+)'/.exec(header)||[])[1];
    const body = buf.slice(hstart+hlen);                 // copy -> properly aligned for the typed array
    if(descr==="<f4") return new Float32Array(body);
    if(descr==="<f8") return new Float64Array(body);
    throw new Error("unsupported npy dtype "+descr);
  }
  async function loadNpz(url, keys){
    const r = await fetch(url);
    if(!r.ok) return null;                               // 404 = scenario not computed (yet)
    const zip = await JSZip.loadAsync(await r.arrayBuffer());
    const out = {};
    for(const k of keys){ const f = zip.file(k+".npy"); if(!f) return null; out[k] = parseNpy(await f.async("arraybuffer")); }
    return out;
  }
  function diurnal(a){
    const s = new Float64Array(24), c = new Float64Array(24), n = Math.floor(a.length/24)*24;
    for(let i=0;i<n;i++){ const v=a[i]; if(!isNaN(v)){ s[i%24]+=v; c[i%24]++; } }
    return Array.from(s, (x,h)=> c[h] ? x/c[h] : null);
  }
  function loadRef(url){ return refP || (refP = fetch(url).then(r=>r.ok?r.json():null).catch(()=>null)); }

  async function compute(id, manifest){
    if(cache.has(id)) return cache.get(id);
    const ref = await loadRef((manifest.paths && manifest.paths.downscale_ref) || "data/downscale_ref.json");
    const tmpl = (manifest.paths && manifest.paths.npz16) || "../outputs/downscaled_epw/_npz_16/{id}__{scenario}.npz";
    const isUtc = !(ref && Array.isArray(ref.utc)) || ref.utc.includes(id);   // unknown -> try the npz
    if(!isUtc){                                          // passthrough zone: no canyon model run, no npz
      const zero = new Array(24).fill(0);
      const res = {bypass:true, runs: SCEN.map(sc=>{
        const ah = ref.ah_bypass[sc] && ref.ah_bypass[sc][id];
        return {sc, dT: zero, qf: ah || zero, le: zero}; })};
      cache.set(id, res);
      return res;
    }
    const runs = await Promise.all(SCEN.map(async sc=>{
      let z = null;
      try { z = await loadNpz(tmpl.replace(/{id}/g,id).replace(/{scenario}/g,sc), ["TCanyon","Qf_canyon","LE_canyon"]); }
      catch(e){ console.warn("npz", sc, e); }
      if(!z) return null;
      const tf = ref && ref.t_forcing[sc] && ref.t_forcing[sc][id];
      const tc = diurnal(z.TCanyon).map(v=> v==null?null:v-273.15);
      return {sc, dT: tf ? tc.map((v,h)=> v==null?null:v-tf[h]) : null, qf: diurnal(z.Qf_canyon), le: diurnal(z.LE_canyon)};
    }));
    // UT&C zone: an empty result means this deployment has no _npz_16 -> caller shows the static PNG
    const res = {bypass:false, runs: runs.filter(Boolean), noRef: !ref};
    cache.set(id, res);
    return res;
  }

  function option(res){
    const H = Array.from({length:24}, (_,h)=>h);
    const grids = [{left:64,right:18,top:58,height:150}, {left:64,right:18,top:252,height:150}, {left:64,right:18,top:446,height:150}];
    const names = [t("ds_dt"), t("ds_ah"), t("ds_le")];
    const xAxis = grids.map((g,k)=>({gridIndex:k, type:"value", min:0, max:23, interval:3,
      name: k===2 ? t("ds_hour") : "", nameLocation:"middle", nameGap:24, nameTextStyle:{color:INK,fontSize:11},
      axisLine:{lineStyle:{color:"#888"}}, axisLabel:{show:k===2, color:INK, fontSize:10},
      splitLine:{show:true, lineStyle:{color:GRID, type:"dotted"}}}));
    const yAxis = grids.map((g,k)=>({gridIndex:k, type:"value", scale:k===0, min:k===0?undefined:0,
      name:names[k], nameLocation:"middle", nameGap:44, nameTextStyle:{color:INK,fontSize:11},
      axisLine:{show:true, lineStyle:{color:"#888"}}, axisLabel:{color:INK, fontSize:10},
      splitLine:{lineStyle:{color:GRID, type:"dotted"}}}));
    const night = {silent:true, itemStyle:{color:NIGHT}, data:[[{xAxis:0},{xAxis:6}], [{xAxis:19},{xAxis:23}]]};
    const series = [];
    res.runs.forEach((r,i)=>{
      const st = STYLE[r.sc], hist = r.sc==="hist_1995_2014";
      ["dT","qf","le"].forEach((f,k)=>{
        if(!r[f]) return;
        const s = {name:label(r.sc), type:"line", xAxisIndex:k, yAxisIndex:k, showSymbol:false, smooth:false,
          data: H.map(h=>[h, r[f][h]==null?null:+r[f][h].toFixed(3)]),
          lineStyle:{color:st.color, type:st.type, width:st.width}, itemStyle:{color:st.color}, z: hist?2:3};
        if(hist) s.areaStyle = {color:HIST_FILL, origin:0};
        if(i===0){ s.markArea = night;
          if(k===0) s.markLine = {silent:true, symbol:"none", label:{show:false}, lineStyle:{color:"#000",width:0.6,type:"solid"}, data:[{yAxis:0}]}; }
        series.push(s);
      });
    });
    return {
      animationDuration:250, backgroundColor:"#fff",
      legend:{top:6, left:"center", itemWidth:22, itemHeight:8, textStyle:{color:INK, fontSize:10}},
      tooltip:{trigger:"axis", axisPointer:{type:"line"}, backgroundColor:"rgba(255,255,255,.96)", borderColor:"#ccc",
        textStyle:{color:"#222", fontSize:11},
        valueFormatter:v=> v==null ? "—" : (+v).toFixed(2)},
      grid:grids, xAxis, yAxis, series,
    };
  }

  /* draw into `el`; returns false if nothing could be drawn (caller shows the static PNG) */
  async function render(el, statusEl, props, manifest){
    if(typeof JSZip==="undefined" || typeof echarts==="undefined") return false;
    statusEl.textContent = t("ds_loading");
    const id = props.id;
    let res;
    try { res = await compute(id, manifest); } catch(e){ console.warn(e); return false; }
    if(SubzoneModal.currentId() !== id) return true;     // user moved on to another subzone meanwhile
    if(!res.runs.length) return false;
    const chart = echarts.getInstanceByDom(el) || echarts.init(el, null, {renderer:"canvas"});
    // the pane's width depends on the morphology images above it, which may still be loading
    // when the chart is created -> follow the container instead of sizing once
    if(!el._dsObs && window.ResizeObserver){ el._dsObs = new ResizeObserver(()=>chart.resize()); el._dsObs.observe(el); }
    chart.setOption(option(res), true);
    chart.resize();
    el.dataset.forId = id;
    const n = res.bypass ? 0 : res.runs.length;
    statusEl.textContent = res.bypass ? t("ds_bypass")
      : t("ds_avail")(n) + (n<7 ? " · " + t("ds_pending")(n) : "") + (res.noRef ? " · " + t("ds_noref") : "");
    return true;
  }
  function resize(el){ const c = el && echarts.getInstanceByDom(el); if(c) c.resize(); }
  return {render, resize};
})();
