// UI Rendering - Functions for rendering UI elements

// Render messages in the conversation
export function renderMessages(messages) {
  const messagesContainer = document.getElementById("chat-container");
  if (!messagesContainer) return;

  // Clear existing messages
  messagesContainer.innerHTML = "";

  if (!messages || messages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "message-bubble message-welcome";
    empty.innerHTML = `
			<div class="message-avatar" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>')"></div>
			<div class="message-content-container">
				<p class="message-sender">MementoAI</p>
				<p class="message-text ai">Welcome! Paste your OpenRouter key in Settings, pick a model, then start chatting. Tips:<br>• Shift+Enter = newline<br>• Use Remember on AI replies to store notes</p>
			</div>
		`;
    messagesContainer.appendChild(empty);
  } else {
    // Add messages to container
    messages.forEach((message) => {
      const messageElement = createMessageElement(message);
      messagesContainer.appendChild(messageElement);
    });
  }

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Create a message element
function createMessageElement(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-bubble";

  // Create avatar
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";

  // Set avatar based on role
  if (message.role === "user") {
    // User avatar - using a default user icon
    avatarDiv.style.backgroundImage =
      "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2235%22 r=%2215%22 fill=%22%23a0abbb%22/><path d=%22M50,55 C35,55 25,65 25,80 L75,80 C75,65 65,55 50,55 Z%22 fill=%22%23a0abbb%22/></svg>')";
  } else {
    // AI avatar - using the brain icon
    avatarDiv.style.backgroundImage =
      "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>')";
  }

  messageDiv.appendChild(avatarDiv);

  // Create content container
  const contentContainer = document.createElement("div");
  contentContainer.className = "message-content-container";

  // Add sender name
  const senderElement = document.createElement("p");
  senderElement.className = "message-sender";
  senderElement.textContent = message.role === "user" ? "You" : "MementoAI";
  contentContainer.appendChild(senderElement);

  // Add message content
  const messageContent = document.createElement("p");
  messageContent.className = `message-text ${
    message.role === "user" ? "user" : "ai"
  }`;

  if (message.role === "user") {
    messageContent.textContent = message.content;
  } else {
    // For AI messages, render markdown
    messageContent.innerHTML = renderMarkdown(message.content);
  }

  contentContainer.appendChild(messageContent);
  messageDiv.appendChild(contentContainer);

  // Add message actions for AI messages
  if (message.role === "assistant") {
    const messageActions = document.createElement("div");
    messageActions.className = "message-actions";
    messageActions.style.marginLeft = "52px"; // Align with message text

    const copyButton = document.createElement("button");
    copyButton.className = "message-action-btn";
    copyButton.innerHTML = "📋 Copy";
    copyButton.setAttribute("aria-label", "Copy message to clipboard");
    copyButton.addEventListener("click", () =>
      copyToClipboard(message.content)
    );
    messageActions.appendChild(copyButton);

    const rememberButton = document.createElement("button");
    rememberButton.className = "message-action-btn";
    rememberButton.innerHTML = "🧠 Remember";
    rememberButton.setAttribute("aria-label", "Add message to memory");
    rememberButton.addEventListener("click", () =>
      addToMemory(message.content)
    );
    messageActions.appendChild(rememberButton);

    messageDiv.appendChild(messageActions);
  }

  return messageDiv;
}

// Format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Render markdown content
function renderMarkdown(content) {
  // Simple markdown renderer
  let html = content
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*)\*/gim, "<em>$1</em>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`([^`]*)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Unordered lists
    .replace(/^(.*)$/gm, (match) => {
      if (match.trim().startsWith("- ")) {
        return "<li>" + match.trim().substring(2) + "</li>";
      }
      return match;
    })
    // Process lists
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  return html;
}

// Copy text to clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const footer = document.querySelector("footer");
      if (footer) {
        let status = document.getElementById("footer-status");
        if (!status) {
          status = document.createElement("div");
          status.id = "footer-status";
          status.setAttribute("role", "status");
          status.className = "inline-status success";
          footer.appendChild(status);
        }
        status.className = "inline-status success";
        status.textContent = "Copied to clipboard";

        // Announce to screen readers
        status.setAttribute("aria-live", "polite");
      }
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
      const footer = document.querySelector("footer");
      if (footer) {
        let status = document.getElementById("footer-status");
        if (!status) {
          status = document.createElement("div");
          status.id = "footer-status";
          status.setAttribute("role", "alert");
          status.className = "inline-status error";
          footer.appendChild(status);
        }
        status.className = "inline-status error";
        status.textContent = "Failed to copy";

        // Announce to screen readers
        status.setAttribute("aria-live", "assertive");
      }
    });
}

