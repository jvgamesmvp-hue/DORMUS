const CACHE='dormus-pwa-847';
const CORE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)));});
self.addEventListener('push',event=>{let p={title:'DORMUS',body:'Nova mensagem',url:'./'};try{p=Object.assign(p,event.data?event.data.json():{})}catch(e){};event.waitUntil(self.registration.showNotification(p.title,{body:p.body,icon:p.icon||'./icon-192.png',badge:p.badge||'./icon-192.png',tag:p.tag||'dormus',renotify:true,data:{url:p?.data?.url||p.url||'./'}}))});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification?.data?.url||'./';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const c of list){if('focus' in c){c.navigate(url);return c.focus()}}return clients.openWindow(url)}))});
