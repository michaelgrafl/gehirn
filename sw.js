// A very basic service worker for now.
// Its main purpose is to exist as a physical file to satisfy the registration requirements.
// It also handles basic caching for offline use.

const CACHE_NAME = "memento-ai-cache-v1";
const urlsToCache = [
	"/",
	"/index.html" // Cache the main application file
];

// On install, pre-cache the main app shell
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Opened cache");
			return cache.addAll(urlsToCache);
		})
	);
});

// On fetch, serve from cache first, then network
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			// Cache hit - return response
			if (response) {
				return response;
			}
			// Not in cache - go to network
			return fetch(event.request);
		})
	);
});
