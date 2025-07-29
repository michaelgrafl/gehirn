// Enhanced service worker for MementoAI with reminder scheduling capabilities

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

// Handle messages from the main application
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "schedule-reminder") {
		const { text, delay } = event.data.payload;
		
		// Use setTimeout for background task processing
		setTimeout(() => {
			// Show notification when reminder is triggered
			self.registration.showNotification("MementoAI Reminder", {
				body: text,
				icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>",
				badge: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>"
			});
		}, delay);
	}
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	// Optional: Add logic to handle notification clicks
});

// Handle push events (for future expansion)
self.addEventListener("push", (event) => {
	// For now, we're using setTimeout for reminders, but this could be extended for push notifications
	console.log("Push event received:", event);
});
