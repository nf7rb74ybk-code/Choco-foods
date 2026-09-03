const AA_SUPABASE_URL="https://guwdswqaqnhzqapflvey.supabase.co";
const AA_SUPABASE_KEY="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
const aaPanel=document.getElementById("adminAlertEngine");

async function aaRead(table,select,order="created_at.desc",limit=200){
  try{
    const u=`${AA_SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`;
    const r=await fetch(u,{cache:"no-store",headers:{apikey:AA_SUPABASE_KEY,Accept:"application/json"}});
    if(!r.ok)return {rows:null,status:r.status};
    const j=await r.json();
    return {rows:Array.isArray(j)?j:[],status:r.status};
  }catch(e){return {rows:null,error:e.message}}
}
function aaAge(v){const t=Date.parse(v);return Number.isFinite(t)?Math.max(0,(Date.now()-t)/60000):null}
function aaStatus(v){return String(v||"").trim().toLowerCase()}
function aaFinal(v){return ["giao thành công","giao thanh cong","completed","delivered","hoàn thành","hoan thanh","cancelled","canceled","đã hủy","da huy"].includes(v)}
async function runAdminAlertEngine(){
  if(!aaPanel)return;
  aaPanel.innerHTML='<div class="empty">⏳ Đang mô phỏng Admin Alert...</div>';
  const [orders,push,profiles]=await Promise.all([
    aaRead("orders","id,code,status,created_at,shipper_id,total","created_at.desc",200),
    aaRead("push_delivery_logs","id,created_at,order_id,code,http_status,ok,error","created_at.desc",200),
    aaRead("profiles","id,role,last_seen,is_online","last_seen.desc",100)
  ]);
  const alerts=[];
  if(orders.rows===null)alerts.push({severity:"WARN",title:"Orders source unavailable",detail:"Không thể đọc orders."});
  if(push.rows===null)alerts.push({severity:"WARN",title:"Push source unavailable",detail:"Không thể đọc push_delivery_logs."});
  if(profiles.rows===null)alerts.push({severity:"WARN",title:"Profiles source unavailable",detail:"Không thể đọc profiles."});
  if(orders.rows){
    for(const o of orders.rows){const age=aaAge(o.created_at),s=aaStatus(o.status),active=!aaFinal(s);if(active&&age!==null&&age>180)alerts.push({severity:"CRITICAL",title:"Đơn có dấu hiệu bị kẹt",detail:`${o.code||o.id} active >180 phút.`});else if(active&&!o.shipper_id&&age!==null&&age>30)alerts.push({severity:"WARN",title:"Đơn chưa được gán shipper",detail:`${o.code||o.id} active >30 phút.`});}
  }
  if(push.rows){const day=Date.now()-86400000,recent=push.rows.filter(x=>Date.parse(x.created_at)>=day),fails=recent.filter(x=>x.ok===false||String(x.error||"").trim()!=="");if(recent.length){const rate=fails.length/recent.length;if(rate>0.5)alerts.push({severity:"CRITICAL",title:"Push delivery lỗi hàng loạt",detail:`${fails.length}/${recent.length} lỗi trong 24h (${Math.round(rate*100)}%).`});else if(rate>0.2)alerts.push({severity:"WARN",title:"Tỷ lệ Push lỗi cao",detail:`${fails.length}/${recent.length} lỗi trong 24h (${Math.round(rate*100)}%).`});}}
  if(profiles.rows){const sh=profiles.rows.filter(p=>aaStatus(p.role)==="shipper"),stale=sh.filter(p=>p.is_online===true&&(aaAge(p.last_seen)===null||aaAge(p.last_seen)>10));if(stale.length)alerts.push({severity:"WARN",title:"Shipper online nhưng stale",detail:`${stale.length} shipper có last_seen >10 phút hoặc thiếu last_seen.`});}
  const critical=alerts.filter(x=>x.severity==="CRITICAL").length,warn=alerts.filter(x=>x.severity==="WARN").length;
  const top=alerts[0];
  const dedupe=top?`ADMIN:${top.severity}:${top.title.replace(/\s+/g,"-").toLowerCase()}`:"ADMIN:NO-ALERT";
  const message=top?`[${top.severity}] ${top.title} — ${top.detail}`:"Không có cảnh báo cần gửi.";
  aaPanel.innerHTML=`<div class="metrics"><div class="metric"><b>${alerts.length}</b><span>alert preview</span></div><div class="metric"><b>${critical}</b><span>CRITICAL</span></div><div class="metric"><b>${warn}</b><span>WARN</span></div><div class="metric"><b>TEST</b><span>dispatch mode</span></div></div><div class="incident"><span class="badge ${top?"red":"green"}">${top?"ALERT PREVIEW":"NO ALERT"}</span> <b>${top?"Có cảnh báo cần Admin xử lý":"Hệ thống chưa tạo alert"}</b><div class="detail"><b>Message:</b> ${message}</div><div class="detail"><b>Dedupe key:</b> ${dedupe}</div><div class="detail"><b>Cooldown:</b> mô phỏng • chưa ghi DB • chưa gửi Push</div></div><div class="empty">🛡️ Step 8 LAB: chỉ preview. Không gọi admin push, không ghi queue/event/subscription và không tác động production.</div>`;
}
runAdminAlertEngine();
