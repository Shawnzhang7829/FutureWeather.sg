/* Per-subzone modal: EPW download cards + morphology/downscaling figures. */
const SubzoneModal = (()=>{
  let M, manifest, scenarios, onScenarioPick, cur=null;
  function init(man, cb){
    manifest=man; scenarios=man.scenarios; onScenarioPick=cb;
    M=document.getElementById("modal-subzone");
    M.querySelectorAll(".sz-tabs button").forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
    // lightbox
    M.querySelectorAll(".fig.zoomable").forEach(img=>img.onclick=()=>{
      if(img.src && window.openLightbox) window.openLightbox(img.src);
    });
  }
  function setTab(name){
    M.querySelectorAll(".sz-tabs button").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
    M.querySelectorAll(".sz-tabpane").forEach(p=>p.classList.toggle("hidden",p.dataset.pane!==name));
    if(typeof Charts!=="undefined" && Charts.resize) Charts.resize();
    if(name==="figures") drawDownscale();
  }
  /* Pre/post ΔT, AH, LE: drawn live from _npz_16; the static step3 PNG is only a fallback */
  function drawDownscale(){
    const el=document.getElementById("sz-ds-chart"), st=document.getElementById("sz-ds-status"),
          img=M.querySelector('[data-fig="step3"]');
    if(!el || !cur || typeof DownscaleChart==="undefined") return;
    if(el.dataset.forId===cur.id){ DownscaleChart.resize(el); return; }
    const id=cur.id;
    DownscaleChart.render(el, st, cur, manifest).then(ok=>{
      if(!cur || cur.id!==id) return;
      el.classList.toggle("hidden", !ok);
      img.classList.toggle("hidden", ok);
      if(!ok) st.textContent=t("ds_fallback");
    });
  }
  function currentId(){ return cur && cur.id; }
  function open(props, tab){
    cur=props;
    const dsEl=document.getElementById("sz-ds-chart");
    if(dsEl){ dsEl.dataset.forId=""; document.getElementById("sz-ds-status").textContent=""; }
    document.getElementById("sz-title").textContent = `${props.name_disp} · ${props.id.split("_")[0]}`;
    const catKey=props.category, catTxt=catKey? (t("cat_label")[catKey]||catKey):"—";
    document.getElementById("sz-meta").innerHTML =
      `<span class="chip"><b>${props.planarea||"—"}</b></span>`+
      `<span class="chip">${props.region||"—"}</span>`+
      `<span class="chip cat">${catTxt}</span>`;
    // download grid
    const grid=document.getElementById("sz-dl-grid");
    grid.innerHTML="";
    scenarios.forEach(s=>{
      const card=document.createElement("div"); card.className="dl-card";
      const per=t("period_label")[s.period]||s.period, ssp=t("ssp_label")[s.ssp]||s.ssp;
      card.innerHTML=`<div class="sc-name">${ssp}</div><div class="sc-meta">${per}</div>`;
      const b=document.createElement("button"); b.className="btn primary sm"; b.textContent=t("dl_one");
      b.onclick=()=>Downloader.one(props.id, s.key);
      card.appendChild(b);
      // clicking a card (not the button) also loads its charts
      card.onclick=(e)=>{ if(e.target!==b) onScenarioPick && onScenarioPick(props.id, s.key); };
      grid.appendChild(card);
    });
    const bar=document.createElement("div"); bar.className="dl-allbar";
    const allBtn=document.createElement("button"); allBtn.className="btn primary"; allBtn.textContent=t("dl_all_sc");
    allBtn.onclick=()=>Downloader.subzoneAll(props.id, scenarios.map(s=>s.key));
    bar.appendChild(allBtn); grid.appendChild(bar);
    // figures
    const fig=k=>manifest.paths[k].replace(/{id}/g,props.id);
    M.querySelector('[data-fig="canyon"]').src=fig("canyon");
    M.querySelector('[data-fig="step2"]').src=fig("step2");
    M.querySelector('[data-fig="step3"]').src=fig("step3");
    setTab(tab||"download");
    M.classList.remove("hidden");
  }
  return {init, open, setTab, currentId};
})();
