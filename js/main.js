// Main Application - Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
	// Initialize the application
	initApp();
});

function initApp() {
	// Set up event listeners
	setupEventListeners();
	
	// Load saved data
	loadSavedData();
	
	// Initialize service worker
	initServiceWorker();
	
	// Check for updates
	checkForUpdates();
}

function setupEventListeners() {
	// Form submission
	const form = document.getElementById('prompt-form');
	if (form) {
		form.addEventListener('submit', handleFormSubmit);
	}
	
	// Memory button
	const memoryBtn = document.getElementById('memory-btn');
	if (memoryBtn) {
		memoryBtn.addEventListener('click', showMemoryDialog);
	}
	
	// Settings button
	const settingsBtn = document.getElementById('settings-btn');
	if (settingsBtn) {
		settingsBtn.addEventListener('click', showSettingsDialog);
	}
	
	// Clear button
	const clearBtn = document.getElementById('clear-btn');
	if (clearBtn) {
		clearBtn.addEventListener('click', clearConversation);
	}
	
	// Memory dialog close button
	const closeMemoryBtn = document.getElementById('close-memory');
	if (closeMemoryBtn) {
		closeMemoryBtn.addEventListener('click', closeMemoryDialog);
	}
	
	// Settings dialog close button
	const closeSettingsBtn = document.getElementById('close-settings');
	if (closeSettingsBtn) {
		closeSettingsBtn.addEventListener('click', closeSettingsDialog);
	}
	
	// Save memory button
	const saveMemoryBtn = document.getElementById('save-memory');
	if (saveMemoryBtn) {
		saveMemoryBtn.addEventListener('click', saveMemory);
	}
	
	// Save settings button
	const saveSettingsBtn = document.getElementById('save-settings');
	if (saveSettingsBtn) {
		saveSettingsBtn.addEventListener('click', saveSettings);
	}
	
	// Test notification button
	const testNotificationBtn = document.getElementById('test-notification');
	if (testNotificationBtn) {
		testNotificationBtn.addEventListener('click', testNotification);
	}
	
	// Window resize
	window.addEventListener('resize', handleResize);
	
	// Online/offline events
	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);
}

function handleFormSubmit(event) {
	event.preventDefault();
	
	const input = document.getElementById('prompt-input');
	if (input && input.value.trim()) {
		sendMessage(input.value.trim());
		input.value = '';
		input.focus();
	}
}

function handleResize() {
	// Adjust UI based on window size
	const messagesContainer = document.getElementById('messages');
	if (messagesContainer && window.innerWidth < 600) {
		messagesContainer.style.height = '300px';
	} else if (messagesContainer) {
		messagesContainer.style.height = '400px';
	}
}

function handleOnline() {
	// Update UI when coming back online
	showNotification('You are back online', 'success');
}

function handleOffline() {
	// Update UI when going offline
	showNotification('You are offline. Some features may not be available.', 'warning');
}

function loadSavedData() {
	// Load conversation history
	loadConversation();
	
	// Load settings
	loadSettings();
	
	// Load memory
	loadMemory();
}

function clearConversation() {
	if (confirm('Are you sure you want to clear the conversation?')) {
		clearConversationData();
		renderMessages([]);
		showNotification('Conversation cleared', 'success');
	}
}

function showMemoryDialog() {
	const dialog = document.getElementById('memory-dialog');
	if (dialog) {
		dialog.style.display = 'block';
		loadMemoryContent();
	}
}

function closeMemoryDialog() {
	const dialog = document.getElementById('memory-dialog');
	if (dialog) {
		dialog.style.display = 'none';
	}
}

function showSettingsDialog() {
	const dialog = document.getElementById('settings-dialog');
	if (dialog) {
		dialog.style.display = 'block';
		loadSettingsContent();
	}
}

function closeSettingsDialog() {
	const dialog = document.getElementById('settings-dialog');
	if (dialog) {
		dialog.style.display = 'none';
	}
}

function saveMemory() {
	const memoryContent = document.getElementById('memory-content');
	if (memoryContent) {
		saveMemoryData(memoryContent.value);
		closeMemoryDialog();
		showNotification('Memory saved', 'success');
	}
}

function saveSettings() {
	const apiKey = document.getElementById('api-key');
	const model = document.getElementById('model');
	const temperature = document.getElementById('temperature');
	const maxTokens = document.getElementById('max-tokens');
	
	if (apiKey && model && temperature && maxTokens) {
		const settings = {
			apiKey: apiKey.value,
			model: model.value,
			temperature: parseFloat(temperature.value),
			maxTokens: parseInt(maxTokens.value)
		};
		
		saveSettingsData(settings);
		closeSettingsDialog();
		showNotification('Settings saved', 'success');
	}
}

function testNotification() {
	// Request notification permission if not already granted
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission().then(permission => {
			if (permission === 'granted') {
				showTestNotification();
			} else {
				showNotification('Notification permission denied', 'error');
			}
		});
	} else if ('Notification' in window && Notification.permission === 'granted') {
		showTestNotification();
	} else {
		showNotification('Notifications not supported', 'error');
	}
}

function showTestNotification() {
	if ('Notification' in window) {
		const notification = new Notification('MementoAI Test', {
			body: 'This is a test notification from MementoAI',
			icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>'
		});
		
		notification.onclick = () => {
			window.focus();
			notification.close();
		};
	}
}

function initServiceWorker() {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('/sw.js')
			.then(registration => {
				console.log('ServiceWorker registration successful with scope: ', registration.scope);
			})
			.catch(error => {
				console.log('ServiceWorker registration failed: ', error);
			});
	}
}

function checkForUpdates() {
	// Check for app updates
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.ready.then(registration => {
			registration.addEventListener('updatefound', () => {
				const installingWorker = registration.installing;
				installingWorker.addEventListener('statechange', () => {
					if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
						// New version available
						showUpdateNotification();
					}
				});
			});
		});
	}
}

function showUpdateNotification() {
	// Show notification that an update is available
	const updateBar = document.createElement('div');
	updateBar.style.position = 'fixed';
	updateBar.style.bottom = '0';
	updateBar.style.left = '0';
	updateBar.style.right = '0';
	updateBar.style.backgroundColor = '#4caf50';
	updateBar.style.color = 'white';
	updateBar.style.padding = '10px';
	updateBar.style.textAlign = 'center';
	updateBar.style.zIndex = '1000';
	updateBar.innerHTML = 'A new version is available. <button id="update-app" style="background: white; color: #4caf50; border: none; padding: 5px 10px; border-radius: 4px; margin-left: 10px; cursor: pointer;">Update</button>';
	
	document.body.appendChild(updateBar);
	
	const updateButton = document.getElementById('update-app');
	if (updateButton) {
		updateButton.addEventListener('click', () => {
			window.location.reload();
		});
	}
}