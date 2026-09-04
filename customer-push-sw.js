self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  let d={};try{d=event.data?event.data.json():{}}catch(_){d={title:'CHOCO SHIP',body:event.data?event.data.text():'Có thông báo mới'}}
  event.waitUntil(self.registration.showNotification(d.title||'CHOCO SHIP',{body:d.body||'Có cập nhật đơn hàng',icon:'./icon-512x512.png?v=20260904',badge:'./icon-512x512.png?v=20260904',tag:d.code?`customer-order-${d.code}`:'customer-order',renotify:true,silent:false,data:{url:d.url||'./customer.html',code:d.code||'',order_id:d.order_id||'',status:d.status||''},timestamp:Date.now()}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification.data?.url||'./customer.html';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c){c.focus();return c.navigate(url)}}return clients.openWindow(url)}))});