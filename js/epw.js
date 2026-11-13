/* Fetch & parse EPW files; compute diurnal cycle and annual series.
   EPW data row (0-indexed): col1=month, col2=day, col3=hour(1-24),
   col6=Tdb °C, col8=RH %, col13=GHI W/m2, col21=wind m/s. */
const EPW = (()=> {
  const cache = new Map();
  let COLS = {Tdb:6, RH:8, GHI:13, Wspd:21};
  function setCols(c){ COLS = c; }

  async function load(epwUrl){
    if (cache.has(epwUrl)) return cache.get(epwUrl);
    const p = (async ()=>{
      const r = await fetch(epwUrl);
      if (!r.ok) throw new Error("EPW not found: "+epwUrl);
      const text = await r.text();
      const lines = text.split(/\r?\n/);
      // 8 header lines, then 8760 data rows
      const month=[], hour=[], T=[], RH=[], GHI=[], W=[];
      for (let i=8;i<lines.length;i++){
        const ln = lines[i]; if (!ln) continue;
        const f = ln.split(",");
        if (f.length < 22) continue;
        month.push(+f[1]); hour.push(+f[3]);
        T.push(+f[COLS.Tdb]); RH.push(+f[COLS.RH]);
        GHI.push(+f[COLS.GHI]); W.push(+f[COLS.Wspd]);
      }
      return {month, hour, T, RH, GHI, W, n:T.length};
    })();
    cache.set(epwUrl, p);
    return p;
  }

  /* mean over hour-of-day 1..24 -> array[24] (index 0 = hour 1) */
  function diurnal(arr, hour){
    const sum=new Array(24).fill(0), cnt=new Array(24).fill(0);
    for (let i=0;i<arr.length;i++){
      const h=(hour[i]-1)%24; const v=arr[i];
      if (!isNaN(v)){ sum[h]+=v; cnt[h]++; }
    }
    return sum.map((s,h)=> cnt[h]? +(s/cnt[h]).toFixed(2):null);
  }

  /* daily-mean of an 8760 series -> array[365] (for compact annual plot) */
  function dailyMean(arr){
    const out=[]; for (let d=0; d<365; d++){
      let s=0,c=0; for (let h=0;h<24;h++){ const v=arr[d*24+h]; if(!isNaN(v)){s+=v;c++;} }
      out.push(c? +(s/c).toFixed(2):null);
    } return out;
  }

  /* daily-max of an 8760 series -> array[365] */
  function dailyMax(arr){
    const out=[]; for (let d=0; d<365; d++){
      let m=-Infinity; for (let h=0;h<24;h++){ const v=arr[d*24+h]; if(!isNaN(v)&&v>m) m=v; }
      out.push(isFinite(m)? +m.toFixed(2):null);
    } return out;
  }

  /* daily-min of an 8760 series -> array[365] */
  function dailyMin(arr){
    const out=[]; for (let d=0; d<365; d++){
      let m=Infinity; for (let h=0;h<24;h++){ const v=arr[d*24+h]; if(!isNaN(v)&&v<m) m=v; }
      out.push(isFinite(m)? +m.toFixed(2):null);
    } return out;
  }

  /* count hours above threshold in a series */
  function countAbove(arr, thr){ let n=0; for (const v of arr) if (v>thr) n++; return n; }

  /* warm nights: daily min > WARM_T; night = 19:00–07:00 local. EPW hour h (1..24)
     is clock time (h-1):00, so night = EPW hours 20..24 and 1..7 (same as prepare_data.py) */
  const WARM_T = 26.3, NIGHT_START = 19, NIGHT_END = 7;
  function isNight(h){ const c=(h-1)%24; return c>=NIGHT_START || c<NIGHT_END; }
  function countNightAbove(arr, hour, thr){
    let n=0; for (let i=0;i<arr.length;i++) if (arr[i]>thr && isNight(hour[i])) n++; return n;
  }

  return {load, diurnal, dailyMean, dailyMax, dailyMin, countAbove, countNightAbove, setCols, WARM_T};
})();
