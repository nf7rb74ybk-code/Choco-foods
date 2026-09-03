/* CHOCO MONITOR LAB — Step 11: Incident Analytics
 * Read-only. Uses browser-local Incident History from Step 10.
 */
(() => {
  const KEY = 'choco_monitor_lab_incident_history_v1';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } };
  const minutes = e => Math.max(0, Math.floor((new Date(e.clearedAt||e.lastSeen||e.firstSeen)-new Date(e.firstSeen))/60000));
  function render(){
    const root=document.getElementById('incidentAnalytics'); if(!root)return;
    const data=load();
    if(!data.length){root.innerHTML='<div class="empty">Chưa có dữ liệu để phân tích. Hãy chạy Monitor vài lần để tạo lịch sử.</div>';return;}
    const bySeverity={},bySource={},byHour={}; let totalMin=0, cleared=0;
    data.forEach(e=>{bySeverity[e.severity]=(bySeverity[e.severity]||0)+1;bySource[e.source]=(bySource[e.source]||0)+1;const h=new Date(e.firstSeen).getHours();byHour[h]=(byHour[h]||0)+1;if(e.state==='CLEARED'){cleared++;totalMin+=minutes(e);}});
    const avg=cleared?Math.round(totalMin/cleared):0;
    const top=Object.entries(bySource).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const hours=Object.entries(byHour).sort((a,b)=>b[1]-a[1]).slice(0,5);
    root.innerHTML=`<div class="metrics"><div class="metric"><b>${data.length}</b><span>tổng incident</span></div><div class="metric"><b>${cleared}</b><span>đã cleared</span></div><div class="metric"><b>${avg}m</b><span>duration TB (đã cleared)</span></div><div class="metric"><b>${top[0]?esc(top[0][0]):'—'}</b><span>source nhiều nhất</span></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:14px">
        <div><h3>Severity</h3>${Object.entries(bySeverity).map(([k,v])=>`<div>${esc(k)}: <b>${v}</b></div>`).join('')}</div>
        <div><h3>Top source</h3>${top.map(([k,v],i)=>`<div>#${i+1} ${esc(k)}: <b>${v}</b></div>`).join('')}</div>
        <div><h3>Giờ hay phát sinh</h3>${hours.map(([k,v])=>`<div>${esc(k)}:00: <b>${v}</b></div>`).join('')}</div>
      </div><p class="muted" style="margin-top:12px">Analytics hiện chỉ dùng lịch sử localStorage của Step 10, không đọc thêm và không ghi Supabase/production.</p>`;
  }
  function init(){render();const r=document.getElementById('refresh');if(r)r.addEventListener('click',()=>setTimeout(render,1500));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
