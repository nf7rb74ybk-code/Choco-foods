const RC_SUPABASE_URL="https://guwdswqaqnhzqapflvey.supabase.co";
const RC_SUPABASE_KEY="sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9";
const rcPanel=document.getElementById("rootCauseEngine");
async function rcRead(table,select,order="created_at.desc",limit=200){try{const u=`${RC_SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(order)}&limit=${limit}`;const r=await fetch(u,{cache:"no-store",headers:{apikey:RC_SUPABASE_KEY,Accept:"application/json"}});if(!r.ok)return null;const j=await r.json();return Array.isArray(j)?j:[]}catch(e){return null}}
function rcAge(v){const t=Date.parse(v);return Number.isFinite(t)?Math.max(0,(Date.now()-t)/60000):null}
function rcStatus(v){return String(v||"").trim().toLowerCase()}
function rcFinal(v){return ["giao thành công","giao thanh cong","completed","delivered","hoàn thành","hoan thanh","cancelled","canceled","đã hủy","da huy"].includes(v)}
async function runRootCauseEngine(){
 if(!rcPanel)return;rcPanel.innerHTML='<div class="empty">⏳ Đang phân tích nguyên nhân gốc...</div>';
 const [orders,push,profiles]=await Promise.all([rcRead("orders","id,code,status,created_at,shipper_id","created_at.desc",200),rcRead("push_delivery_logs","id,created_at,order_id,code,ok,error","created_at.desc",200),rcRead("profiles","id,role,last_seen,is_online","last_seen.desc",100)]);
 const causes=[];
 const active=orders?orders.filter(o=>!rcFinal(rcStatus(o.status))):[];
 const stuck=active.filter(o=>{const a=rcAge(o.created_at);return a!==null&&a>180});
 const unassigned=active.filter(o=>!o.shipper_id&&((rcAge(o.created_at)||0)>30));
 const recentPush=push?push.filter(x=>{const t=Date.parse(x.created_at);return Number.isFinite(t)&&t>=Date.now()-86400000}):[];
 const pushFails=recentPush.filter(x=>x.ok===false||String(x.error||"").trim()!=="");
 const pushRate=recentPush.length?pushFails.length/recentPush.length:0;
 const sh=profiles?profiles.filter(p=>rcStatus(p.role)==="shipper"):[];
 const stale=sh.filter(p=>p.is_online===true&&(rcAge(p.last_seen)===null||rcAge(p.last_seen)>10));
 if(pushRate>0.5&&active.length>0)causes.push({rank:1,severity:"CRITICAL",cause:"Push delivery có khả năng là nguyên nhân ưu tiên",evidence:`${pushFails.length}/${recentPush.length} Push lỗi trong 24h và còn ${active.length} đơn active.`,action:"Kiểm tra push_delivery_logs, subscription và Edge Function Push trước."});
 if(stuck.length>0&&pushRate<=0.5)causes.push({rank:1,severity:"CRITICAL",cause:"Đơn có dấu hiệu kẹt trong luồng xử lý",evidence:`${stuck.length} đơn active >180 phút.`,action:"Kiểm tra status transition, shipper assignment và xử lý đơn."});
 if(unassigned.length>0&&stale.length>0)causes.push({rank:2,severity:"WARN",cause:"Khả năng vấn đề phân công/shipper",evidence:`${unassigned.length} đơn chưa có shipper >30 phút; ${stale.length} shipper online stale.`,action:"Kiểm tra last_seen/GPS và logic nhận/gán đơn."});
 if(pushRate>0.2&&pushRate<=0.5)causes.push({rank:2,severity:"WARN",cause:"Push có vấn đề nhưng chưa đủ bằng chứng là nguyên nhân gốc",evidence:`Tỷ lệ Push lỗi 24h: ${Math.round(pushRate*100)}%.`,action:"Kiểm tra subscription và delivery error trước khi kết luận."});
 if(!causes.length)causes.push({rank:3,severity:"INFO",cause:"Chưa đủ bằng chứng để xác định nguyên nhân gốc",evidence:"Các rule hiện tại không tạo được tương quan đủ mạnh.",action:"Tiếp tục theo dõi và thu thập telemetry."});
 causes.sort((a,b)=>a.rank-b.rank);const cls=s=>s==="CRITICAL"?"red":s==="WARN"?"yellow":"green";
 rcPanel.innerHTML=`<div class="metrics"><div class="metric"><b>${causes.length}</b><span>giả thuyết nguyên nhân</span></div><div class="metric"><b>${stuck.length}</b><span>đơn kẹt</span></div><div class="metric"><b>${Math.round(pushRate*100)}%</b><span>Push lỗi 24h</span></div><div class="metric"><b>${stale.length}</b><span>shipper stale</span></div></div>`+causes.map((x,i)=>`<div class="incident"><span class="badge ${cls(x.severity)}">#${i+1} ${x.severity}</span> <b>${x.cause}</b><div class="detail"><b>Bằng chứng:</b> ${x.evidence}</div><div class="detail"><b>Đề xuất:</b> ${x.action}</div></div>`).join("")+`<div class="empty">🛡️ Step 9 LAB: chỉ phân tích/đề xuất. Không tự sửa, không gửi Push, không ghi DB.</div>`;
}
runRootCauseEngine();
