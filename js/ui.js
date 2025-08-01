// UI Rendering - Functions for rendering UI elements

// Render messages in the conversation
function renderMessages(messages) {
	const messagesContainer = document.getElementById('chat-container');
	if (!messagesContainer) return;
	
	// Clear existing messages
	messagesContainer.innerHTML = '';
	
	// Add messages to container
	messages.forEach(message => {
		const messageElement = createMessageElement(message);
		messagesContainer.appendChild(messageElement);
	});
	
	// Scroll to bottom
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Create a message element
function createMessageElement(message) {
	const messageDiv = document.createElement('div');
	messageDiv.className = `message ${message.role}`;
	
	// Add message header
	const messageHeader = document.createElement('div');
	messageHeader.className = 'message-header';
	
	const roleElement = document.createElement('span');
	roleElement.className = 'message-role';
	roleElement.textContent = message.role === 'user' ? 'You' : 'MementoAI';
	messageHeader.appendChild(roleElement);
	
	const timestampElement = document.createElement('span');
	timestampElement.className = 'message-timestamp';
	timestampElement.textContent = formatTimestamp(message.timestamp);
	messageHeader.appendChild(timestampElement);
	
	messageDiv.appendChild(messageHeader);
	
	// Add message content
	const messageContent = document.createElement('div');
	messageContent.className = 'message-content markdown';
	
	if (message.role === 'user') {
		messageContent.textContent = message.content;
	} else {
		// For AI messages, render markdown
		messageContent.innerHTML = renderMarkdown(message.content);
	}
	
	messageDiv.appendChild(messageContent);
	
	// Add message actions for AI messages
	if (message.role === 'assistant') {
		const messageActions = document.createElement('div');
		messageActions.className = 'message-actions';
		
		const copyButton = document.createElement('button');
		copyButton.className = 'message-action-btn';
		copyButton.innerHTML = '📋 Copy';
		copyButton.addEventListener('click', () => copyToClipboard(message.content));
		messageActions.appendChild(copyButton);
		
		const rememberButton = document.createElement('button');
		rememberButton.className = 'message-action-btn';
		rememberButton.innerHTML = '🧠 Remember';
		rememberButton.addEventListener('click', () => addToMemory(message.content));
		messageActions.appendChild(rememberButton);
		
		messageDiv.appendChild(messageActions);
	}
	
	return messageDiv;
}

// Format timestamp
function formatTimestamp(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Render markdown content
function renderMarkdown(content) {
	// Simple markdown renderer
	let html = content
		// Headers
		.replace(/^### (.*$)/gim, '<h3>$1</h3>')
		.replace(/^## (.*$)/gim, '<h2>$1</h2>')
		.replace(/^# (.*$)/gim, '<h1>$1</h1>')
		// Bold
		.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
		// Italic
		.replace(/\*(.*)\*/gim, '<em>$1</em>')
		// Code blocks
		.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
		// Inline code
		.replace(/`([^`]*)`/g, '<code>$1</code>')
		// Links
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
		// Unordered lists
		.replace(/^(.*)$/gm, (match) => {
			if (match.trim().startsWith('- ')) {
				return '<li>' + match.trim().substring(2) + '</li>';
			}
			return match;
		})
		// Process lists
		.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
	
	return html;
}

// Copy text to clipboard
function copyToClipboard(text) {
	navigator.clipboard.writeText(text)
		.then(() => {
			showNotification('Copied to clipboard', 'success');
		})
		.catch(err => {
			console.error('Failed to copy: ', err);
			showNotification('Failed to copy', 'error');
		});
}

// Add content to memory
function addToMemory(content) {
	const memory = getMemory();
	const updatedMemory = memory ? memory + '\n\n' + content : content;
	saveMemoryData(updatedMemory);
	showNotification('Added to memory', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.textContent = message;
	
	document.body.appendChild(notification);
	
	// Animate in
	setTimeout(() => {
		notification.classList.add('show');
	}, 10);
	
	// Remove after delay
	setTimeout(() => {
		notification.classList.remove('show');
		setTimeout(() => {
			document.body.removeChild(notification);
		}, 300);
	}, 3000);
}

// Load memory content into dialog
function loadMemoryContent() {
	const memoryContent = document.getElementById('memory-content');
	if (memoryContent) {
		memoryContent.value = getMemory();
	}
}

// Load settings content into dialog
function loadSettingsContent() {
	const settings = getSettings();
	
	const apiKey = document.getElementById('api-key');
	const model = document.getElementById('model-select');
	
	if (apiKey) apiKey.value = settings.apiKey || '';
	
	// Load available models and populate select if API key is available
	if (settings.apiKey && navigator.onLine) {
		getAvailableModels().then(models => {
			populateModelSelect(models);
		}).catch(error => {
			console.error('Error loading models:', error);
			// Fallback to simple model select
			if (model) model.value = settings.model || 'openai/gpt-3.5-turbo';
		});
	} else {
		// Fallback to simple model select
		if (model) model.value = settings.model || 'openai/gpt-3.5-turbo';
	}
	
	// Note: temperature and max-tokens are not in the HTML, using defaults
	// These would need to be added to the HTML if we want to make them configurable
}

// Show typing indicator
function showTypingIndicator() {
	const messagesContainer = document.getElementById('chat-container');
	if (!messagesContainer) return;
	
	const typingDiv = document.createElement('div');
	typingDiv.id = 'typing-indicator';
	typingDiv.className = 'message assistant';
	
	const messageHeader = document.createElement('div');
	messageHeader.className = 'message-header';
	
	const roleElement = document.createElement('span');
	roleElement.className = 'message-role';
	roleElement.textContent = 'MementoAI';
	messageHeader.appendChild(roleElement);
	
	typingDiv.appendChild(messageHeader);
	
	const messageContent = document.createElement('div');
	messageContent.className = 'message-content';
	messageContent.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
	
	typingDiv.appendChild(messageContent);
	
	messagesContainer.appendChild(typingDiv);
	messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
	const typingIndicator = document.getElementById('typing-indicator');
	if (typingIndicator) {
		typingIndicator.remove();
	}
}

// Update UI based on online status
function updateOnlineStatusUI(isOnline) {
	const statusElement = document.getElementById('online-status');
	if (statusElement) {
		statusElement.textContent = isOnline ? 'Online' : 'Offline';
		statusElement.className = isOnline ? 'online' : 'offline';
	}
}

// Update character count
function updateCharacterCount() {
	const input = document.getElementById('message-input');
	const counter = document.getElementById('char-counter');
	
	if (input && counter) {
		const count = input.value.length;
		counter.textContent = `${count}/2000`;
		
		if (count > 2000) {
			counter.classList.add('over-limit');
		} else {
			counter.classList.remove('over-limit');
		}
	}
}

// Toggle dark mode
function toggleDarkMode() {
	document.body.classList.toggle('dark-mode');
	const isDarkMode = document.body.classList.contains('dark-mode');
	
	try {
		localStorage.setItem('mementoai-dark-mode', isDarkMode);
	} catch (error) {
		console.error('Error saving dark mode preference:', error);
	}
	
	// Update toggle button if it exists
	const darkModeToggle = document.getElementById('dark-mode-toggle');
	if (darkModeToggle) {
		darkModeToggle.checked = isDarkMode;
	}
}

// Load dark mode preference
function loadDarkModePreference() {
	try {
		const isDarkMode = localStorage.getItem('mementoai-dark-mode') === 'true';
		if (isDarkMode) {
			document.body.classList.add('dark-mode');
			
			const darkModeToggle = document.getElementById('dark-mode-toggle');
			if (darkModeToggle) {
				darkModeToggle.checked = true;
			}
		}
	} catch (error) {
		console.error('Error loading dark mode preference:', error);
	}
}

// Show export dialog
function showExportDialog() {
	const dialog = document.getElementById('export-dialog');
	if (dialog) {
		const exportData = document.getElementById('export-data');
		if (exportData) {
			exportData.value = exportState();
		}
		dialog.style.display = 'block';
	}
}

// Hide export dialog
function hideExportDialog() {
	const dialog = document.getElementById('export-dialog');
	if (dialog) {
		dialog.style.display = 'none';
	}
}

// Show import dialog
function showImportDialog() {
	const dialog = document.getElementById('import-dialog');
	if (dialog) {
		const importData = document.getElementById('import-data');
		if (importData) {
			importData.value = '';
		}
		dialog.style.display = 'block';
	}
}

// Hide import dialog
function hideImportDialog() {
	const dialog = document.getElementById('import-dialog');
	if (dialog) {
		dialog.style.display = 'none';
	}
}

// Handle import data
function handleImportData() {
	const importData = document.getElementById('import-data');
	if (importData && importData.value.trim()) {
		const success = importState(importData.value.trim());
		if (success) {
			hideImportDialog();
			showNotification('Data imported successfully', 'success');
			
			// Refresh UI
			renderMessages(getConversation());
			loadSettingsContent();
			loadMemoryContent();
		} else {
			showNotification('Failed to import data', 'error');
		}
	}
}