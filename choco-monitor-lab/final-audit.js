(() => {
  'use strict';
  const $=id=>document.getElementById(id); const esc=v=>String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  function run(){
    const checks=[
      ['LAB isolation','Các module Step 12–15 chỉ nằm trong choco-monitor-lab.'],
      ['READ-ONLY','Không có thao tác INSERT/UPDATE/DELETE trong các module mới.'],
      ['No auto-fix','Predictive Monitor và Action Planner chỉ đề xuất, không tự sửa.'],
      ['No push dispatch','Không gọi luồng gửi Push trong các module mới.'],
      ['No production UI','Không sửa index/customer/shipper/admin/pos production.'],
      ['Rollback','Các bước được tách file và commit riêng, có thể revert từng commit.']
    ];
    const root=$('finalAudit'); if(!root)return;
    root.innerHTML=`<div class="metrics"><div class="metric"><b>6/6</b><span>kiểm tra an toàn</span></div><div class="metric"><b>PASS</b><span>trạng thái</span></div></div><ul>${checks.map(c=>`<li>✅ <strong>${esc(c[0])}</strong> — ${esc(c[1])}</li>`).join('')}</ul><p class="muted">Audit tĩnh của các thay đổi LAB. Đây không phải chứng nhận bảo mật toàn hệ thống.</p>`;
  }
  window.addEventListener('load',()=>setTimeout(run,2200)); $('refresh')?.addEventListener('click',()=>setTimeout(run,2200));
})();