// Add content to memory
function addToMemory(content) {
  const memory = getMemory();
  const updatedMemory = memory ? memory + "\n\n" + content : content;
  saveMemoryData(updatedMemory);
  showNotification("Added to memory", "success");
}

// Show notification
function showNotification(message, type = "info") {
  const activity =
    document.getElementById("activity-log") || createActivityLog();
  const item = document.createElement("div");
  item.className = `activity-item ${type}`;
  item.textContent = message;
  item.setAttribute("role", type === "error" ? "alert" : "status");
  item.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  activity.prepend(item);
  let status =
    document.getElementById("settings-status") || ensureSettingsStatus();
  if (status) {
    status.textContent = message;
    status.className = `inline-status ${type}`;
    status.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  }
}

// Load memory content into dialog
function loadMemoryContent() {
  const memoryContent = document.getElementById("memory-content");
  if (memoryContent) {
    memoryContent.value = getMemory();
  }
}

// Show modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // Focus first focusable element in modal
    const focusable = modal.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();
  }
}

// Hide modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    // Return focus to settings button
    const settingsBtn = document.getElementById("settings-toggle");
    if (settingsBtn) {
      settingsBtn.focus();
      settingsBtn.setAttribute("aria-expanded", "false");
    }
  }
}

// Load settings content into dialog
function loadSettingsContent() {
  const settings = getSettings();

  const apiKey = document.getElementById("api-key");
  const model = document.getElementById("model-select");

  if (apiKey) apiKey.value = settings.apiKey || "";

  // Load available models and populate select if API key is available
  if (settings.apiKey && navigator.onLine) {
    const status = ensureSettingsStatus();
    status.textContent = "Validating API key...";
    status.className = "inline-status info";
    status.setAttribute("aria-live", "polite");
    validateApiKey()
      .then((v) => {
        if (!v.valid) {
          status.textContent = v.message || "Invalid API key";
          status.className = "inline-status error";
          status.setAttribute("aria-live", "assertive");
          if (model) model.value = settings.model || "openai/gpt-3.5-turbo";
          return [];
        }
        status.textContent = "Loading models...";
        status.className = "inline-status info";
        status.setAttribute("aria-live", "polite");
        return getAvailableModels();
      })
      .then((models) => {
        if (Array.isArray(models) && models.length > 0) {
          populateModelSelect(models);
          status.textContent = `${models.length} models loaded`;
          status.className = "inline-status success";
          status.setAttribute("aria-live", "polite");
        }
      })
      .catch((error) => {
        console.error("Error loading models:", error);
        const status = ensureSettingsStatus();
        status.textContent = "Error loading models";
        status.className = "inline-status error";
        status.setAttribute("aria-live", "assertive");
        if (model) model.value = settings.model || "openai/gpt-3.5-turbo";
      });
  } else {
    // Fallback to simple model select
    if (model) model.value = settings.model || "openai/gpt-3.5-turbo";
  }

  // Note: temperature and max-tokens are not in the HTML, using defaults
  // These would need to be added to the HTML if we want to make them configurable
}

