/**
 * IOR Gestão Pro — Service Worker v2
 * Versão nova força limpeza do cache antigo
 */
const CACHE_VERSION = "v2";
const CACHE_NAME = `ior-gestao-${CACHE_VERSION}`;

// Limpa TODOS os caches antigos ao ativar
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("install", () => self.skipWaiting());

// Network first — sem cache agressivo que causa tela branca
self.addEventListener("fetch", (event) => {
  // API: sempre da rede
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;
  
  // Outros: tenta rede, fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && event.request.method === "GET") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
