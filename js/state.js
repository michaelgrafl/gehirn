// State Management - localStorage and State Functions

// Default settings
const DEFAULT_SETTINGS = {
	apiKey: '',
	model: 'openai/gpt-3.5-turbo',
	temperature: 0.7,
	maxTokens: 1000
};

// Initialize state
let appState = {
	conversation: [],
	settings: { ...DEFAULT_SETTINGS },
	memory: '',
	isOnline: navigator.onLine
};

// Load app state from localStorage
function loadAppState() {
    const savedState = localStorage.getItem('mementoai-app-state');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            appState = { ...appState, ...parsedState };
        } catch (error) {
            console.error('Error parsing app state:', error);
        }
    }
    return appState;
}

// Initialize app state
function initializeAppState() {
    loadAppState();
    loadSettings();
    loadConversation();
    loadMemory();
}

// Load settings from localStorage
function loadSettings() {
	const savedSettings = localStorage.getItem('mementoai-settings');
	if (savedSettings) {
		try {
			appState.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
		} catch (error) {
			console.error('Error parsing settings:', error);
			appState.settings = { ...DEFAULT_SETTINGS };
		}
	}
	return appState.settings;
}

// Save settings to localStorage
function saveSettingsData(settings) {
	appState.settings = { ...appState.settings, ...settings };
	try {
		localStorage.setItem('mementoai-settings', JSON.stringify(appState.settings));
	} catch (error) {
		console.error('Error saving settings:', error);
		showNotification('Error saving settings', 'error');
	}
}

// Load conversation from localStorage
function loadConversation() {
	const savedConversation = localStorage.getItem('mementoai-conversation');
	if (savedConversation) {
		try {
			appState.conversation = JSON.parse(savedConversation);
			renderMessages(appState.conversation);
		} catch (error) {
			console.error('Error parsing conversation:', error);
			appState.conversation = [];
		}
	}
	return appState.conversation;
}

// Save conversation to localStorage
function saveConversation() {
	try {
		localStorage.setItem('mementoai-conversation', JSON.stringify(appState.conversation));
	} catch (error) {
		console.error('Error saving conversation:', error);
		showNotification('Error saving conversation', 'error');
	}
}

// Add message to conversation
function addMessageToConversation(message) {
	appState.conversation.push(message);
	saveConversation();
	renderMessages(appState.conversation);
}

// Clear conversation data
function clearConversationData() {
	appState.conversation = [];
	try {
		localStorage.removeItem('mementoai-conversation');
	} catch (error) {
		console.error('Error clearing conversation:', error);
	}
}

// Load memory from localStorage
function loadMemory() {
	const savedMemory = localStorage.getItem('mementoai-memory');
	if (savedMemory) {
		try {
			appState.memory = savedMemory;
		} catch (error) {
			console.error('Error parsing memory:', error);
			appState.memory = '';
		}
	}
	return appState.memory;
}

// Save memory to localStorage
function saveMemoryData(memory) {
	appState.memory = memory;
	try {
		localStorage.setItem('mementoai-memory', memory);
	} catch (error) {
		console.error('Error saving memory:', error);
		showNotification('Error saving memory', 'error');
	}
}

// Get current state
function getState() {
	return { ...appState };
}

// Update state
function updateState(newState) {
	appState = { ...appState, ...newState };
}

// Get settings
function getSettings() {
	return { ...appState.settings };
}

// Update settings
function updateSettings(newSettings) {
	appState.settings = { ...appState.settings, ...newSettings };
	saveSettingsData(appState.settings);
}

// Get conversation
function getConversation() {
	return [...appState.conversation];
}

// Get memory
function getMemory() {
	return appState.memory;
}

// Check if online
function isOnline() {
	return appState.isOnline;
}

// Set online status
function setOnlineStatus(isOnline) {
	appState.isOnline = isOnline;
}

// Export state to JSON
function exportState() {
	return JSON.stringify({
		conversation: appState.conversation,
		settings: appState.settings,
		memory: appState.memory,
		exportDate: new Date().toISOString()
	});
}

// Import state from JSON
function importState(jsonState) {
	try {
		const importedState = JSON.parse(jsonState);
		
		if (importedState.conversation) {
			appState.conversation = importedState.conversation;
			saveConversation();
		}
		
		if (importedState.settings) {
			appState.settings = { ...DEFAULT_SETTINGS, ...importedState.settings };
			saveSettingsData(appState.settings);
		}
		
		if (importedState.memory !== undefined) {
			appState.memory = importedState.memory;
			saveMemoryData(appState.memory);
		}
		
		return true;
	} catch (error) {
		console.error('Error importing state:', error);
		return false;
	}
}

// Reset to default settings
function resetSettings() {
	appState.settings = { ...DEFAULT_SETTINGS };
	saveSettingsData(appState.settings);
	return appState.settings;
}

// Clear all data
function clearAllData() {
	try {
		localStorage.removeItem('mementoai-conversation');
		localStorage.removeItem('mementoai-settings');
		localStorage.removeItem('mementoai-memory');
		
		appState.conversation = [];
		appState.settings = { ...DEFAULT_SETTINGS };
		appState.memory = '';
		
		return true;
	} catch (error) {
		console.error('Error clearing all data:', error);
		return false;
	}
}
// Get app state
function getAppState() {
    return { ...appState };
}

// Save app state
function saveAppState(state) {
    appState = { ...appState, ...state };
    try {
        localStorage.setItem('mementoai-app-state', JSON.stringify(appState));
    } catch (error) {
        console.error('Error saving app state:', error);
    }
}
