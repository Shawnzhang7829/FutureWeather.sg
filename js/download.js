/* EPW download: single file (direct link), or several in one zip: streamed by the local server (serve.py /api/epw_zip,
   any number of subzones, user 2026-10-21), else zipped in the browser via JSZip in parts of <= 20 subzones. */
const Downloader = (()=>{
  let PATH = "../outputs/downscaled_epw/{id}/{id}_{scenario}_TCanyon.epw";
  let onStatus = ()=>{};
  function init(epwTemplate, statusCb){ PATH=epwTemplate; if(statusCb) onStatus=statusCb; }

  function url(id, sc){ return PATH.replace(/{id}/g,id).replace("{scenario}",sc); }
  function fname(id, sc){ return `${id}_${sc}_TCanyon.epw`; }

  function saveBlob(blob, name){
    const a=document.createElement("a"); const u=URL.createObjectURL(blob);
    a.href=u; a.download=name; document.body.appendChild(a); a.click();
    setTimeout(()=>{URL.revokeObjectURL(u); a.remove();},1500);
  }
  function saveLink(href, name){
    const a=document.createElement("a"); a.href=href; a.download=name;
    document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),1000);
  }

  /* one file via direct link (same-origin) */
  function one(id, sc){ saveLink(url(id,sc), fname(id,sc)); }

  async function _zip(pairs, zipName, pre=""){
    const zip=new JSZip();
    let done=0;
    for(const [id,sc] of pairs){
      onStatus(`${pre}${t("dl_zip_building")} ${++done}/${pairs.length}`);
      try{
        const r=await fetch(url(id,sc)); if(!r.ok) continue;
        const blob=await r.blob();
        const folder = pairs.length>7 ? zip.folder(id) : zip;
        folder.file(fname(id,sc), blob);
      }catch(e){ /* skip missing */ }
    }
    onStatus(pre+t("dl_zip_building"));
    const out=await zip.generateAsync({type:"blob", compression:"DEFLATE", compressionOptions:{level:1}});
    saveBlob(out, zipName);
    onStatus(t("dl_done"));
    setTimeout(()=>onStatus(""),2500);
  }

  /* all 7 scenarios of one subzone -> one zip */
  async function subzoneAll(id, scenarioKeys){
    if(scenarioKeys.length===1){ one(id, scenarioKeys[0]); return; }
    await _zip(scenarioKeys.map(sc=>[id,sc]), `${id}_EPW.zip`);
  }

  /* is the zip streamed by the local server available (serve.py of 2026-10-21; an old server / static hosting: no) */
  let serverZip=null;
  async function hasServerZip(){
    if(serverZip===null){ try{ const r=await fetch("/api/epw_zip?probe=1", {cache:"no-store"}); serverZip=r.ok && (await r.json()).ok===true; }
      catch(e){ serverZip=false; } }
    return serverZip; }

  /* selected subzones x scenario(s): any number of subzones */
  async function selected(ids, scenarioKeys){
    if(ids.length===0) return;
    if(ids.length===1){ await subzoneAll(ids[0], scenarioKeys); return; }
    const tag = scenarioKeys.length===7 ? "all" : scenarioKeys[0], name=`MSS_downscaled_${ids.length}subzones_${tag}.zip`;
    if(await hasServerZip()){            // the browser saves the stream straight to disk (progress in its download bar)
      saveLink(`/api/epw_zip?ids=${encodeURIComponent(ids.join(","))}&scen=${encodeURIComponent(scenarioKeys.join(","))}&name=${encodeURIComponent(name)}`, name);
      onStatus(t("dl_server")(ids.length, scenarioKeys.length)); setTimeout(()=>onStatus(""),8000); return; }
    const parts=[]; for(let i=0; i<ids.length; i+=20) parts.push(ids.slice(i, i+20));   // in-browser zip is memory-bound
    for(let k=0; k<parts.length; k++){
      const pairs=[]; parts[k].forEach(id=> scenarioKeys.forEach(sc=> pairs.push([id,sc])));
      await _zip(pairs, parts.length>1 ? name.replace(".zip", `_part${k+1}of${parts.length}.zip`) : name, parts.length>1 ? `${k+1}/${parts.length} · ` : "");
    }
  }

  return {init, url, one, subzoneAll, selected};
})();
