const IM_SUPABASE_URL="https://guwdswqaqnhzqapflvey.supabase.co";
const IM_SUPABASE_KEY="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
const imPanel=document.getElementById("incidentEngine");
async function imRead(table,select,order="created_at.desc",limit=200){try{const u=`${IM_SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`;const r=await fetch(u,{cache:"no-store",headers:{apikey:IM_SUPABASE_KEY,Accept:"application/json"}});if(!r.ok)return {rows:null,status:r.status};const j=await r.json();return {rows:Array.isArray(j)?j:[],status:r.status}}catch(e){return {rows:null,error:e.message}}}
function imAge(v){const t=Date.parse(v);return Number.isFinite(t)?Math.max(0,(Date.now()-t)/60000):null}
function imStatus(v){return String(v||"").trim().toLowerCase()}
function imFinal(v){return ["giao thành công","giao thanh cong","completed","delivered","hoàn thành","hoan thanh","cancelled","canceled","đã hủy","da huy"].includes(v)}
function imAdd(map,key,severity,title,detail,source){if(!map.has(key))map.set(key,{severity,title,detail,source})}
function imRank(s){return s==="CRITICAL"?3:s==="WARN"?2:1}
async function runIncidentEngine(){
  if(!imPanel)return;
  imPanel.innerHTML='<div class="empty">⏳ Đang phân loại và gom incident...</div>';
  const [orders,push,profiles]=await Promise.all([
    imRead("orders","id,code,status,created_at,shipper_id,shipper_name,total","created_at.desc",200),
    imRead("push_delivery_logs","id,created_at,order_id,code,http_status,ok,error","created_at.desc",200),
    imRead("profiles","id,role,last_seen,is_online,latitude,longitude","last_seen.desc",100)
  ]);
  const map=new Map(), now=Date.now(), day=now-86400000;
  if(orders.rows===null)imAdd(map,"orders-read","WARN","Orders source unavailable","Monitor không đọc được orders (RLS/Auth hoặc API lỗi).","orders");
  if(push.rows===null)imAdd(map,"push-read","WARN","Push source unavailable","Monitor không đọc được push_delivery_logs.","push");
  if(profiles.rows===null)imAdd(map,"profiles-read","WARN","Profiles source unavailable","Monitor không đọc được profiles.","profiles");
  if(orders.rows){for(const o of orders.rows){const age=imAge(o.created_at),s=imStatus(o.status),active=!imFinal(s);if(active&&age!==null&&age>180)imAdd(map,`order-stuck-${o.id}`,"CRITICAL","Đơn có dấu hiệu bị kẹt",`${o.code||o.id} active > 180 phút • status: ${o.status||"trống"}.`,"orders");if(active&&!o.shipper_id&&age!==null&&age>30)imAdd(map,`order-unassigned-${o.id}`,"WARN","Đơn chưa được gán shipper",`${o.code||o.id} active > 30 phút nhưng chưa có shipper.`,"orders");if(!s)imAdd(map,`order-status-${o.id}`,"WARN","Đơn thiếu trạng thái",`${o.code||o.id} không có status.`,"orders")}}
  if(push.rows){const recent=push.rows.filter(x=>{const t=Date.parse(x.created_at);return Number.isFinite(t)&&t>=day}),fails=recent.filter(x=>x.ok===false||String(x.error||"").trim()!=="");if(recent.length){const rate=fails.length/recent.length;if(rate>0.5)imAdd(map,"push-mass-fail","CRITICAL","Push delivery lỗi hàng loạt",`${fails.length}/${recent.length} delivery lỗi trong 24h (${Math.round(rate*100)}%).`,"push");else if(rate>0.2)imAdd(map,"push-high-fail","WARN","Tỷ lệ Push lỗi cao",`${fails.length}/${recent.length} delivery lỗi trong 24h (${Math.round(rate*100)}%).`,"push")}}
  if(profiles.rows){const sh=profiles.rows.filter(p=>imStatus(p.role)==="shipper"),online=sh.filter(p=>p.is_online===true),stale=online.filter(p=>{const a=imAge(p.last_seen);return a===null||a>10});if(stale.length)imAdd(map,"shipper-stale","WARN","Shipper online nhưng stale",`${stale.length} shipper đang is_online=true nhưng last_seen > 10 phút hoặc thiếu last_seen.`,"shipper");}
  // Correlation: a high push failure rate plus active orders creates a higher-priority operational signal.
  const hasPush=[...map.values()].some(x=>x.source==="push"), activeCount=orders.rows?orders.rows.filter(o=>!imFinal(imStatus(o.status))).length:0;
  if(hasPush&&activeCount>0)imAdd(map,"push-order-correlation","CRITICAL","Push + Orders có liên quan",`Có lỗi Push đồng thời còn ${activeCount} đơn active. Ưu tiên kiểm tra luồng thông báo trước khi kết luận đơn bị kẹt.`,`correlation`);
  const items=[...map.values()].sort((a,b)=>imRank(b.severity)-imRank(a.severity));
  const counts={CRITICAL:0,WARN:0,INFO:0};items.forEach(x=>counts[x.severity]++);
  const cls=s=>s==="CRITICAL"?"red":s==="WARN"?"yellow":"green";
  imPanel.innerHTML=`<div class="metrics"><div class="metric"><b>${items.length}</b><span>incident duy nhất</span></div><div class="metric"><b>${counts.CRITICAL}</b><span>CRITICAL</span></div><div class="metric"><b>${counts.WARN}</b><span>WARN</span></div><div class="metric"><b>${activeCount}</b><span>đơn active</span></div></div>`+(items.length?items.map(x=>`<div class="incident"><span class="badge ${cls(x.severity)}">${x.severity}</span> <b>${x.title}</b><div class="detail">${x.detail} • nguồn: ${x.source}</div></div>`).join(""): '<div class="empty">🟢 Không có incident mới theo rule hiện tại.</div>');
}
runIncidentEngine();
