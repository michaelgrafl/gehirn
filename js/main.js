// DEBUG: Diagnostic logging for DOM element verification
function logDiagnosticInfo() {
  console.log('=== DOM ELEMENT DIAGNOSTICS ===');
  
  // Check critical DOM elements
  const criticalElements = [
    'prompt-form', 'prompt-input', 'chat-form', 'message-input',
    'memory-btn', 'settings-btn', 'clear-btn',
    'memory-dialog', 'settings-dialog',
    'close-memory', 'close-settings',
    'save-memory', 'save-settings',
    'test-notification', 'messages', 'chat-container',
    'api-key', 'model', 'temperature', 'max-tokens',
    'settings-toggle', 'settings-panel'
  ];
  
  console.log('Checking critical DOM elements:');
  criticalElements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`Element '${id}': ${element ? 'EXISTS' : 'MISSING'}`);
    if (element) {
      console.log(`  - Tag: ${element.tagName}`);
      console.log(`  - Type: ${element.type || 'N/A'}`);
      console.log(`  - Classes: ${element.className || 'none'}`);
    }
  });
  
  console.log('=== END DOM ELEMENT DIAGNOSTICS ===');
}

// Main Application - Initialization and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
	// Initialize the application
	initApp();
});

function initApp() {
  console.log('=== APP INITIALIZATION STARTED ===');
  
  // DEBUG: Run diagnostic checks first
  logDiagnosticInfo();
  
  // Set up event listeners
  console.log('Setting up event listeners...');
  setupEventListeners();
  
  // Load saved data
  console.log('Loading saved data...');
  loadSavedData();
  
  // Initialize PWA features (includes service worker)
  console.log('Initializing PWA features...');
  initPWA();
  
  // Check for updates
  console.log('Checking for updates...');
  checkForUpdates();
  
  // Test model loading
  console.log('Testing model loading...');
  testModelLoading();
  
  console.log('=== APP INITIALIZATION COMPLETED ===');
}

