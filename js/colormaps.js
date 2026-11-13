/* Color ramps matching matplotlib 'inferno' and ColorBrewer 'YlGnBu' / 'YlOrRd' / 'RdPu'.
   Piecewise-linear interpolation over evenly spaced stops. */
const CMAPS = {
  inferno: ["#000004","#1b0c41","#4a0c6b","#781c6d","#a52c60","#cf4446",
            "#ed6925","#fb9a06","#f7d13d","#fcffa4"],
  YlGnBu:  ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0",
            "#225ea8","#253494","#081d58"],
  YlOrRd:  ["#ffffcc","#ffeda0","#fed976","#feb24c","#fd8d3c","#fc4e2a",
            "#e31a1c","#bd0026","#800026"],
  RdPu:    ["#fff7f3","#fde0dd","#fcc5c0","#fa9fb5","#f768a1","#dd3497",
            "#ae017e","#7a0177","#49006a"],   // warm nights (hot night hours)
  // short-term forecast (WeatherNext V3, js/forecast.js), as matplotlib's RdBu_r / viridis / plasma / ocean_r
  RdBu_r:  ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7",
            "#fddbc7","#f4a582","#d6604d","#b2182b","#67001f"],
  viridis: ["#440154","#482878","#3e4989","#31688e","#26828e","#1f9e89",
            "#35b779","#6ece58","#b5de2b","#fde725"],
  plasma:  ["#0d0887","#46039f","#7201a8","#9c179e","#bd3786","#d8576b",
            "#ed7953","#fb9f3a","#fdca26","#f0f921"],
  ocean_r: ["#ffffff","#c4e6f0","#80c6e0","#3ea0cc","#0b74b4","#004c94",
            "#002a66","#013d38","#006a24","#008000"],
};

function _hex2rgb(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function _rgb2hex(r){ return "#"+r.map(v=>Math.round(v).toString(16).padStart(2,"0")).join(""); }

/* sample a colormap at t in [0,1] -> hex */
function cmapColor(name, t){
  const stops = CMAPS[name] || CMAPS.inferno;
  if (isNaN(t)) return "#3a4651";
  t = Math.max(0, Math.min(1, t));
  const x = t*(stops.length-1), i = Math.floor(x), f = x-i;
  if (i >= stops.length-1) return stops[stops.length-1];
  const a=_hex2rgb(stops[i]), b=_hex2rgb(stops[i+1]);
  return _rgb2hex([a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f]);
}

/* normalize a value to [0,1] given vmin/vmax */
function norm(v, vmin, vmax){
  if (v==null || isNaN(v)) return NaN;
  if (vmax<=vmin) return 0;
  return (v - vmin)/(vmax - vmin);
}

/* color for a value */
function valueColor(name, v, vmin, vmax){ return cmapColor(name, norm(v, vmin, vmax)); }

/* CSS linear-gradient string for a legend bar */
function cmapGradient(name){
  const stops = CMAPS[name] || CMAPS.inferno;
  const n = stops.length-1;
  return "linear-gradient(90deg," + stops.map((c,i)=>`${c} ${(i/n*100).toFixed(0)}%`).join(",") + ")";
}
