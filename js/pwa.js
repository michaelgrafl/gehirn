// Progressive Web App (PWA) Functions

// Register service worker
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const installingWorker = registration.installing;
                    
                    installingWorker.addEventListener('statechange', () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // New content is available
                                showUpdateNotification();
                            } else {
                                // Content is cached for offline use
                                console.log('Content is now available offline!');
                            }
                        }
                    });
                });
                
                // Handle controller change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    window.location.reload();
                });
                
                return registration;
            })
            .catch(error => {
                console.error('ServiceWorker registration failed: ', error);
                return null;
            });
    } else {
        console.log('Service workers are not supported.');
        return null;
    }
}

// Show update notification
function showUpdateNotification() {
    const notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification notification-update';
    
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    icon.textContent = '↻';
    
    const text = document.createElement('span');
    text.className = 'notification-text';
    text.textContent = 'New version available. ';
    
    const updateButton = document.createElement('button');
    updateButton.className = 'notification-button';
    updateButton.textContent = 'Update';
    updateButton.onclick = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            });
        }
    };
    
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    };
    
    notification.appendChild(icon);
    notification.appendChild(text);
    notification.appendChild(updateButton);
    notification.appendChild(closeButton);
    
    notificationContainer.appendChild(notification);
}

// Check for app updates
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) {
                registration.update();
            }
        });
    }
}

// Check if app is installed
function isAppInstalled() {
    // Check if app is in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
    }
    
    // Check if app is running from home screen
    if (window.navigator.standalone === true) {
        return true;
    }
    
    return false;
}

// Install app prompt
let deferredPrompt;

function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Update UI notify the user they can install the PWA
        showInstallButton();
    });
    
    window.addEventListener('appinstalled', () => {
        // Log install to analytics
        console.log('PWA was installed');
        // Hide the install button
        hideInstallButton();
        // Clear the deferredPrompt
        deferredPrompt = null;
    });
}

// Show install button
function showInstallButton() {
    const installButton = document.getElementById('install-button');
    
    if (installButton) {
        installButton.style.display = 'block';
        
        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    // Clear the deferredPrompt
                    deferredPrompt = null;
                });
            }
        });
    }
}

// Hide install button
function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    
    if (installButton) {
        installButton.style.display = 'none';
    }
}

// Check online status
function checkOnlineStatus() {
    const updateOnlineStatus = () => {
        const statusElement = document.getElementById('online-status');
        
        if (statusElement) {
            if (navigator.onLine) {
                statusElement.textContent = 'Online';
                statusElement.className = 'online';
                showInAppNotification('You are back online', 'success', 3000);
            } else {
                statusElement.textContent = 'Offline';
                statusElement.className = 'offline';
                showInAppNotification('You are offline. Some features may not be available.', 'warning', 5000);
            }
        }
        
        // Update state
        updateOnlineStatusInState(navigator.onLine);
    };
    
    // Set initial status
    updateOnlineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// Update online status in state
function updateOnlineStatusInState(isOnline) {
    const state = getAppState();
    state.isOnline = isOnline;
    saveAppState(state);
}

// Check if app is in background
function setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // App came to foreground
            console.log('App is visible');
            checkForUpdates();
            
            // Check for inactive user notification
            showInactiveUserNotification();
        } else {
            // App went to background
            console.log('App is hidden');
            updateLastActivity();
        }
    });
}

// Setup before unload event
function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
        // Save state before unloading
        saveAppState(getAppState());
        updateLastActivity();
    });
}

// Initialize PWA features
function initPWA() {
    // Register service worker
    registerServiceWorker();
    
    // Setup install prompt
    setupInstallPrompt();
    
    // Check online status
    checkOnlineStatus();
    
    // Setup visibility change
    setupVisibilityChange();
    
    // Setup before unload
    setupBeforeUnload();
    
    // Show milestone notification
    showMilestoneNotification();
    
    // Show daily summary notification
    showDailySummaryNotification();
    
    // Show weekly summary notification
    showWeeklySummaryNotification();
    
    // Restore scheduled notifications
    restoreScheduledNotifications();
}

// Check if PWA is supported
function isPWASupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get PWA status
function getPWAStatus() {
    return {
        supported: isPWASupported(),
        installed: isAppInstalled(),
        notificationsEnabled: areNotificationsEnabled(),
        serviceWorkerRegistered: 'serviceWorker' in navigator,
        online: navigator.onLine
    };
}

// Share content using Web Share API
async function shareContent(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            return true;
        } catch (error) {
            console.error('Error sharing:', error);
            return false;
        }
    } else {
        console.log('Web Share API is not supported in your browser.');
        return false;
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showInAppNotification('Copied to clipboard', 'success', 2000);
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showInAppNotification('Copied to clipboard', 'success', 2000);
            return true;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            showInAppNotification('Failed to copy to clipboard', 'error', 2000);
            return false;
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// Request persistent storage
async function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
        try {
            const isPersisted = await navigator.storage.persist();
            console.log(`Storage persisted: ${isPersisted}`);
            return isPersisted;
        } catch (error) {
            console.error('Error requesting persistent storage:', error);
            return false;
        }
    } else {
        console.log('Persistent storage is not supported.');
        return false;
    }
}

// Check storage estimate
async function checkStorageEstimate() {
    if (navigator.storage && navigator.storage.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            console.log('Storage estimate:', estimate);
            return estimate;
        } catch (error) {
            console.error('Error getting storage estimate:', error);
            return null;
        }
    } else {
        console.log('Storage estimate is not supported.');
        return null;
    }
}

// Clear app data
async function clearAppData() {
    try {
        // Clear localStorage
        localStorage.clear();
        
        // Clear caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }
        
        // Unregister service workers
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(
                registrations.map(registration => registration.unregister())
            );
        }
        
        showInAppNotification('App data cleared successfully', 'success', 3000);
        
        // Reload page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('Error clearing app data:', error);
        showInAppNotification('Error clearing app data: ' + error.message, 'error', 5000);
        return false;
    }
}

// Check for app updates periodically
function setupPeriodicUpdateCheck() {
    // Check for updates every hour
    setInterval(checkForUpdates, 60 * 60 * 1000);
}