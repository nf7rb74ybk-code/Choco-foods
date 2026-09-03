const SUPABASE_URL="https://guwdswqaqnhzqapflvey.supabase.co";
const SUPABASE_KEY="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
const targets=[
  ["Customer","../index.html"],
  ["Admin","../admin.html"],
  ["Shipper","../shipper.html"],
  ["POS","../pos.html"]
];
const dbTables=["orders","profiles","subscriptions","shipper_push_subscriptions","push_delivery_logs","pos_orders","admin_status_push_queue","admin_push_subscriptions","admin_push_events","native_push_devices"];
const checksEl=document.getElementById("checks"),incidentsEl=document.getElementById("incidents"),overallEl=document.getElementById("overall");
let incidents=[];
function esc(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}
function card(name,status,detail){const cls=status==="OK"?"green":status==="WARN"?"yellow":"red";return `<article class="card"><div class="card-head"><div class="name">${esc(name)}</div><span class="badge ${cls}">${status}</span></div><div class="detail">${esc(detail)}</div></article>`}
async function timedFetch(url,options={}){const t=performance.now();try{const r=await fetch(url,{cache:"no-store",...options});return {r,ms:Math.round(performance.now()-t)}}catch(e){return {error:e,ms:Math.round(performance.now()-t)}}}
async function websiteChecks(){for(const [name,path] of targets){const x=await timedFetch(path,{method:"GET"});if(x.r&&x.r.ok){checksEl.insertAdjacentHTML("beforeend",card("🌐 "+name,"OK",`HTTP ${x.r.status} • ${x.ms} ms`))}else{incidents.push(`${name}: website không phản hồi (${x.r?.status||x.error?.message||"unknown"})`);checksEl.insertAdjacentHTML("beforeend",card("🌐 "+name,"ERROR",`HTTP ${x.r?.status||"failed"} • ${x.ms} ms`))}}}
async function supabaseCheck(){const x=await timedFetch(SUPABASE_URL+"/auth/v1/settings",{headers:{apikey:SUPABASE_KEY,Accept:"application/json"}});if(x.r&&x.r.ok)checksEl.insertAdjacentHTML("beforeend",card("🗄️ Supabase API","OK",`HTTP ${x.r.status} • ${x.ms} ms`));else{incidents.push(`Supabase API: health check failed (${x.r?.status||x.error?.message||"unknown"})`);checksEl.insertAdjacentHTML("beforeend",card("🗄️ Supabase API","ERROR",`HTTP ${x.r?.status||"failed"} • ${x.ms} ms`))}}
async function tableChecks(){for(const table of dbTables){const x=await timedFetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,{headers:{apikey:SUPABASE_KEY,Accept:"application/json"}});if(x.r&&x.r.ok){let rows=[];try{rows=await x.r.json()}catch{}checksEl.insertAdjacentHTML("beforeend",card("📊 "+table,"OK",`READ-ONLY • ${Array.isArray(rows)?"readable":"response received"} • ${x.ms} ms`))}else if(x.r&&[401,403].includes(x.r.status)){checksEl.insertAdjacentHTML("beforeend",card("📊 "+table,"WARN",`READ bị RLS/Auth chặn • HTTP ${x.r.status} • ${x.ms} ms`))}else{incidents.push(`${table}: database probe failed (${x.r?.status||x.error?.message||"unknown"})`);checksEl.insertAdjacentHTML("beforeend",card("📊 "+table,"ERROR",`HTTP ${x.r?.status||"failed"} • ${x.ms} ms`))}}}
function renderIncidents(){if(!incidents.length){incidentsEl.innerHTML='<div class="empty">🟢 Không phát hiện incident trong lần kiểm tra này.</div>';overallEl.textContent="HEALTHY";overallEl.className="badge green";return}incidentsEl.innerHTML=incidents.map(x=>`<div class="incident">🚨 ${esc(x)}</div>`).join("");overallEl.textContent=`${incidents.length} VẤN ĐỀ`;overallEl.className="badge red"}
async function run(){checksEl.innerHTML="";incidents=[];overallEl.textContent="ĐANG KIỂM TRA";overallEl.className="badge neutral";incidentsEl.innerHTML='<div class="empty">⏳ Đang phân tích...</div>';await supabaseCheck();await websiteChecks();await tableChecks();renderIncidents()}
document.getElementById("refresh").addEventListener("click",run);run();
