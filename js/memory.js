// Memory Management - Functions for handling user memory data

// Save memory to localStorage
function saveMemory(memory) {
    try {
        localStorage.setItem('memento_memory', memory);
        return true;
    } catch (error) {
        console.error('Error saving memory:', error);
        showNotification('Error saving memory: ' + error.message, 'error');
        return false;
    }
}

// Get memory from localStorage
function getMemory() {
    try {
        return localStorage.getItem('memento_memory') || '';
    } catch (error) {
        console.error('Error loading memory:', error);
        showNotification('Error loading memory: ' + error.message, 'error');
        return '';
    }
}

// Update memory with new information
function updateMemory(newInformation) {
    const currentMemory = getMemory();
    let updatedMemory;
    
    if (currentMemory.trim() === '') {
        // If memory is empty, just use the new information
        updatedMemory = newInformation;
    } else {
        // Append new information to existing memory
        updatedMemory = currentMemory + '\n\n' + newInformation;
    }
    
    return saveMemory(updatedMemory);
}

// Clear all memory
function clearMemory() {
    try {
        localStorage.removeItem('memento_memory');
        showNotification('Memory cleared', 'success');
        return true;
    } catch (error) {
        console.error('Error clearing memory:', error);
        showNotification('Error clearing memory: ' + error.message, 'error');
        return false;
    }
}

// Extract memory from conversation
async function extractMemoryFromConversation() {
    const conversation = getConversation();
    
    if (conversation.length === 0) {
        return 'No conversation to extract memory from.';
    }
    
    const settings = getSettings();
    
    if (!settings.apiKey) {
        return 'API key not set. Please configure in settings.';
    }
    
    if (!isOnline()) {
        return 'You are offline. Please check your connection.';
    }
    
    try {
        // Create a simplified version of the conversation
        const conversationText = conversation
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        const extractPrompt = `Extract important personal information, preferences, and context that should be remembered from the following conversation. Focus on facts about the user, their preferences, important dates, relationships, and other personal context:\n\n${conversationText}`;
        
        // Show loading indicator
        showNotification('Extracting memory from conversation...', 'info');
        
        const extractedMemory = await sendMessageToAPI(extractPrompt);
        
        if (extractedMemory) {
            showNotification('Memory extracted successfully', 'success');
            return extractedMemory;
        } else {
            return 'Failed to extract memory from conversation.';
        }
        
    } catch (error) {
        console.error('Error extracting memory:', error);
        return `Error extracting memory: ${error.message}`;
    }
}

// Save extracted memory from conversation
async function saveExtractedMemory() {
    const extractedMemory = await extractMemoryFromConversation();
    
    if (extractedMemory && !extractedMemory.startsWith('Error') && !extractedMemory.startsWith('No conversation')) {
        const success = updateMemory(extractedMemory);
        
        if (success) {
            showNotification('Memory updated with extracted information', 'success');
            return true;
        } else {
            showNotification('Failed to update memory', 'error');
            return false;
        }
    } else {
        showNotification('Failed to extract memory from conversation', 'error');
        return false;
    }
}

// Search memory for specific information
function searchMemory(query) {
    const memory = getMemory();
    
    if (!memory || memory.trim() === '') {
        return [];
    }
    
    // Split memory into paragraphs
    const paragraphs = memory.split('\n\n');
    
    // Find paragraphs containing the query
    const results = paragraphs.filter(paragraph => 
        paragraph.toLowerCase().includes(query.toLowerCase())
    );
    
    return results;
}

// Get memory statistics
function getMemoryStats() {
    const memory = getMemory();
    
    if (!memory) {
        return {
            characterCount: 0,
            wordCount: 0,
            paragraphCount: 0
        };
    }
    
    const characterCount = memory.length;
    const words = memory.trim().split(/\s+/);
    const wordCount = memory.trim() === '' ? 0 : words.length;
    const paragraphs = memory.split('\n\n');
    const paragraphCount = paragraphs.filter(p => p.trim() !== '').length;
    
    return {
        characterCount,
        wordCount,
        paragraphCount
    };
}

