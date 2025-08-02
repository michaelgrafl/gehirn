// API Interaction - Functions for communicating with the AI API

// API endpoint
const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Send message to API
async function sendMessageToAPI(message) {
	const settings = getSettings();
	
	if (!settings.apiKey) {
		showNotification('API key not set. Please configure in settings.', 'error');
		return null;
	}
	
	if (!isOnline()) {
		showNotification('You are offline. Please check your connection.', 'error');
		return null;
	}
	
	try {
		// Create conversation history for API
		const conversation = getConversation();
		const messages = [
			{
				role: 'system',
				content: 'You are MementoAI, a helpful AI assistant. You have access to the user\'s memory and can use it to provide personalized assistance.'
			}
		];
		
		// Add conversation history (limited to last 10 messages to avoid token limits)
		const recentMessages = conversation.slice(-10);
		recentMessages.forEach(msg => {
			messages.push({
				role: msg.role,
				content: msg.content
			});
		});
		
		// Add current message
		messages.push({
			role: 'user',
			content: message
		});
		
		// Add memory if available
		const memory = getMemory();
		if (memory) {
			messages[0].content += ` The user has provided the following memory information: ${memory}`;
		}
		
		// Prepare API request
		const requestBody = {
			model: settings.model,
			messages: messages,
			temperature: settings.temperature,
			max_tokens: settings.maxTokens
		};
		
		// Make API request
		const response = await fetch(API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${settings.apiKey}`
			},
			body: JSON.stringify(requestBody)
		});
		
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error?.message || 'API request failed');
		}
		
		const data = await response.json();
		return data.choices[0].message.content;
		
	} catch (error) {
		console.error('API Error:', error);
		showNotification(`Error: ${error.message}`, 'error');
		return null;
	}
}

// Test API connection
async function testAPIConnection() {
	const settings = getSettings();
	
	if (!settings.apiKey) {
		return {
			success: false,
			message: 'API key not set'
		};
	}
	
	if (!isOnline()) {
		return {
			success: false,
			message: 'You are offline'
		};
	}
	
	try {
		const testMessage = 'Hello, this is a test message. Please respond with "Connection successful".';
		const response = await sendMessageToAPI(testMessage);
		
		if (response && response.includes('successful')) {
			return {
				success: true,
				message: 'Connection successful'
			};
		} else {
			return {
				success: false,
				message: 'Unexpected response from API'
			};
		}
		
	} catch (error) {
		return {
			success: false,
			message: error.message
		};
	}
}

// Quick auth validation using a minimal request
async function validateApiKey() {
	const settings = getSettings()
	if (!settings.apiKey || !settings.apiKey.trim()) return { valid: false, message: 'API key not set' }
	if (!isOnline()) return { valid: false, message: 'You are offline' }
	try {
		const resp = await fetch(API_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${settings.apiKey}`,
			},
			body: JSON.stringify({ model: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1, temperature: 0 }),
		})
		if (resp.status === 401 || resp.status === 403) return { valid: false, message: 'Invalid API key. Please check your OpenRouter API key.' }
		return { valid: true }
	} catch (e) {
		return { valid: false, message: e.message }
	}
}

