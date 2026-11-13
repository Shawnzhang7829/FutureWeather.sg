/* Online (GitHub Pages) build of Future weather.sg (user 2026-11-14). Injected into index.html before js/app.js by
   tools/fw_online/build_fw_online.py; the local sites (web_mss / dist / Workshop) never load it.
   - hourly curves: the EPW template points to slim binaries (int16: Tdb, RH, GHI, Wspd; 8760 h, Jan 1 - Dec 31,
     non-leap), parsed here into the same object js/epw.js returns, so charts.js / app.js need no change;
   - EPW downloads: the figshare record (ONLINE.epw_url); while it is empty the download controls are hidden;
   - no short-term forecast tab (WeatherNext V3 data are not redistributed online; data/wn3 is not deployed). */
(()=>{
  const ONLINE = {"epw_url": "https://doi.org/10.6084/m9.figshare.35005411"};
  window.FW_ONLINE = ONLINE;
  try{ localStorage.setItem("mss.appMode", "lt"); }catch(e){}       // app.js restores the last tab: always long-term here

  const dl = !!ONLINE.epw_url;
  const css = `#app-mode{display:none!important}` + (dl ? "" :
    `#btn-dl-selected, section:has(> #btn-dl-all), #sz-dl-grid .dl-card .btn, #sz-dl-grid .dl-allbar{display:none!important}`);
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* slim EPW: Int16Array [4][8760] little-endian = Tdb x100, RH x1, GHI x1, Wspd x10 (build_fw_online.py SCALE) */
  const SCALE = [100, 1, 1, 10];
  const MDAYS = [31,28,31,30,31,30,31,31,30,31,30,31];
  const MONTH = []; MDAYS.forEach((d, m)=>{ for(let i=0; i<d*24; i++) MONTH.push(m+1); });
  const load0 = EPW.load, cache = new Map();
  EPW.load = url=>{
    if(!/\.bin(\?|$)/.test(url)) return load0(url);
    if(!cache.has(url)) cache.set(url, fetch(url).then(r=>{ if(!r.ok) throw new Error("EPW not found: "+url); return r.arrayBuffer(); })
      .then(buf=>{
        const a = new Int16Array(buf), n = a.length/4, col = k=>Array.from(a.subarray(k*n, (k+1)*n), v=>v/SCALE[k]);
        return {month: MONTH.slice(0, n), hour: Array.from({length: n}, (_, i)=>i%24+1),
                T: col(0), RH: col(1), GHI: col(2), W: col(3), n};
      }));
    return cache.get(url);
  };

  /* downloads -> the figshare record (new tab) */
  if(dl){
    const go = ()=>window.open(ONLINE.epw_url, "_blank", "noopener");
    Downloader.one = go; Downloader.subzoneAll = async ()=>go(); Downloader.selected = async ids=>{ if(ids.length) go(); };
    document.addEventListener("click", e=>{                           // app.js binds btn-dl-all to the local server's /api/all_epw
      if(e.target.closest && e.target.closest("#btn-dl-all")){ e.preventDefault(); e.stopPropagation(); go(); }
    }, true);
  }
})();