// Format memory for display
function formatMemoryForDisplay() {
    const memory = getMemory();
    
    if (!memory || memory.trim() === '') {
        return '<p>No memory information stored yet.</p>';
    }
    
    // Convert markdown-like formatting to HTML
    let formatted = memory
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
        .replace(/`(.*?)`/g, '<code>$1</code>') // Code
        .replace(/\n\n/g, '</p><p>') // Paragraphs
        .replace(/\n/g, '<br>'); // Line breaks
    
    // Wrap in paragraphs
    formatted = '<p>' + formatted + '</p>';
    
    return formatted;
}

// Export memory to a file
function exportMemoryToFile() {
    const memory = getMemory();
    
    if (!memory || memory.trim() === '') {
        showNotification('No memory to export', 'error');
        return false;
    }
    
    try {
        // Create a blob with the memory data
        const blob = new Blob([memory], { type: 'text/plain' });
        
        // Create a download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memento_memory_${new Date().toISOString().split('T')[0]}.txt`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('Memory exported successfully', 'success');
        return true;
        
    } catch (error) {
        console.error('Error exporting memory:', error);
        showNotification('Error exporting memory: ' + error.message, 'error');
        return false;
    }
}

// Import memory from a file
function importMemoryFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const memory = event.target.result;
                
                if (memory.trim() === '') {
                    showNotification('Imported file is empty', 'error');
                    resolve(false);
                    return;
                }
                
                const success = saveMemory(memory);
                
                if (success) {
                    showNotification('Memory imported successfully', 'success');
                    resolve(true);
                } else {
                    resolve(false);
                }
                
            } catch (error) {
                console.error('Error importing memory:', error);
                showNotification('Error importing memory: ' + error.message, 'error');
                reject(error);
            }
        };
        
        reader.onerror = function() {
            showNotification('Error reading file', 'error');
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

// Get memory suggestions based on conversation
async function getMemorySuggestions() {
    const conversation = getConversation();
    
    if (conversation.length < 3) {
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
        // Create a simplified version of the recent conversation
        const recentMessages = conversation.slice(-5);
        const conversationText = recentMessages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        const suggestionPrompt = `Based on this recent conversation, suggest 3-5 pieces of information that might be useful to remember about the user. Return each suggestion on a new line:\n\n${conversationText}`;
        
        const suggestionsText = await sendMessageToAPI(suggestionPrompt);
        
        if (suggestionsText) {
            // Split into lines and filter out empty ones
            return suggestionsText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        } else {
            return [];
        }
        
    } catch (error) {
        console.error('Error getting memory suggestions:', error);
        return [];
    }
}

// Add memory reminder
function addMemoryReminder(text, date) {
    try {
        // Get existing reminders
        const reminders = JSON.parse(localStorage.getItem('memento_reminders') || '[]');
        
        // Add new reminder
        const newReminder = {
            id: Date.now().toString(),
            text,
            date,
            created: new Date().toISOString()
        };
        
        reminders.push(newReminder);
        
        // Save reminders
        localStorage.setItem('memento_reminders', JSON.stringify(reminders));
        
        // Schedule notification
        scheduleNotification(date, 'Memory Reminder', text);
        
        showNotification('Reminder added successfully', 'success');
        return true;
        
    } catch (error) {
        console.error('Error adding reminder:', error);
        showNotification('Error adding reminder: ' + error.message, 'error');
        return false;
    }
}

// Get memory reminders
function getMemoryReminders() {
    try {
        const reminders = JSON.parse(localStorage.getItem('memento_reminders') || '[]');
        return reminders;
    } catch (error) {
        console.error('Error getting reminders:', error);
        return [];
    }
}

// Delete memory reminder
function deleteMemoryReminder(id) {
    try {
        // Get existing reminders
        const reminders = JSON.parse(localStorage.getItem('memento_reminders') || '[]');
        
        // Filter out the reminder with the given id
        const updatedReminders = reminders.filter(reminder => reminder.id !== id);
        
        // Save updated reminders
        localStorage.setItem('memento_reminders', JSON.stringify(updatedReminders));
        
        showNotification('Reminder deleted', 'success');
        return true;
        
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showNotification('Error deleting reminder: ' + error.message, 'error');
        return false;
    }
}