// Get available models
async function getAvailableModels() {
	const settings = getSettings();
	
	if (!settings.apiKey || !settings.apiKey.trim()) {
		showNotification('API key not set. Please configure in settings.', 'error');
		return [];
	}
	
	if (!isOnline()) {
		showNotification('You are offline. Please check your connection.', 'error');
		return [];
	}
	
	try {
		// Validate key first
		const validation = await validateApiKey()
		if (!validation.valid) {
			showNotification(validation.message || 'Invalid API key', 'error')
			return []
		}
		const response = await fetch('https://openrouter.ai/api/v1/models', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${settings.apiKey}`
			}
		});
		
		if (!response.ok) {
			let errorMessage = 'Failed to fetch models';
			try {
				const errorData = await response.json();
				errorMessage = errorData.error?.message || `API error: ${response.status} ${response.statusText}`;
			} catch (e) {
				errorMessage = `API error: ${response.status} ${response.statusText}`;
			}
			if (response.status === 401 || response.status === 403) {
				showNotification('Invalid API key. Please check your OpenRouter API key.', 'error');
				return [];
			}
			if (response.status === 429) {
				showNotification('Rate limit exceeded. Please try again later.', 'warning');
				return [];
			}
			throw new Error(errorMessage);
		}
		
		const data = await response.json();
		console.log('Available models from API:', data.data?.length || 0);
		
		if (data.error) {
			let errorMessage = data.error.message || 'API returned an error';
			if (errorMessage.toLowerCase().includes('auth') || errorMessage.toLowerCase().includes('key')) {
				showNotification('Invalid API key. Please check your OpenRouter API key.', 'error');
				return [];
			}
			throw new Error(errorMessage);
		}
		
		const models = data.data || [];
		const filteredModels = models.filter(model => true);
		const sortedModels = filteredModels.sort((a, b) => {
			const aFree = a.pricing && a.pricing.prompt === "0" && a.pricing.completion === "0";
			const bFree = b.pricing && b.pricing.prompt === "0" && b.pricing.completion === "0";
			if (aFree && !bFree) return -1;
			if (!aFree && bFree) return 1;
			return 0;
		});
		return sortedModels;
			
	} catch (error) {
		console.error('Error fetching models:', error);
		showNotification(`Error: ${error.message}`, 'error');
		return [];
	}
}

// Send user message and get AI response
async function sendMessage(userMessage) {
	// Add user message to conversation
	const userMsg = {
		role: 'user',
		content: userMessage,
		timestamp: new Date().toISOString()
	};
	
	addMessageToConversation(userMsg);
	
	// Show typing indicator
	showTypingIndicator();
	
	try {
		// Get AI response
		const aiResponse = await sendMessageToAPI(userMessage);
		
		// Hide typing indicator
		hideTypingIndicator();
		
		if (aiResponse) {
			// Add AI response to conversation
			const aiMsg = {
				role: 'assistant',
				content: aiResponse,
				timestamp: new Date().toISOString()
			};
			
			addMessageToConversation(aiMsg);
			
			// Schedule reminder if needed
			scheduleReminderIfNeeded(aiResponse);
		}
		
	} catch (error) {
		// Hide typing indicator
		hideTypingIndicator();
		
		// Add error message to conversation
		const errorMsg = {
			role: 'assistant',
			content: `Sorry, I encountered an error: ${error.message}`,
			timestamp: new Date().toISOString()
		};
		
		addMessageToConversation(errorMsg);
	}
}

// Generate summary of conversation
async function generateSummary() {
	const conversation = getConversation();
	
	if (conversation.length === 0) {
		return 'No conversation to summarize.';
	}
	
	const settings = getSettings();
	
	if (!settings.apiKey) {
		return 'API key not set. Please configure in settings.';
	}
	
	if (!isOnline()) {
		return 'You are offline. Please check your connection.';
	}
	
	try {
		// Create a simplified version of the conversation for summarization
		const conversationText = conversation
			.map(msg => `${msg.role}: ${msg.content}`)
			.join('\n\n');
		
		const summaryPrompt = `Please provide a concise summary of the following conversation:\n\n${conversationText}`;
		
		// Show loading indicator
		showNotification('Generating summary...', 'info');
		
		const summary = await sendMessageToAPI(summaryPrompt);
		
		if (summary) {
			showNotification('Summary generated', 'success');
			return summary;
		} else {
			return 'Failed to generate summary.';
		}
		
	} catch (error) {
		console.error('Error generating summary:', error);
		return `Error generating summary: ${error.message}`;
	}
}

// Extract action items from conversation
async function extractActionItems() {
	const conversation = getConversation();
	
	if (conversation.length === 0) {
		return [];
	}
	
	const settings = getSettings();
	
	if (!settings.apiKey) {
		return [];
	}
	
	if (!isOnline()) {
		return [];
	}
	
	try {
		// Create a simplified version of the conversation
		const conversationText = conversation
			.map(msg => `${msg.role}: ${msg.content}`)
			.join('\n\n');
		
		const actionItemsPrompt = `Extract all action items, tasks, or to-do items from the following conversation. Return them as a numbered list:\n\n${conversationText}`;
		
		// Show loading indicator
		showNotification('Extracting action items...', 'info');
		
		const actionItemsText = await sendMessageToAPI(actionItemsPrompt);
		
		if (actionItemsText) {
			showNotification('Action items extracted', 'success');
			
			// Parse the numbered list into an array
			return actionItemsText
				.split('\n')
				.filter(line => /^\d+\./.test(line))
				.map(line => line.replace(/^\d+\.\s*/, ''));
		} else {
			return [];
		}
		
	} catch (error) {
		console.error('Error extracting action items:', error);
		return [];
	}
}

// Generate insights from conversation
async function generateInsights() {
	const conversation = getConversation();
	
	if (conversation.length === 0) {
		return [];
	}
	
	const settings = getSettings();
	
	if (!settings.apiKey) {
		return [];
	}
	
	if (!isOnline()) {
		return [];
	}
	
	try {
		// Create a simplified version of the conversation
		const conversationText = conversation
			.map(msg => `${msg.role}: ${msg.content}`)
			.join('\n\n');
		
		const insightsPrompt = `Analyze the following conversation and provide key insights, patterns, or observations:\n\n${conversationText}`;
		
		// Show loading indicator
		showNotification('Generating insights...', 'info');
		
		const insightsText = await sendMessageToAPI(insightsPrompt);
		
		if (insightsText) {
			showNotification('Insights generated', 'success');
			
			// Split into paragraphs
			return insightsText
				.split('\n\n')
				.filter(para => para.trim().length > 0);
		} else {
			return [];
		}
		
	} catch (error) {
		console.error('Error generating insights:', error);
		return [];
	}
}