// Show typing indicator
export function showTypingIndicator() {
  const messagesContainer = document.getElementById("chat-container");
  if (!messagesContainer) return;

  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "message-bubble";

  // Create AI avatar
  const avatarDiv = document.createElement("div");
  avatarDiv.className = "message-avatar";
  avatarDiv.style.backgroundImage =
    "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>')";
  typingDiv.appendChild(avatarDiv);

  // Create content container
  const contentContainer = document.createElement("div");
  contentContainer.className = "message-content-container";

  // Add sender name
  const senderElement = document.createElement("p");
  senderElement.className = "message-sender";
  senderElement.textContent = "MementoAI";
  contentContainer.appendChild(senderElement);

  // Add typing indicator
  const messageContent = document.createElement("p");
  messageContent.className = "message-text ai";
  messageContent.innerHTML =
    '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  messageContent.setAttribute("aria-label", "MementoAI is typing");
  contentContainer.appendChild(messageContent);

  typingDiv.appendChild(contentContainer);
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Hide typing indicator
export function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Update UI based on online status
function updateOnlineStatusUI(isOnline) {
  const statusElement = document.getElementById("online-status");
  if (statusElement) {
    statusElement.textContent = isOnline ? "Online" : "Offline";
    statusElement.className = isOnline ? "online" : "offline";
    statusElement.setAttribute("aria-live", "polite");
  }
}

// Update character count
function updateCharacterCount() {
  const input = document.getElementById("message-input");
  const counter = document.getElementById("char-counter");

  if (input && counter) {
    const count = input.value.length;
    counter.textContent = `${count}/2000`;

    if (count > 2000) {
      counter.classList.add("over-limit");
      counter.setAttribute("aria-live", "polite");
    } else {
      counter.classList.remove("over-limit");
    }
  }
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  const isDarkMode = document.body.classList.contains("dark-mode");

  try {
    localStorage.setItem("mementoai-dark-mode", isDarkMode);
  } catch (error) {
    console.error("Error saving dark mode preference:", error);
  }

  // Update toggle button if it exists
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (darkModeToggle) {
    darkModeToggle.checked = isDarkMode;
    darkModeToggle.setAttribute("aria-pressed", isDarkMode);
  }
}

// Load dark mode preference
function loadDarkModePreference() {
  try {
    const isDarkMode = localStorage.getItem("mementoai-dark-mode") === "true";
    if (isDarkMode) {
      document.body.classList.add("dark-mode");

      const darkModeToggle = document.getElementById("dark-mode-toggle");
      if (darkModeToggle) {
        darkModeToggle.checked = true;
        darkModeToggle.setAttribute("aria-pressed", "true");
      }
    }
  } catch (error) {
    console.error("Error loading dark mode preference:", error);
  }
}

// Show export dialog
function showExportDialog() {
  const dialog = document.getElementById("export-dialog");
  if (dialog) {
    const exportData = document.getElementById("export-data");
    if (exportData) {
      exportData.value = exportState();
    }
    dialog.style.display = "block";
    dialog.setAttribute("aria-hidden", "false");
  }
}

// Hide export dialog
function hideExportDialog() {
  const dialog = document.getElementById("export-dialog");
  if (dialog) {
    dialog.style.display = "none";
    dialog.setAttribute("aria-hidden", "true");
  }
}

// Show import dialog
function showImportDialog() {
  const dialog = document.getElementById("import-dialog");
  if (dialog) {
    const importData = document.getElementById("import-data");
    if (importData) {
      importData.value = "";
    }
    dialog.style.display = "block";
    dialog.setAttribute("aria-hidden", "false");
  }
}

// Hide import dialog
function hideImportDialog() {
  const dialog = document.getElementById("import-dialog");
  if (dialog) {
    dialog.style.display = "none";
    dialog.setAttribute("aria-hidden", "true");
  }
}

function createActivityLog() {
  let footer = document.querySelector("footer");
  if (!footer) footer = document.body;
  let pane = document.getElementById("activity-log");
  if (!pane) {
    pane = document.createElement("div");
    pane.id = "activity-log";
    pane.className = "activity-log";
    pane.setAttribute("aria-label", "Activity log");
    pane.setAttribute("role", "log");
    footer.appendChild(pane);
  }
  return pane;
}

function ensureSettingsStatus() {
  const panel = document.getElementById("settings-panel");
  let status = document.getElementById("settings-status");
  if (!status && panel) {
    status = document.createElement("div");
    status.id = "settings-status";
    status.className = "inline-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    panel.insertBefore(status, panel.firstChild);
  }
  return status;
}

// Initialize modal functionality
function initModal() {
  const settingsToggle = document.getElementById("settings-toggle");
  const modalClose = document.getElementById("modal-close");
  const modalOverlay = document.getElementById("modal-overlay");

  if (settingsToggle) {
    settingsToggle.addEventListener("click", () => {
      showModal("settings-modal");
      settingsToggle.setAttribute("aria-expanded", "true");
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => hideModal("settings-modal"));
  }

  if (modalOverlay) {
    modalOverlay.addEventListener("click", () => hideModal("settings-modal"));
  }

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    const modal = document.getElementById("settings-modal");
    if (event.key === "Escape" && modal && modal.classList.contains("active")) {
      hideModal("settings-modal");
    }
  });
}

// Update existing settings close button to use modal close
document.addEventListener("DOMContentLoaded", () => {
  initModal();

  const closeSettings = document.getElementById("close-settings");
  if (closeSettings) {
    closeSettings.addEventListener("click", () => hideModal("settings-modal"));
  }
});

// Handle import data
function handleImportData() {
  const importData = document.getElementById("import-data");
  if (importData && importData.value.trim()) {
    const success = importState(importData.value.trim());
    if (success) {
      hideImportDialog();
      showNotification("Data imported successfully", "success");

      // Refresh UI
      renderMessages(getConversation());
      loadSettingsContent();
      loadMemoryContent();
    } else {
      showNotification("Failed to import data", "error");
    }
  }
}
