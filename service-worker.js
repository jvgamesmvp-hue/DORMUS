const CACHE='dormus-pwa-830';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'])).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin===location.origin)e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))})
self.addEventListener('push',e=>{
  let data={};try{data=e.data?e.data.json():{}}catch(_){data={body:e.data?.text()||'Nova mensagem no DORMUS'}}
  const title=data.title||'DORMUS · Nova mensagem';
  const body=data.body||'Você recebeu uma nova mensagem.';
  const chatId=data.chatId||data.servico_id||'';
  const url=chatId?new URL(`?chat=${encodeURIComponent(chatId)}`,self.registration.scope).href:self.registration.scope;
  e.waitUntil(self.registration.showNotification(title,{body,icon:'./icon-192.png',badge:'./icon-192.png',tag:data.tag||('dormus-chat-'+chatId),renotify:true,data:{url,chatId}}));
});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=e.notification?.data?.url||self.registration.scope;e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}))});
