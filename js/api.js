import {
  getSettings,
  isOnline,
  getConversation,
  getMemory,
  addMessageToConversation,
  updateLastMessageInConversation,
} from "./state.js";

import {
  showTypingIndicator,
  hideTypingIndicator,
  ensureSettingsStatus,
} from "./ui.js";
import { scheduleReminderIfNeeded } from "./notifications.js";

// API Interaction - Functions for communicating with the AI API

// API endpoint
const API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Send message to API
async function sendMessageToAPI(message, onChunkReceived = null) {
  const settings = getSettings();

  if (!settings.apiKey) {
    const status = ensureSettingsStatus && ensureSettingsStatus();
    if (status) {
      status.textContent = "API key not set. Please configure in settings.";
      status.className = "inline-status error";
    }
    return null;
  }

  if (!isOnline()) {
    const status = ensureSettingsStatus && ensureSettingsStatus();
    if (status) {
      status.textContent = "You are offline. Please check your connection.";
      status.className = "inline-status error";
    }
    return null;
  }

  try {
    // Create conversation history for API
    const conversation = getConversation();
    const messages = [
      {
        role: "system",
        content:
          "You are MementoAI, a helpful AI assistant. You have access to the user's memory and can use it to provide personalized assistance.",
      },
    ];

    // Add conversation history (limited to last 10 messages to avoid token limits)
    const recentMessages = conversation.slice(-10);
    recentMessages.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: message,
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
      max_tokens: settings.maxTokens,
      stream: !!onChunkReceived, // Enable streaming if onChunkReceived callback is provided
    };

    // Make API request
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    // Handle streaming response
    if (onChunkReceived) {
      return await handleStreamingResponse(response, onChunkReceived);
    }

    // Handle non-streaming response
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("API Error:", error);
    const activity =
      document.getElementById("activity-log") ||
      (typeof createActivityLog === "function" ? createActivityLog() : null);
    if (activity) {
      const item = document.createElement("div");
      item.className = "activity-item error";
      item.textContent = `Error: ${error.message}`;
      activity.prepend(item);
    }
    return null;
  }
}

