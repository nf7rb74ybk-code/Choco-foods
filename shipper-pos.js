/* CHOCO SHIP - Shipper order lifecycle add-on
   Keeps Web Push untouched. Adds: Nhận đơn -> Đang lấy hàng -> Đang giao -> Đã giao.
*/
'use strict';
(function () {
  const SB='https://guwdswqaqnhzqapflvey.supabase.co';
  const KEY='sb_publishable_AfTScx4Qcwmk3dk8pCo9Fg_kZgglof9';
  const TOKEN=localStorage.getItem('choco_access_token')||'';
  const UID=localStorage.getItem('choco_user_id')||'';
  const ROLE=localStorage.getItem('choco_role')||'';
  if(!TOKEN||!UID||ROLE!=='shipper') return;
  const esc=x=>String(x??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  async function api(path,options={}){return fetch(SB+path,{...options,headers:{apikey:KEY,Authorization:'Bearer '+TOKEN,Accept:'application/json','Content-Type':'application/json',...(options.headers||{})}})}
  async function findOrder(code){const r=await api('/rest/v1/orders?code=eq.'+encodeURIComponent(code)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&select=id,code,status,shipper_id');const rows=await r.json();if(!r.ok||!rows[0])throw Error('Không tìm thấy đơn hoặc đơn không thuộc shipper này.');return rows[0]}
  async function setStatus(code,status,button){button.disabled=true;button.textContent='⏳ ĐANG CẬP NHẬT...';try{const o=await findOrder(code);const allowed={"Đã nhận":['Đang lấy hàng'],"Đang lấy hàng":['Đang giao'],"Đang giao":['Đã giao']}[o.status]||[];if(!allowed.includes(status))throw Error('Trạng thái hiện tại không cho phép chuyển sang '+status+'.');
    // PostgREST requires an operator in every filter. The previous code sent `status=Đã nhận`,
    // which caused PGRST100 when starting pickup. Keep the operator separate from the value.
    const path='/rest/v1/orders?id=eq.'+encodeURIComponent(o.id)+'&shipper_id=eq.'+encodeURIComponent(UID)+'&status=eq.'+encodeURIComponent(o.status);
    const r=await api(path,{method:'PATCH',body:JSON.stringify({status})});
    if(!r.ok)throw Error(await r.text());
    await loadOrders();
  }catch(e){alert('❌ Không cập nhật được trạng thái:\n'+e.message);button.disabled=false;button.textContent='↻ THỬ LẠI'}}
  function addLifecycleButtons(){document.querySelectorAll('.order').forEach(card=>{if(card.dataset.lifecycle==='1')return;const first=card.querySelector('b');if(!first)return;const code=(first.textContent||'').trim();if(!/^CS/i.test(code))return;const text=card.innerText||'';let status='';['Chờ xác nhận','Đã nhận','Đang lấy hàng','Đang giao','Đã giao','Hoàn thành','Đã hủy'].some(s=>{if(text.includes(s)){status=s;return true}return false});if(!status||status==='Chờ xác nhận'||status==='Hoàn thành'||status==='Đã hủy')return;const wrap=document.createElement('div');wrap.style.cssText='margin-top:9px';let next=null,label=null,cls='';if(status==='Đã nhận'){next='Đang lấy hàng';label='🛵 BẮT ĐẦU LẤY HÀNG';cls='action'}else if(status==='Đang lấy hàng'){next='Đang giao';label='📦 ĐÃ LẤY HÀNG → ĐANG GIAO';cls='action'}else if(status==='Đang giao'){next='Đã giao';label='🏁 ĐÃ GIAO CHO KHÁCH';cls='action'}else if(status==='Đã giao'){const info=document.createElement('div');info.className='box';info.style.cssText='margin-top:9px;color:#166534;background:#ecfdf5';info.innerHTML='✅ <b>Đã báo giao hàng.</b><br>⏳ Chờ Admin xác nhận <b>Hoàn thành</b>.';wrap.appendChild(info);card.appendChild(wrap);card.dataset.lifecycle='1';return}if(next){const btn=document.createElement('button');btn.className=cls;btn.textContent=label;btn.onclick=()=>setStatus(code,next,btn);wrap.appendChild(btn);card.appendChild(wrap);card.dataset.lifecycle='1'}})}
  const observer=new MutationObserver(addLifecycleButtons);observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(addLifecycleButtons,500);setInterval(addLifecycleButtons,2000);
})();