function setupEventListeners() {
	// Form submission and composer UX
	const form = document.getElementById('chat-form');
	if (form) {
		form.addEventListener('submit', handleFormSubmit);
		const input = document.getElementById('message-input')
		const sendBtn = document.getElementById('send-button')
		if (input) {
			try { input.value = '' } catch(e){}
			if (sendBtn) sendBtn.disabled = true
			input.addEventListener('input', () => {
				if (sendBtn) sendBtn.disabled = !input.value.trim()
			})
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault()
					form.requestSubmit()
				}
			})
		}
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
	// Refresh models button
	const refreshModelsBtn = document.getElementById('refresh-models');
	if (refreshModelsBtn) {
		refreshModelsBtn.addEventListener('click', () => {
			const settings = getSettings();
			console.log('Refresh models clicked - API key present:', !!settings.apiKey);
			
			if (settings.apiKey && settings.apiKey.trim()) {
				const status = ensureSettingsStatus()
				status.textContent = 'Validating API key...'
				status.className = 'inline-status info'
				validateApiKey().then(v => {
					if (!v.valid) {
						status.textContent = v.message || 'Invalid API key'
						status.className = 'inline-status error'
						return []
					}
					status.textContent = 'Refreshing models...'
					status.className = 'inline-status info'
					return getAvailableModels()
				}).then(models => {
					console.log('Models refreshed:', models.length);
					if (models.length > 0) {
						populateModelSelect(models);
						status.textContent = 'Models refreshed successfully'
						status.className = 'inline-status success'
					}
				}).catch(error => {
					console.error('Error refreshing models:', error);
					const status = ensureSettingsStatus()
					status.textContent = 'Error refreshing models'
					status.className = 'inline-status error'
				});
			} else {
				console.warn('No API key set, cannot refresh models');
				const status = ensureSettingsStatus()
				status.textContent = 'Please set API key first'
				status.className = 'inline-status error';
			}
		});
	}
	
	// Export memory button
	const exportMemoryBtn = document.getElementById('export-memory');
	if (exportMemoryBtn) {
		exportMemoryBtn.addEventListener('click', () => {
			const memory = getMemory();
			if (memory) {
				const blob = new Blob([memory], { type: 'text/plain' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'mementoai-memory.txt';
				a.click();
				URL.revokeObjectURL(url);
				const activity = document.getElementById('activity-log') || createActivityLog();
				const item = document.createElement('div');
				item.className = 'activity-item success';
				item.textContent = 'Memory exported successfully';
				activity.prepend(item);
			} else {
				const activity = document.getElementById('activity-log') || createActivityLog();
				const item = document.createElement('div');
				item.className = 'activity-item warning';
				item.textContent = 'No memory to export';
				activity.prepend(item);
			}
		});
	}
	
	// Import memory button
	const importMemoryBtn = document.getElementById('import-memory');
	if (importMemoryBtn) {
		importMemoryBtn.addEventListener('click', () => {
			const fileInput = document.getElementById('import-file-input');
			if (fileInput) {
				fileInput.click();
			}
		});
	}
	
	// Import file input
	const importFileInput = document.getElementById('import-file-input');
	if (importFileInput) {
		importFileInput.addEventListener('change', (event) => {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					saveMemoryData(content);
					const activity = document.getElementById('activity-log') || createActivityLog();
					const item = document.createElement('div');
					item.className = 'activity-item success';
					item.textContent = 'Memory imported successfully';
					activity.prepend(item);
				};
				reader.readAsText(file);
			}
		});
	}
	
	// Enable notifications button
	const enableNotificationsBtn = document.getElementById('enable-notifications');
	if (enableNotificationsBtn) {
		enableNotificationsBtn.addEventListener('click', () => {
			if ('Notification' in window) {
				Notification.requestPermission().then(permission => {
					if (permission === 'granted') {
						const activity = document.getElementById('activity-log') || createActivityLog();
						const item = document.createElement('div');
						item.className = 'activity-item success';
						item.textContent = 'Notifications enabled';
						activity.prepend(item);
					} else {
						const activity = document.getElementById('activity-log') || createActivityLog();
						const item = document.createElement('div');
						item.className = 'activity-item error';
						item.textContent = 'Notifications denied';
						activity.prepend(item);
					}
				});
			} else {
				const activity = document.getElementById('activity-log') || createActivityLog();
		const item = document.createElement('div');
		item.className = 'activity-item error';
		item.textContent = 'Notifications not supported';
		activity.prepend(item);
			}
		});
	}
	
	// Clear debug button
	const clearDebugBtn = document.getElementById('clear-debug');
	if (clearDebugBtn) {
		clearDebugBtn.addEventListener('click', () => {
			const debugInfo = document.getElementById('debug-info');
			if (debugInfo) {
				debugInfo.innerHTML = '';
				const activity = document.getElementById('activity-log') || createActivityLog();
				const item = document.createElement('div');
				item.className = 'activity-item success';
				item.textContent = 'Debug info cleared';
				activity.prepend(item);
			}
		});
	}
	
	// Settings toggle button
	const settingsToggle = document.getElementById('settings-toggle');
	if (settingsToggle) {
		settingsToggle.addEventListener('click', () => {
			const settingsPanel = document.getElementById('settings-panel');
			if (settingsPanel) {
				settingsPanel.classList.toggle('hidden');
				if (!settingsPanel.classList.contains('hidden')) {
					settingsPanel.setAttribute('aria-busy', 'true')
					loadSettingsContent()
					settingsPanel.setAttribute('aria-busy', 'false')
					const banner = document.getElementById('settings-banner')
					const dismiss = document.getElementById('dismiss-settings-banner')
					if (dismiss) dismiss.onclick = () => banner && banner.classList.add('hidden')
					const toggleVis = document.getElementById('toggle-key-visibility')
					const apiInput = document.getElementById('api-key')
					if (toggleVis && apiInput) {
						toggleVis.onclick = () => {
							const isPassword = apiInput.type === 'password'
							apiInput.type = isPassword ? 'text' : 'password'
							toggleVis.textContent = isPassword ? 'Hide' : 'Show'
							toggleVis.setAttribute('aria-pressed', String(isPassword))
						}
					}
					const testBtn = document.getElementById('test-api-key')
					if (testBtn) {
						testBtn.onclick = () => {
							const status = ensureSettingsStatus()
							status.textContent = 'Validating API key...'
							status.className = 'inline-status info'
							validateApiKey().then(v => {
								if (!v.valid) {
									status.textContent = v.message || 'Invalid API key'
									status.className = 'inline-status error'
								} else {
									status.textContent = 'API key is valid'
									status.className = 'inline-status success'
								}
							}).catch(err => {
								status.textContent = 'Error validating API key'
								status.className = 'inline-status error'
							})
						}
					}
				}
			}
		});
	}
	
	// Free filter checkbox
	const freeFilter = document.getElementById('free-filter');
	if (freeFilter) {
		freeFilter.addEventListener('change', () => {
			const settings = getSettings();
			if (settings.apiKey) {
				getAvailableModels().then(models => {
					let filteredModels = models;
					if (freeFilter.checked) {
						filteredModels = models.filter(model => {
							const pricing = model.pricing;
							return pricing && pricing.prompt === "0" && pricing.completion === "0";
						});
					}
					populateModelSelect(filteredModels);
				}).catch(error => {
					const status = ensureSettingsStatus()
					status.textContent = 'Error filtering models: ' + error.message
					status.className = 'inline-status error';
				});
			} else {
				const status = ensureSettingsStatus()
				status.textContent = 'Please set API key first'
				status.className = 'inline-status error';
			}
		});
	}
	
	// Model search input
	const modelSearch = document.getElementById('model-search');
	if (modelSearch) {
		modelSearch.addEventListener('input', (e) => {
			const searchTerm = e.target.value.toLowerCase();
			const modelSelect = document.getElementById('model-select');
			if (modelSelect) {
				Array.from(modelSelect.options).forEach(option => {
					const visible = option.text.toLowerCase().includes(searchTerm);
					option.style.display = visible ? '' : 'none';
				});
			}
		});
	}
	
	// Online/offline events
	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);
}