// Handle streaming response from API
async function handleStreamingResponse(response, onChunkReceived) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        // Skip empty lines and comment lines (starting with ':')
        if (!line.trim() || line.startsWith(":")) {
          continue;
        }

        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: " prefix
          console.log("data: ", data);
          if (data === "[DONE]") {
            // Stream finished
            return accumulatedContent;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              accumulatedContent += content;
              onChunkReceived(content, accumulatedContent);
            }
          } catch (parseError) {
            console.warn("Failed to parse streaming data:", data);
          }
        }
      }
    }

    // Process any remaining data in the buffer
    // Skip empty lines and comment lines (starting with ':')
    if (
      buffer.trim() &&
      !buffer.startsWith(":") &&
      buffer.startsWith("data: ")
    ) {
      const data = buffer.slice(6); // Remove "data: " prefix
      if (data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content || "";
          if (content) {
            accumulatedContent += content;
            onChunkReceived(content, accumulatedContent);
          }
        } catch (parseError) {
          console.warn("Failed to parse remaining streaming data:", data);
        }
      }
    }

    return accumulatedContent;
  } catch (error) {
    console.error("Error handling streaming response:", error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

// Test API connection
async function testAPIConnection() {
  const settings = getSettings();

  if (!settings.apiKey) {
    return {
      success: false,
      message: "API key not set",
    };
  }

  if (!isOnline()) {
    return {
      success: false,
      message: "You are offline",
    };
  }

  try {
    const testMessage =
      'Hello, this is a test message. Please respond with "Connection successful".';
    const response = await sendMessageToAPI(testMessage);

    if (response && response.includes("successful")) {
      return {
        success: true,
        message: "Connection successful",
      };
    } else {
      return {
        success: false,
        message: "Unexpected response from API",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// Quick auth validation using a minimal request
export async function validateApiKey() {
  const settings = getSettings();
  if (!settings.apiKey || !settings.apiKey.trim())
    return { valid: false, message: "API key not set" };
  if (!isOnline()) return { valid: false, message: "You are offline" };
  try {
    const resp = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
        temperature: 0,
      }),
    });
    if (resp.status === 401 || resp.status === 403)
      return {
        valid: false,
        message: "Invalid API key. Please check your OpenRouter API key.",
      };
    return { valid: true };
  } catch (e) {
    return { valid: false, message: e.message };
  }
}

// Get available models
export async function getAvailableModels() {
  const settings = getSettings();

  if (!settings.apiKey || !settings.apiKey.trim()) {
    const status = ensureSettingsStatus && ensureSettingsStatus();
    if (status) {
      status.textContent = "API key not set. Please configure in settings.";
      status.className = "inline-status error";
    }
    return [];
  }

  if (!isOnline()) {
    const status = ensureSettingsStatus && ensureSettingsStatus();
    if (status) {
      status.textContent = "You are offline. Please check your connection.";
      status.className = "inline-status error";
    }
    return [];
  }

  try {
    // Validate key first
    const validation = await validateApiKey();
    if (!validation.valid) {
      showNotification(validation.message || "Invalid API key", "error");
      return [];
    }
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${settings.apiKey}`,
      },
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch models";
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.error?.message ||
          `API error: ${response.status} ${response.statusText}`;
      } catch (e) {
        errorMessage = `API error: ${response.status} ${response.statusText}`;
      }
      if (response.status === 401 || response.status === 403) {
        const status = ensureSettingsStatus && ensureSettingsStatus();
        if (status) {
          status.textContent =
            "Invalid API key. Please check your OpenRouter API key.";
          status.className = "inline-status error";
        }
        return [];
      }
      if (response.status === 429) {
        const status = ensureSettingsStatus && ensureSettingsStatus();
        if (status) {
          status.textContent = "Rate limit exceeded. Please try again later.";
          status.className = "inline-status warning";
        }
        return [];
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Available models from API:", data.data?.length || 0);

    if (data.error) {
      let errorMessage = data.error.message || "API returned an error";
      if (
        errorMessage.toLowerCase().includes("auth") ||
        errorMessage.toLowerCase().includes("key")
      ) {
        showNotification(
          "Invalid API key. Please check your OpenRouter API key.",
          "error"
        );
        return [];
      }
      throw new Error(errorMessage);
    }

    const models = data.data || [];
    const filteredModels = models.filter((model) => true);
    const sortedModels = filteredModels.sort((a, b) => {
      const aFree =
        a.pricing && a.pricing.prompt === "0" && a.pricing.completion === "0";
      const bFree =
        b.pricing && b.pricing.prompt === "0" && b.pricing.completion === "0";
      if (aFree && !bFree) return -1;
      if (!aFree && bFree) return 1;
      return 0;
    });
    return sortedModels;
  } catch (error) {
    console.error("Error fetching models:", error);
    const status = ensureSettingsStatus && ensureSettingsStatus();
    if (status) {
      status.textContent = `Error: ${error.message}`;
      status.className = "inline-status error";
    }
    return [];
  }
}

// Send user message and get AI response
export async function sendMessage(userMessage) {
  // Add user message to conversation
  const userMsg = {
    role: "user",
    content: userMessage,
    timestamp: new Date().toISOString(),
  };

  addMessageToConversation(userMsg);

  // Show typing indicator
  showTypingIndicator();

  // Add initial empty assistant message to conversation
  const aiMsg = {
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
  };
  addMessageToConversation(aiMsg);
  try {
    // Get AI response with streaming
    let accumulatedResponse = "";
    const aiResponse = await sendMessageToAPI(
      userMessage,
      (chunk, accumulated) => {
        // Update accumulated response
        accumulatedResponse = accumulated;

        // Update the last message in the conversation with the partial response
        // This will trigger a re-render of the UI with the updated content
        updateLastMessageInConversation(accumulated);
      }
    );

    // Hide typing indicator
    hideTypingIndicator();

    // If we didn't get a response from streaming, use the final response
    if (!accumulatedResponse && aiResponse) {
      // Update the assistant message with the final response
      updateLastMessageInConversation(aiResponse);

      // Schedule reminder if needed
      scheduleReminderIfNeeded(aiResponse);
    } else if (accumulatedResponse) {
      // Ensure the final response is saved to localStorage
      // The UI was already updated during streaming, but we need to ensure
      // the complete response is stored in the conversation
      updateLastMessageInConversation(accumulatedResponse);
      scheduleReminderIfNeeded(accumulatedResponse);
    }
  } catch (error) {
    // Hide typing indicator
    hideTypingIndicator();

    // Update the assistant message with the error
    updateLastMessageInConversation(
      `Sorry, I encountered an error: ${error.message}`
    );
  }
}

// Generate summary of conversation
async function generateSummary() {
  const conversation = getConversation();

  if (conversation.length === 0) {
    return "No conversation to summarize.";
  }

  const settings = getSettings();

  if (!settings.apiKey) {
    return "API key not set. Please configure in settings.";
  }

  if (!isOnline()) {
    return "You are offline. Please check your connection.";
  }

  try {
    // Create a simplified version of the conversation for summarization
    const conversationText = conversation
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const summaryPrompt = `Please provide a concise summary of the following conversation:\n\n${conversationText}`;

    // Show loading indicator
    const activity =
      document.getElementById("activity-log") ||
      (typeof createActivityLog === "function" ? createActivityLog() : null);
    if (activity) {
      const i = document.createElement("div");
      i.className = "activity-item info";
      i.textContent = "Generating summary...";
      activity.prepend(i);
    }
    const summary = await sendMessageToAPI(summaryPrompt);
    if (summary) {
      if (activity) {
        const i = document.createElement("div");
        i.className = "activity-item success";
        i.textContent = "Summary generated";
        activity.prepend(i);
      }
      return summary;
    } else {
      return "Failed to generate summary.";
    }
  } catch (error) {
    console.error("Error generating summary:", error);
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
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const actionItemsPrompt = `Extract all action items, tasks, or to-do items from the following conversation. Return them as a numbered list:\n\n${conversationText}`;

    // Show loading indicator
    const activity =
      document.getElementById("activity-log") ||
      (typeof createActivityLog === "function" ? createActivityLog() : null);
    if (activity) {
      const i = document.createElement("div");
      i.className = "activity-item info";
      i.textContent = "Extracting action items...";
      activity.prepend(i);
    }
    const actionItemsText = await sendMessageToAPI(actionItemsPrompt);
    if (actionItemsText) {
      if (activity) {
        const i = document.createElement("div");
        i.className = "activity-item success";
        i.textContent = "Action items extracted";
        activity.prepend(i);
      }

      // Parse the numbered list into an array
      return actionItemsText
        .split("\n")
        .filter((line) => /^\d+\./.test(line))
        .map((line) => line.replace(/^\d+\.\s*/, ""));
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error extracting action items:", error);
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
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n\n");

    const insightsPrompt = `Analyze the following conversation and provide key insights, patterns, or observations:\n\n${conversationText}`;

    // Show loading indicator
    const activity =
      document.getElementById("activity-log") ||
      (typeof createActivityLog === "function" ? createActivityLog() : null);
    if (activity) {
      const i = document.createElement("div");
      i.className = "activity-item info";
      i.textContent = "Generating insights...";
      activity.prepend(i);
    }
    const insightsText = await sendMessageToAPI(insightsPrompt);
    if (insightsText) {
      if (activity) {
        const i = document.createElement("div");
        i.className = "activity-item success";
        i.textContent = "Insights generated";
        activity.prepend(i);
      }

      // Split into paragraphs
      return insightsText
        .split("\n\n")
        .filter((para) => para.trim().length > 0);
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}
