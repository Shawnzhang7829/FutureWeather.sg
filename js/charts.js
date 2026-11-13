/* ECharts wrappers: 2x2 diurnal small-multiples + annual curve. Dark theme. */
const SCEN_COLORS = {
  hist_1995_2014:"#38bdf8",
  mid_2040_2059_ssp126:"#4ade80", mid_2040_2059_ssp245:"#fbbf24", mid_2040_2059_ssp585:"#f87171",
  end_2080_2099_ssp126:"#16a34a", end_2080_2099_ssp245:"#ea580c", end_2080_2099_ssp585:"#dc2626",
};
const AX = "#8b9bab", GRIDLINE = "rgba(139,155,171,.13)";
const WN_THR = "#e879f9", WN_MIN = "#818cf8", WN_BAR = "#c026d3";   // warm nights: 26.3°C line / daily min / day strip

const Charts = (()=>{
  let diu=null, ann=null, heat=null, warm=null;
  const HOURS = Array.from({length:24}, (_,i)=> (i+1<10?"0":"")+(i+1));
  /* full-year time axes (user 2026-10-10, as UBEM.sg's hourly cooling-load chart): a typical non-leap year in UTC,
     hour i of the year = clock i % 24 :00 (EPW hour i+1), day k = day k of the year; labels follow the zoom:
     months -> days -> hours */
  const T0=Date.UTC(2023,0,1), HR=3600e3, DAY=24*HR, TMAX=T0+8759*HR, two=n=>String(n).padStart(2,"0");
  const MON=()=>t("months")||[];
  const dayLab=d=>LANG==="zh" ? `${d.getUTCMonth()+1}月${d.getUTCDate()}日` : `${MON()[d.getUTCMonth()]} ${d.getUTCDate()}`;
  const hourLab=d=>`${dayLab(d)} ${two(d.getUTCHours())}:00`;
  const xLab=v=>{ const d=new Date(v);
    if(d.getUTCHours() || d.getUTCMinutes()) return `${two(d.getUTCHours())}:00`;
    return d.getUTCDate()===1 ? `{m|${MON()[d.getUTCMonth()]||""}}` : dayLab(d); };
  const timeX=(gi, labels)=>({gridIndex:gi, type:"time", min:T0, max:TMAX, axisLine:{lineStyle:{color:AX}}, axisTick:{show:false},
    splitLine:{show:false}, axisLabel: labels ? {color:AX, fontSize:9, hideOverlap:true, formatter:xLab,
      rich:{m:{color:"#cdd9e3", fontSize:9, fontWeight:"bold"}}} : {show:false}});
  // fm: "none" for the daily charts so their lines run to the window edges when zoomed in to a few days
  const zoom=(xi, minSpan, lab, fm)=>[{type:"inside", xAxisIndex:xi, minValueSpan:minSpan, filterMode:fm||"filter"},
    {type:"slider", xAxisIndex:xi, height:14, bottom:6, minValueSpan:minSpan, filterMode:fm||"filter", borderColor:"#2b3743",
      textStyle:{color:AX, fontSize:9}, labelFormatter:v=>lab(new Date(v))}];
  /* day strip (heatwave / warm-night days) on the time axis: one bar per flagged day, midnight to midnight */
  const strip=(flags, color, name, band=0)=>({name, type:"custom", xAxisIndex:1, yAxisIndex:1, silent:true, clip:true,
    data:flags.map((b,k)=>b ? [T0+k*DAY, T0+(k+1)*DAY] : null).filter(Boolean), encode:{x:[0,1]},
    renderItem:(p, api)=>{ const a=api.coord([api.value(0), band+1]), b=api.coord([api.value(1), band]);
      return {type:"rect", shape:{x:a[0], y:a[1], width:Math.max(1, b[0]-a[0]+0.5), height:b[1]-a[1]}, style:{fill:color}}; }});
  const atNoon=arr=>arr.map((v,k)=>[T0+k*DAY+12*HR, v]);       // daily values plotted mid-day

  function init(diuEl, annEl, hwEl, wnEl){
    diu = echarts.init(diuEl, null, {renderer:"canvas"});
    ann = echarts.init(annEl, null, {renderer:"canvas"});
    heat = hwEl ? echarts.init(hwEl, null, {renderer:"canvas"}) : null;
    warm = wnEl ? echarts.init(wnEl, null, {renderer:"canvas"}) : null;
    window.addEventListener("resize", resize);
  }
  function resize(){ diu&&diu.resize(); ann&&ann.resize(); heat&&heat.resize(); warm&&warm.resize(); }

  function _grids(){
    // 4 stacked full-width rows — one variable per row
    const grids=[], xs=[], ys=[], titles=[];
    const labels=[t("temp_c"), t("rh"), t("wind_ms"), t("ghi")];
    const rows=4, top0=9, rowH=(100-top0)/rows;   // %
    for (let k=0;k<rows;k++){
      const rTop=top0+k*rowH, gTop=rTop+4.5, gBottom=rTop+rowH-2;
      grids.push({left:"15%", right:"5%", top:gTop+"%", bottom:(100-gBottom)+"%"});
      xs.push({gridIndex:k, type:"category", data:HOURS, axisLine:{lineStyle:{color:AX}},
        axisLabel:{color:AX,fontSize:9,interval:5}, axisTick:{show:false}});
      ys.push({gridIndex:k, type:"value", scale:true, axisLine:{show:false},
        axisLabel:{color:AX,fontSize:9}, splitLine:{lineStyle:{color:GRIDLINE}}});
      titles.push({text:labels[k], left:"15%", top:rTop+"%",
        textStyle:{color:AX,fontSize:10,fontWeight:"normal"}});
    }
    return {grids,xs,ys,titles};
  }

  /* seriesList: [{key,name,color,T:[24],RH:[24],W:[24],GHI:[24]}] */
  function renderDiurnal(seriesList){
    const {grids,xs,ys,titles}=_grids();
    const fields=["T","RH","W","GHI"];
    const series=[];
    seriesList.forEach(s=>{
      fields.forEach((f,gi)=>{
        series.push({name:s.name, type:"line", smooth:true, showSymbol:false,
          gridIndex:gi, xAxisIndex:gi, yAxisIndex:gi, data:s[f],
          lineStyle:{width:1.6,color:s.color}, itemStyle:{color:s.color}});
      });
    });
    diu.setOption({
      animationDuration:300, backgroundColor:"transparent",
      title:[{text:t("diurnal_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}}, ...titles],
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743",
        textStyle:{color:"#e6edf3",fontSize:11}},
      grid:grids, xAxis:xs, yAxis:ys, series,
    }, true);
    diu.resize();
  }

  /* annual: {hourly:[8760], color, scenarioName, hotCount, hotNightCount} — hourly so the
     35°C and 26.3°C lines are meaningful (hot night hours = 19:00–07:00 hours above 26.3°C) */
  function renderAnnual(o){
    const data = Array.from(o.hourly, (v,i)=>[T0+i*HR, v]);   // x = hour of the year on the time axis
    const sub  = `${o.scenarioName} · ${t("hot_hours_yr")} >35°C: ${o.hotCount} ${t("hours")}`;
    const sub2 = `${t("hot_night_hours")} >${EPW.WARM_T}°C (19–07h): ${o.hotNightCount} ${t("hours")}`;
    ann.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[{text:t("annual_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
             {text:sub,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
             {text:sub2,left:"center",top:29,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}}],
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743",
        textStyle:{color:"#e6edf3",fontSize:11},
        formatter:p=>`${hourLab(new Date(p[0].data[0]))}<br/>${p[0].marker} ${(+p[0].data[1]).toFixed(1)} °C`},
      grid:{left:42,right:14,top:56,bottom:46},
      xAxis:timeX(0, true), dataZoom:zoom(0, 12*HR, hourLab),
      yAxis:{type:"value", scale:true, name:"°C", nameTextStyle:{color:AX,fontSize:9},
        axisLine:{show:false}, axisLabel:{color:AX,fontSize:9}, splitLine:{lineStyle:{color:GRIDLINE}}},
      series:[{type:"line", showSymbol:false, data, sampling:"lttb", large:true,
        lineStyle:{width:0.6,color:o.color}, itemStyle:{color:o.color},
        markLine:{silent:true, symbol:"none", data:[
          {yAxis:35, lineStyle:{color:"#ef4444",type:"dashed",width:1.2}, label:{formatter:"35°C", color:"#ef4444", fontSize:9,position:"insideEndTop"}},
          {yAxis:EPW.WARM_T, lineStyle:{color:WN_THR,type:"dashed",width:1.2}, label:{formatter:EPW.WARM_T+"°C", color:WN_THR, fontSize:9,position:"insideEndTop"}},
        ]}}],
    }, true);
    ann.resize();
  }

  /* heatwave day = inside a run of >= 3 consecutive days with daily max >= 35 AND daily mean >= 29 */
  function hwFlags(dmax, dmean){
    const n=dmax.length, pred=dmax.map((v,i)=> v!=null && v>=35 && dmean[i]!=null && dmean[i]>=29), hwArr=new Array(n).fill(false);
    for(let i=0;i<n;){
      if(pred[i]){ let j=i; while(j<n && pred[j]) j++;
        if(j-i>=3){ for(let k=i;k<j;k++) hwArr[k]=true; } i=j; }
      else i++;
    }
    return hwArr;
  }
  /* heatwave: {dmax:[365], dmean:[365], scenarioName} — 日最高/日均气温 + 是否热浪天 */
  function renderHeatwave(o){
    const hwArr=hwFlags(o.dmax, o.dmean);
    const total=hwArr.reduce((s,b)=>s+(b?1:0),0);
    const sub=`${o.scenarioName?o.scenarioName+" · ":""}${t("total_hw")}: ${total} ${t("days_unit")}`;
    heat.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[
        {text:t("heatwave_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
        {text:sub,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
      ],
      legend:{data:[t("daily_max"),t("daily_mean_t")],top:32,textStyle:{color:AX,fontSize:9},itemWidth:14,itemHeight:8},
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743", textStyle:{color:"#e6edf3",fontSize:11},
        formatter:p=>{ const k=Math.floor((p[0].value[0]-T0)/DAY); let s=dayLab(new Date(T0+k*DAY));
          p.forEach(x=>{ if(x.seriesType==="line" && x.value && x.value[1]!=null) s+=`<br/>${x.marker} ${x.seriesName}: ${(+x.value[1]).toFixed(1)} °C`; });
          return s + `<br/>${t("is_heatwave")}: ${hwArr[k]?"✓":"—"}`; }},
      grid:[
        {left:44,right:14,top:50,height:128},
        {left:44,right:14,top:188,height:26},
      ],
      xAxis:[timeX(0, false), timeX(1, true)], dataZoom:zoom([0,1], 2*DAY, dayLab, "none"),
      yAxis:[
        {gridIndex:0,type:"value",scale:true,name:"°C",nameTextStyle:{color:AX,fontSize:9},
          axisLine:{show:false},axisLabel:{color:AX,fontSize:9},splitLine:{lineStyle:{color:GRIDLINE}}},
        {gridIndex:1,type:"value",min:0,max:1,axisLine:{show:false},axisLabel:{show:false},splitLine:{show:false},axisTick:{show:false}},
      ],
      series:[
        {name:t("daily_max"),type:"line",xAxisIndex:0,yAxisIndex:0,data:atNoon(o.dmax),showSymbol:false,smooth:true,
          lineStyle:{width:1.2,color:"#ef4444"},itemStyle:{color:"#ef4444"},
          markLine:{silent:true,symbol:"none",data:[
            {yAxis:35,lineStyle:{color:"#ef4444",type:"dashed",width:1},label:{formatter:"35°C",color:"#ef4444",fontSize:9,position:"insideEndTop"}},
            {yAxis:29,lineStyle:{color:"#fbbf24",type:"dashed",width:1},label:{formatter:"29°C",color:"#fbbf24",fontSize:9,position:"insideEndTop"}},
          ]}},
        {name:t("daily_mean_t"),type:"line",xAxisIndex:0,yAxisIndex:0,data:atNoon(o.dmean),showSymbol:false,smooth:true,
          lineStyle:{width:1.2,color:"#fb923c"},itemStyle:{color:"#fb923c"}},
        strip(hwArr, "#dc2626", t("is_heatwave")),
      ],
    }, true);
    heat.resize();
  }

  /* warm nights: {dmin:[365], scenarioName} — 日最低气温 + 是否暖夜 (daily min > 26.3°C,
     i.e. the whole night stays above 26.3°C) */
  function renderWarmNights(o){
    const n=o.dmin.length, T=EPW.WARM_T;
    const wn=o.dmin.map(v=> v!=null && v>T);
    const total=wn.reduce((s,b)=>s+(b?1:0),0);
    const sub=`${o.scenarioName?o.scenarioName+" · ":""}${t("total_wn")}: ${total} ${t("days_unit")}`;
    warm.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[
        {text:t("warmnight_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
        {text:sub,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
      ],
      legend:{data:[t("daily_min")],top:32,textStyle:{color:AX,fontSize:9},itemWidth:14,itemHeight:8},
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743", textStyle:{color:"#e6edf3",fontSize:11},
        formatter:p=>{ const k=Math.floor((p[0].value[0]-T0)/DAY); let s=dayLab(new Date(T0+k*DAY));
          p.forEach(x=>{ if(x.seriesType==="line" && x.value && x.value[1]!=null) s+=`<br/>${x.marker} ${x.seriesName}: ${(+x.value[1]).toFixed(1)} °C`; });
          return s + `<br/>${t("is_warmnight")}: ${wn[k]?"✓":"—"}`; }},
      grid:[
        {left:44,right:14,top:50,height:128},
        {left:44,right:14,top:188,height:26},
      ],
      xAxis:[timeX(0, false), timeX(1, true)], dataZoom:zoom([0,1], 2*DAY, dayLab, "none"),
      yAxis:[
        {gridIndex:0,type:"value",scale:true,name:"°C",nameTextStyle:{color:AX,fontSize:9},
          axisLine:{show:false},axisLabel:{color:AX,fontSize:9},splitLine:{lineStyle:{color:GRIDLINE}}},
        {gridIndex:1,type:"value",min:0,max:1,axisLine:{show:false},axisLabel:{show:false},splitLine:{show:false},axisTick:{show:false}},
      ],
      series:[
        {name:t("daily_min"),type:"line",xAxisIndex:0,yAxisIndex:0,data:atNoon(o.dmin),showSymbol:false,smooth:true,
          lineStyle:{width:1.2,color:WN_MIN},itemStyle:{color:WN_MIN},
          markLine:{silent:true,symbol:"none",data:[
            {yAxis:T,lineStyle:{color:WN_THR,type:"dashed",width:1},label:{formatter:T+"°C",color:WN_THR,fontSize:9,position:"insideEndTop"}},
          ]}},
        strip(wn, WN_BAR, t("is_warmnight")),
      ],
    }, true);
    warm.resize();
  }


  /* ---- several subzones, one scenario (user 2026-10-24): list = [{name, color, T:[8760], dmax, dmean, dmin, hwFlags}], <= 6 ---- */
  const mzTip=(fmtDay, extra)=>p=>{ const k=Math.floor((p[0].value[0]-T0)/DAY); let s=fmtDay(k);
    p.forEach(x=>{ if(x.seriesType==="line" && x.value && x.value[1]!=null) s+=`<br/>${x.marker} ${x.seriesName}: ${(+x.value[1]).toFixed(1)} °C${extra ? extra(x.seriesIndex, k) : ""}`; });
    return s; };
  /* the day strips, one band per subzone, top to bottom in the order of the window's table */
  const strips=(list, key)=>list.map((z, k)=>strip(z[key], z.color, z.name, list.length-1-k));
  const stripGrid=n=>({left:44, right:14, top:188, height:7*n+4});     // 6 bands still clear of the slider
  const stripY=n=>({gridIndex:1, type:"value", min:0, max:n, axisLine:{show:false}, axisLabel:{show:false}, splitLine:{show:false}, axisTick:{show:false}});
  function renderAnnualMulti(list, scenName){
    ann.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[{text:t("annual_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
             {text:`${scenName} · ${t("mz_sub")(list.length)}`,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
             {text:t("mz_counts_note"),left:"center",top:29,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}}],
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743", textStyle:{color:"#e6edf3",fontSize:11},
        formatter:p=>`${hourLab(new Date(p[0].data[0]))}`+p.map(x=>`<br/>${x.marker} ${x.seriesName}: ${(+x.data[1]).toFixed(1)} °C`).join("")},
      grid:{left:42,right:14,top:56,bottom:46},
      xAxis:timeX(0, true), dataZoom:zoom(0, 12*HR, hourLab),
      yAxis:{type:"value", scale:true, name:"°C", nameTextStyle:{color:AX,fontSize:9},
        axisLine:{show:false}, axisLabel:{color:AX,fontSize:9}, splitLine:{lineStyle:{color:GRIDLINE}}},
      series:list.map((z, k)=>({name:z.name, type:"line", showSymbol:false, data:Array.from(z.T, (v,i)=>[T0+i*HR, v]), sampling:"lttb", large:true,
        lineStyle:{width:0.6,color:z.color}, itemStyle:{color:z.color},
        markLine:k ? undefined : {silent:true, symbol:"none", data:[
          {yAxis:35, lineStyle:{color:"#ef4444",type:"dashed",width:1.2}, label:{formatter:"35°C", color:"#ef4444", fontSize:9,position:"insideEndTop"}},
          {yAxis:EPW.WARM_T, lineStyle:{color:WN_THR,type:"dashed",width:1.2}, label:{formatter:EPW.WARM_T+"°C", color:WN_THR, fontSize:9,position:"insideEndTop"}},
        ]}})),
    }, true);
    ann.resize();
  }
  function renderHeatwaveMulti(list, scenName){
    const n=list.length;
    heat.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[{text:t("heatwave_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
             {text:`${scenName} · ${t("daily_max")}`,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
             {text:t("mz_strip_hw"),left:"center",top:29,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}}],
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743", textStyle:{color:"#e6edf3",fontSize:11},
        formatter:mzTip(k=>dayLab(new Date(T0+k*DAY)), (si, k)=>list[si] && list[si].hwFlags[k] ? ` · ${t("is_heatwave")}` : "")},
      grid:[{left:44,right:14,top:60,height:118}, stripGrid(n)],
      xAxis:[timeX(0, false), timeX(1, true)], dataZoom:zoom([0,1], 2*DAY, dayLab, "none"),
      yAxis:[{gridIndex:0,type:"value",scale:true,name:"°C",nameTextStyle:{color:AX,fontSize:9},
          axisLine:{show:false},axisLabel:{color:AX,fontSize:9},splitLine:{lineStyle:{color:GRIDLINE}}}, stripY(n)],
      series:[...list.map((z, k)=>({name:z.name,type:"line",xAxisIndex:0,yAxisIndex:0,data:atNoon(z.dmax),showSymbol:false,smooth:true,
          lineStyle:{width:1.1,color:z.color},itemStyle:{color:z.color},
          markLine:k ? undefined : {silent:true,symbol:"none",data:[
            {yAxis:35,lineStyle:{color:"#ef4444",type:"dashed",width:1},label:{formatter:"35°C",color:"#ef4444",fontSize:9,position:"insideEndTop"}},
          ]}})), ...strips(list, "hwFlags")],
    }, true);
    heat.resize();
  }
  function renderWarmNightsMulti(list, scenName){
    const n=list.length, T=EPW.WARM_T;
    list.forEach(z=>{ z.wnFlags=z.dmin.map(v=> v!=null && v>T); });
    warm.setOption({
      animationDuration:200, backgroundColor:"transparent", useUTC:true,
      title:[{text:t("warmnight_title"),left:"center",top:0,textStyle:{color:"#cdd9e3",fontSize:12,fontWeight:"600"}},
             {text:`${scenName} · ${t("daily_min")}`,left:"center",top:16,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}},
             {text:t("mz_strip_wn"),left:"center",top:29,textStyle:{color:AX,fontSize:10,fontWeight:"normal"}}],
      tooltip:{trigger:"axis", backgroundColor:"rgba(15,20,25,.95)", borderColor:"#2b3743", textStyle:{color:"#e6edf3",fontSize:11},
        formatter:mzTip(k=>dayLab(new Date(T0+k*DAY)), (si, k)=>list[si] && list[si].wnFlags[k] ? ` · ${t("is_warmnight")}` : "")},
      grid:[{left:44,right:14,top:60,height:118}, stripGrid(n)],
      xAxis:[timeX(0, false), timeX(1, true)], dataZoom:zoom([0,1], 2*DAY, dayLab, "none"),
      yAxis:[{gridIndex:0,type:"value",scale:true,name:"°C",nameTextStyle:{color:AX,fontSize:9},
          axisLine:{show:false},axisLabel:{color:AX,fontSize:9},splitLine:{lineStyle:{color:GRIDLINE}}}, stripY(n)],
      series:[...list.map((z, k)=>({name:z.name,type:"line",xAxisIndex:0,yAxisIndex:0,data:atNoon(z.dmin),showSymbol:false,smooth:true,
          lineStyle:{width:1.1,color:z.color},itemStyle:{color:z.color},
          markLine:k ? undefined : {silent:true,symbol:"none",data:[
            {yAxis:T,lineStyle:{color:WN_THR,type:"dashed",width:1},label:{formatter:T+"°C",color:WN_THR,fontSize:9,position:"insideEndTop"}},
          ]}})), ...strips(list, "wnFlags")],
    }, true);
    warm.resize();
  }
  function clear(){ diu&&diu.clear(); ann&&ann.clear(); heat&&heat.clear(); warm&&warm.clear(); }
  return {init, resize, renderDiurnal, renderAnnual, renderHeatwave, renderWarmNights, clear,
          hwFlags, renderAnnualMulti, renderHeatwaveMulti, renderWarmNightsMulti};
})();
