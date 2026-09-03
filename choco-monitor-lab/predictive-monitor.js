(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const nums = id => [...($(id)?.querySelectorAll('.metric b')||[])].map(x => { const m=x.textContent.match(/\d+(?:\.\d+)?/); return m?Number(m[0]):0; });
  function run(){
    const o=nums('orderSummary'), p=nums('pushSummary'), s=nums('shipperSummary');
    const risks=[];
    if(o[1]>0) risks.push({level:'HIGH',text:`Có ${o[1]} đơn >180 phút — nguy cơ tồn đọng kéo dài.`});
    if(o[2]>0) risks.push({level:'HIGH',text:`Có ${o[2]} đơn chưa có shipper >30 phút — nguy cơ trễ giao.`});
    if(p[2]>20) risks.push({level:p[2]>50?'HIGH':'MEDIUM',text:`Push failure ${p[2]}% — nguy cơ cảnh báo đơn không tới shipper/admin.`});
    if(s[3]>0) risks.push({level:'MEDIUM',text:`Có ${s[3]} GPS stale — nguy cơ theo dõi vị trí không chính xác.`});
    if(!risks.length) risks.push({level:'LOW',text:'Chưa thấy tín hiệu đủ mạnh để dự đoán sự cố sắp xảy ra.'});
    const rank={HIGH:0,MEDIUM:1,LOW:2}; risks.sort((a,b)=>rank[a.level]-rank[b.level]);
    const root=$('predictiveMonitor'); if(!root)return;
    root.innerHTML=`<div class="metrics"><div class="metric"><b>${risks.filter(x=>x.level==='HIGH').length}</b><span>rủi ro cao</span></div><div class="metric"><b>${risks.filter(x=>x.level==='MEDIUM').length}</b><span>rủi ro vừa</span></div><div class="metric"><b>${risks.filter(x=>x.level==='LOW').length}</b><span>rủi ro thấp</span></div></div><ol>${risks.map(r=>`<li><strong>${esc(r.level)}</strong> — ${esc(r.text)}</li>`).join('')}</ol><p class="muted">Dự báo dựa trên tín hiệu hiện tại của Monitor, không phải mô hình ML và không đảm bảo sự cố sẽ xảy ra.</p>`;
  }
  window.addEventListener('load',()=>setTimeout(run,1600));
  $('refresh')?.addEventListener('click',()=>setTimeout(run,1600));
})();
