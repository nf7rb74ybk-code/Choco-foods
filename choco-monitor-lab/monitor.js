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

function minutesSince(value){const t=Date.parse(value);return Number.isFinite(t)?Math.max(0,(Date.now()-t)/60000):null}
function normalizedStatus(value){return String(value||"").trim().toLowerCase()}
function isFinalStatus(status){return ["giao thành công","giao thanh cong","completed","delivered","hoàn thành","hoan thanh","cancelled","canceled","đã hủy","da huy"].includes(status)}
function isActiveStatus(status){return !isFinalStatus(status)}

async function orderHealthCheck(){
  const select="id,code,status,time,created_at,shipper_id,shipper_name,shipper_phone,total";
  const x=await timedFetch(`${SUPABASE_URL}/rest/v1/orders?select=${encodeURIComponent(select)}&order=created_at.desc&limit=200`,{headers:{apikey:SUPABASE_KEY,Accept:"application/json"}});
  if(!(x.r&&x.r.ok)){
    const detail=x.r?.status===401||x.r?.status===403?`READ bị RLS/Auth chặn • HTTP ${x.r.status}`:`HTTP ${x.r?.status||"failed"} • ${x.error?.message||"unknown"}`;
    checksEl.insertAdjacentHTML("beforeend",card("📦 Order Health","WARN",detail));
    return;
  }
  let orders=[];try{orders=await x.r.json()}catch(e){orders=[]}
  if(!Array.isArray(orders))orders=[];
  let stuck=0,noShipper=0,invalid=0,oldActive=0;
  const now=Date.now();
  for(const o of orders){
    const status=normalizedStatus(o.status);
    if(!status)invalid++;
    const age=minutesSince(o.created_at||o.time);
    const active=isActiveStatus(status);
    if(active && age!==null && age>120)oldActive++;
    if(active && !o.shipper_id && age!==null && age>30)noShipper++;
    if(active && age!==null && age>180)stuck++;
    if(o.total!==null && o.total!==undefined && Number.isNaN(Number(o.total)))invalid++;
  }
  const problems=[];
  if(stuck>0)problems.push(`${stuck} đơn active > 180 phút`);
  if(noShipper>0)problems.push(`${noShipper} đơn active > 30 phút chưa có shipper`);
  if(oldActive>0 && !stuck)problems.push(`${oldActive} đơn active > 120 phút`);
  if(invalid>0)problems.push(`${invalid} đơn có dữ liệu trạng thái/tổng tiền bất thường`);
  const status=problems.length?"WARN":"OK";
  if(stuck>0)incidents.push(`Orders: phát hiện ${stuck} đơn có dấu hiệu bị kẹt > 180 phút`);
  if(noShipper>0)incidents.push(`Orders: ${noShipper} đơn active quá 30 phút chưa được gán shipper`);
  if(invalid>0)incidents.push(`Orders: ${invalid} bản ghi có dữ liệu cần kiểm tra`);
  checksEl.insertAdjacentHTML("beforeend",card("📦 Order Health",status,`${orders.length} đơn gần nhất • ${problems.length?problems.join(" • "):"Không thấy bất thường theo rule hiện tại"} • ${x.ms} ms`));
  const summary=document.getElementById("orderSummary");
  if(summary)summary.innerHTML=`<div class="metric"><b>${orders.length}</b><span>đơn đã quét</span></div><div class="metric"><b>${stuck}</b><span>đơn >180 phút</span></div><div class="metric"><b>${noShipper}</b><span>chưa có shipper >30 phút</span></div><div class="metric"><b>${invalid}</b><span>dữ liệu bất thường</span></div>`;
}

function renderIncidents(){if(!incidents.length){incidentsEl.innerHTML='<div class="empty">🟢 Không phát hiện incident trong lần kiểm tra này.</div>';overallEl.textContent="HEALTHY";overallEl.className="badge green";return}incidentsEl.innerHTML=incidents.map(x=>`<div class="incident">🚨 ${esc(x)}</div>`).join("");overallEl.textContent=`${incidents.length} VẤN ĐỀ`;overallEl.className="badge red"}
async function run(){checksEl.innerHTML="";incidents=[];overallEl.textContent="ĐANG KIỂM TRA";overallEl.className="badge neutral";incidentsEl.innerHTML='<div class="empty">⏳ Đang phân tích...</div>';await supabaseCheck();await websiteChecks();await tableChecks();await orderHealthCheck();renderIncidents()}
document.getElementById("refresh").addEventListener("click",run);run();