function handleFormSubmit(event) {
	event.preventDefault();
	
	const input = document.getElementById('message-input');
	const sendBtn = document.getElementById('send-button')
	if (input && input.value.trim()) {
		sendMessage(input.value.trim());
		input.value = '';
		if (sendBtn) sendBtn.disabled = true
		input.focus();
	}
}

function handleResize() {
	// Adjust UI based on window size
	const messagesContainer = document.getElementById('chat-container');
	if (messagesContainer && window.innerWidth < 600) {
		messagesContainer.style.height = '300px';
	} else if (messagesContainer) {
		messagesContainer.style.height = '400px';
	}
}

function handleOnline() {
	// Update UI when coming back online
	const activity = document.getElementById('activity-log') || createActivityLog();
	const item = document.createElement('div');
	item.className = 'activity-item success';
	item.textContent = 'You are back online';
	activity.prepend(item);
}

function handleOffline() {
	// Update UI when going offline
	const activity = document.getElementById('activity-log') || createActivityLog();
	const item = document.createElement('div');
	item.className = 'activity-item warning';
	item.textContent = 'You are offline. Some features may not be available.';
	activity.prepend(item);
}

function loadSavedData() {
	// Load conversation history
	loadConversation();
	
	// Load settings
	loadSettings();
	
	// Load memory
	loadMemory();
	
	// Load models if API key is available
	const settings = getSettings();
	if (settings.apiKey && navigator.onLine) {
		validateApiKey().then(v => {
			if (!v.valid) {
				showNotification(v.message || 'Invalid API key', 'error')
				return []
			}
			return getAvailableModels()
		}).then(models => {
			populateModelSelect(models);
		}).catch(error => {
			console.error('Error loading models on page load:', error);
			const status = ensureSettingsStatus()
			status.textContent = 'Error loading models'
			status.className = 'inline-status error';
		});
	}
}

