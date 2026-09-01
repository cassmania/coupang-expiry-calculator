const CACHE_VERSION = "v2";
const STATIC_CACHE = `expiry-calculator-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `expiry-calculator-dynamic-${CACHE_VERSION}`;
const BASE_URL = new URL("./", self.location.href);
const INDEX_URL = new URL("./index.html", BASE_URL).href;
const OFFLINE_URL = new URL("./offline.html", BASE_URL).href;

const APP_SHELL = [
    "./",
    "./index.html",
    "./app.js",
    "./manifest.json",
    "./offline.html",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png"
].map((path) => new URL(path, BASE_URL).href);

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((cacheName) => cacheName.startsWith("expiry-calculator-") &&
                    cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
                .map((cacheName) => caches.delete(cacheName))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request, { ignoreSearch: true });
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response("오프라인 상태에서 파일을 불러올 수 없습니다.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return await caches.match(request, { ignoreSearch: true }) ||
            await caches.match(INDEX_URL, { ignoreSearch: true }) ||
            await caches.match(OFFLINE_URL);
    }
}
