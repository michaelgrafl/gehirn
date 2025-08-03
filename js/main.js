import {
  getSettings,
  loadConversation,
  loadSettings,
  loadMemory,
} from "./state.js";
import { validateApiKey, getAvailableModels, sendMessage } from "./api.js";
import { initPWA } from "./pwa.js";

// DEBUG: Diagnostic logging for DOM element verification
function logDiagnosticInfo() {
  console.log("=== DOM ELEMENT DIAGNOSTICS ===");

  // Check critical DOM elements
  const criticalElements = [
    "chat-form",
    "message-input",
    "settings-toggle",
    "settings-modal",
    "modal-close",
    "modal-overlay",
    "chat-container",
  ];

  console.log("Checking critical DOM elements:");
  criticalElements.forEach((id) => {
    const element = document.getElementById(id);
    console.log(`Element '${id}': ${element ? "EXISTS" : "MISSING"}`);
    if (element) {
      console.log(`  - Tag: ${element.tagName}`);
      console.log(`  - Type: ${element.type || "N/A"}`);
      console.log(`  - Classes: ${element.className || "none"}`);
    }
  });

  console.log("=== END DOM ELEMENT DIAGNOSTICS ===");
}

// Main Application - Initialization and Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the application
  initApp();
});

function initApp() {
  console.log("=== APP INITIALIZATION STARTED ===");

  // DEBUG: Run diagnostic checks first
  logDiagnosticInfo();

  // Set up event listeners
  console.log("Setting up event listeners...");
  setupEventListeners();

  // Load saved data
  console.log("Loading saved data...");
  loadSavedData();

  // Initialize PWA features (includes service worker)
  console.log("Initializing PWA features...");
  initPWA();

  // Check for updates
  console.log("Checking for updates...");
  checkForUpdates();

  // Test model loading
  console.log("Testing model loading...");
  testModelLoading();

  console.log("=== APP INITIALIZATION COMPLETED ===");
}

function setupEventListeners() {
  // Composer UX without form element
  const input = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-button");

  if (input && sendBtn) {
    // Initialize disabled state
    sendBtn.disabled = !input.value.trim();

    // keep disabled state in sync
    input.addEventListener("input", () => {
      sendBtn.disabled = !input.value.trim();
    });

    // Enter to submit, Shift+Enter for newline
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e);
      }
    });

    // Click send
    sendBtn.addEventListener("click", () => {
      if (input.value.trim()) {
        handleFormSubmit(new Event("submit"));
      }
    });
  }

  // Settings toggle button
  const settingsToggle = document.getElementById("settings-toggle");
  if (settingsToggle) {
    settingsToggle.addEventListener("click", () => {
      // Delegate to ui.js implementation
      showModal("settings-modal");
    });
  }

  // Bottom navigation active state + aria-current
  const navItems = document.querySelectorAll(".bottom-navigation .nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".bottom-navigation .nav-item").forEach((n) => {
        n.classList.remove("active");
        n.removeAttribute("aria-current");
      });
      item.classList.add("active");
      item.setAttribute("aria-current", "page");
    });
  });

  // Window resize
  window.addEventListener("resize", handleResize);

  // Online/offline events
  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
}
async function handleFormSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("message-input");
  const message = input.value.trim();

  if (message) {
    // Clear the input field immediately
    input.value = "";
    // Disable the send button
    const sendBtn = document.getElementById("send-button");
    if (sendBtn) {
      sendBtn.disabled = true;
    }

    // Send the message and wait for the response
    await sendMessage(message);
  }
}
function handleResize() {
  // Adjust UI based on window size
  const messagesContainer = document.getElementById("chat-container");
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function handleOnline() {
  // Update UI when coming back online
  showNotification("You are back online", "success");
}

function handleOffline() {
  // Update UI when going offline
  showNotification(
    "You are offline. Some features may not be available.",
    "warning"
  );
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
    validateApiKey()
      .then((v) => {
        if (!v.valid) {
          showNotification(v.message || "Invalid API key", "error");
          return [];
        }
        return getAvailableModels();
      })
      .then((models) => {
        populateModelSelect(models);
      })
      .catch((error) => {
        console.error("Error loading models on page load:", error);
        showNotification("Error loading models", "error");
      });
  }
}

function clearConversation() {
  if (confirm("Are you sure you want to clear the conversation?")) {
    clearConversationData();
    renderMessages([]);
    showNotification("Conversation cleared", "success");
  }
}

function showNotification(message, type = "info") {
  const activity =
    document.getElementById("activity-log") || createActivityLog();
  const item = document.createElement("div");
  item.className = `activity-item ${type}`;
  item.textContent = message;
  item.setAttribute("role", type === "error" ? "alert" : "status");
  item.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  activity.prepend(item);
}

function checkForUpdates() {
  // Check for app updates
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
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
  const updateBar = document.createElement("div");
  updateBar.id = "update-notification";
  updateBar.style.position = "fixed";
  updateBar.style.bottom = "60px"; // Above bottom nav
  updateBar.style.left = "0";
  updateBar.style.right = "0";
  updateBar.style.backgroundColor = "#4caf50";
  updateBar.style.color = "white";
  updateBar.style.padding = "10px";
  updateBar.style.textAlign = "center";
  updateBar.style.zIndex = "1000";
  updateBar.setAttribute("role", "status");
  updateBar.setAttribute("aria-live", "polite");
  updateBar.innerHTML =
    'A new version is available. <button id="update-app" style="background: white; color: #4caf50; border: none; padding: 5px 10px; border-radius: 4px; margin-left: 10px; cursor: pointer;">Update</button>';

  document.body.appendChild(updateBar);

  const updateButton = document.getElementById("update-app");
  if (updateButton) {
    updateButton.addEventListener("click", () => {
      window.location.reload();
    });
  }
}

// DEBUG: Test model loading mechanism
function testModelLoading() {
  console.log("=== MODEL LOADING TEST ===");

  // Check if we can get settings
  try {
    const settings = getSettings();
    console.log("Settings loaded:", settings);

    // Check if model is set
    if (settings.model) {
      console.log("Current model:", settings.model);
    } else {
      console.warn("No model set in settings");
    }

    // Check if API key is set
    if (settings.apiKey) {
      console.log("API key is set (length:", settings.apiKey.length, ")");
    } else {
      console.warn("No API key set");
    }

    // Test model loading from API
    if (settings.apiKey && navigator.onLine) {
      console.log("Testing model loading from API...");
      getAvailableModels()
        .then((models) => {
          console.log("Available models:", models);
          console.log("=== MODEL LOADING TEST COMPLETED ===");
        })
        .catch((error) => {
          console.error("Error loading models:", error);
          console.log("=== MODEL LOADING TEST COMPLETED WITH ERRORS ===");
        });
    } else {
      console.log("Skipping API model test (no API key or offline)");
      console.log("=== MODEL LOADING TEST COMPLETED ===");
    }
  } catch (error) {
    console.error("Error testing model loading:", error);
    console.log("=== MODEL LOADING TEST COMPLETED WITH ERRORS ===");
  }
}

// Populate model select dropdown with available models
function populateModelSelect(models) {
  console.log("=== populateModelSelect STARTED ===");
  console.log("Models to populate:", models.length);

  // This function would need to be updated to work with the actual settings modal
  // For now, we'll just log that it was called
  console.log("populateModelSelect called with models:", models);
}

// Create activity log if it doesn't exist
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