function clearConversation() {
	if (confirm('Are you sure you want to clear the conversation?')) {
		clearConversationData();
		renderMessages([]);
		const activity = document.getElementById('activity-log') || createActivityLog();
		const item = document.createElement('div');
		item.className = 'activity-item success';
		item.textContent = 'Conversation cleared';
		activity.prepend(item);
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
	const dialog = document.getElementById('settings-panel');
	if (dialog) {
		dialog.classList.remove('hidden');
		loadSettingsContent();
	}
}

function closeSettingsDialog() {
	const dialog = document.getElementById('settings-panel');
	if (dialog) {
		dialog.classList.add('hidden');
	}
}

function saveMemory() {
	const memoryContent = document.getElementById('memory-content');
	if (memoryContent) {
		saveMemoryData(memoryContent.value);
		closeMemoryDialog();
		const status = document.getElementById('memory-status') || (function(){ const el = document.createElement('div'); el.id='memory-status'; el.className='inline-status success'; const dialog=document.getElementById('memory-dialog')||document.body; dialog.appendChild(el); return el; })();
		status.textContent = 'Memory saved';
	}
}

function saveSettings() {
	const apiKey = document.getElementById('api-key');
	const model = document.getElementById('model-select');
	
	if (apiKey && model) {
		// Get current settings to preserve API key if not changed
		const currentSettings = getSettings();
		const newApiKey = apiKey.value.trim();
		
		const settings = {
			apiKey: newApiKey || currentSettings.apiKey, // Preserve existing API key if new one is empty
			model: model.value,
			temperature: 0.7, // Default value
			maxTokens: 1000 // Default value
		};
		
		// Save the settings
		saveSettingsData(settings);
		
		// If API key was just set or changed, validate then refresh models
		if (settings.apiKey && settings.apiKey.trim()) {
			const status = ensureSettingsStatus()
			status.textContent = 'Validating API key...'
			status.className = 'inline-status info'
			validateApiKey().then(v => {
				if (!v.valid) {
					status.textContent = v.message || 'Invalid API key'
					status.className = 'inline-status error'
					return []
				}
				status.textContent = 'Loading models...'
				status.className = 'inline-status info'
				return getAvailableModels()
			}).then(models => {
				if (Array.isArray(models) && models.length > 0) {
					populateModelSelect(models);
					status.textContent = 'Settings saved and models refreshed'
					status.className = 'inline-status success'
				}
			}).catch(error => {
				console.error('Error loading models:', error);
				const status = ensureSettingsStatus()
				status.textContent = 'Error loading models'
				status.className = 'inline-status error'
			});
		} else {
			showNotification('Settings saved', 'success');
		}
		
		closeSettingsDialog();
	}
}

function testNotification() {
	// Request notification permission if not already granted
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission().then(permission => {
			if (permission === 'granted') {
				showTestNotification();
			} else {
				const activity = document.getElementById('activity-log') || createActivityLog();
		const item = document.createElement('div');
		item.className = 'activity-item error';
		item.textContent = 'Notification permission denied';
		activity.prepend(item);
			}
		});
	} else if ('Notification' in window && Notification.permission === 'granted') {
		showTestNotification();
	} else {
		const activity = document.getElementById('activity-log') || createActivityLog();
				const item = document.createElement('div');
				item.className = 'activity-item error';
				item.textContent = 'Notifications not supported';
				activity.prepend(item);
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

// DEBUG: Test model loading mechanism
function testModelLoading() {
  console.log('=== MODEL LOADING TEST ===');
  
  // Check if we can get settings
  try {
    const settings = getSettings();
    console.log('Settings loaded:', settings);
    
    // Check if model is set
    if (settings.model) {
      console.log('Current model:', settings.model);
    } else {
      console.warn('No model set in settings');
    }
    
    // Check if API key is set
    if (settings.apiKey) {
      console.log('API key is set (length:', settings.apiKey.length, ')');
    } else {
      console.warn('No API key set');
    }
    
    // Test model loading from API
    if (settings.apiKey && navigator.onLine) {
      console.log('Testing model loading from API...');
      getAvailableModels().then(models => {
        console.log('Available models:', models);
        console.log('=== MODEL LOADING TEST COMPLETED ===');
      }).catch(error => {
        console.error('Error loading models:', error);
        console.log('=== MODEL LOADING TEST COMPLETED WITH ERRORS ===');
      });
    } else {
      console.log('Skipping API model test (no API key or offline)');
      console.log('=== MODEL LOADING TEST COMPLETED ===');
    }
  } catch (error) {
    console.error('Error testing model loading:', error);
    console.log('=== MODEL LOADING TEST COMPLETED WITH ERRORS ===');
  }
}

// Populate model select dropdown with available models
function populateModelSelect(models) {
  console.log('=== populateModelSelect STARTED ===');
  console.log('Models to populate:', models.length);
  
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect) {
    console.warn('Model select element not found');
    return;
  }
  
  // Clear existing options
  modelSelect.innerHTML = '';
  
  if (models.length === 0) {
    console.warn('No models to populate');
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No models available';
    option.disabled = true;
    modelSelect.appendChild(option);
    return;
  }
  
  // Add new options
  models.forEach((model, index) => {
    const option = document.createElement('option');
    option.value = model.id;
    
    // Create more descriptive label
    const name = model.name || model.id;
    const description = model.description ? ` - ${model.description.substring(0, 50)}...` : '';
    
    // Check for free models (price = 0)
    let isFree = false;
    const pricing = model.pricing;
    
    if (pricing && pricing.prompt === "0" && pricing.completion === "0") {
      isFree = true;
    }
    
    // Add visual indicators for free models
    const freeIndicator = isFree ? '🔓 FREE: ' : '';
    option.textContent = `${freeIndicator}${name}${description}`;
    
    // Add data attributes for filtering
    if (isFree) {
      option.setAttribute('data-free', 'true');
    }
    
    modelSelect.appendChild(option);
  });
  
  // Set current model as selected
  const settings = getSettings();
  if (settings.model && Array.from(modelSelect.options).some(opt => opt.value === settings.model)) {
    modelSelect.value = settings.model;
  } else if (models.length > 0) {
    // Select first free model if available, otherwise first model
    const firstFreeModel = models.find(model =>
      model.pricing && model.pricing.prompt === "0" && model.pricing.completion === "0"
    );
    
    if (firstFreeModel) {
      modelSelect.value = firstFreeModel.id;
    } else {
      modelSelect.value = models[0].id;
    }
  }
  
  console.log('Model select populated successfully with', models.length, 'models');
}
