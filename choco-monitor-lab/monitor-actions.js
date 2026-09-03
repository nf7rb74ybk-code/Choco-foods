(() => {
  'use strict';
  const $=id=>document.getElementById(id); const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function run(){
    const score=($('healthScore')?.textContent.match(/(\d+)\/100/)||[])[1];
    const p=($('pushDetail')?.textContent||''); const o=($('orderSummary')?.textContent||''); const s=($('shipperDetail')?.textContent||'');
    const actions=[];
    if(/CRITICAL|> 50%|>50%/i.test(p)) actions.push('Ưu tiên kiểm tra Push delivery và subscription trước khi xử lý lỗi đơn.');
    if(/>180|quá 180|180 phút/i.test(o)) actions.push('Kiểm tra các đơn tồn đọng >180 phút và luồng gán shipper.');
    if(/stale|thiếu GPS|GPS/i.test(s)) actions.push('Kiểm tra trạng thái online và GPS của shipper đang stale.');
    if(score && Number(score)<60) actions.push('Mức độ tổng thể CRITICAL: không triển khai thay đổi tự động; cần Admin kiểm tra thủ công.');
    if(!actions.length) actions.push('Chưa có hành động ưu tiên từ tín hiệu hiện tại. Tiếp tục theo dõi.');
    const root=$('monitorActions'); if(!root)return;
    root.innerHTML=`<ol>${actions.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="muted">Action Planner chỉ tạo checklist đề xuất. Không có nút auto-fix, không ghi DB, không gửi Push.</p>`;
  }
  window.addEventListener('load',()=>setTimeout(run,1900)); $('refresh')?.addEventListener('click',()=>setTimeout(run,1900));
})();
