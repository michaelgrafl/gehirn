// Notifications and Reminders - Functions for handling notifications and reminders

// Request notification permission
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return Promise.resolve(false);
    }
    
    if (Notification.permission === 'granted') {
        return Promise.resolve(true);
    }
    
    if (Notification.permission !== 'denied') {
        return Notification.requestPermission().then(permission => {
            return permission === 'granted';
        });
    }
    
    return Promise.resolve(false);
}

// Check if notifications are enabled
function areNotificationsEnabled() {
    return Notification.permission === 'granted';
}

// Show a notification
function showNotification(title, options = {}) {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: 'favicon.ico',
            badge: 'favicon.ico',
            ...options
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        return true;
    } else if (Notification.permission !== 'denied') {
        // Request permission and try again
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                return showNotification(title, options);
            }
        });
    }
    
    return false;
}

// Show an in-app notification
function showInAppNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        return false;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = document.createElement('span');
    icon.className = 'notification-icon';
    
    // Set icon based on type
    switch (type) {
        case 'success':
            icon.textContent = '✓';
            break;
        case 'error':
            icon.textContent = '✕';
            break;
        case 'warning':
            icon.textContent = '⚠';
            break;
        default:
            icon.textContent = 'ℹ';
    }
    
    const text = document.createElement('span');
    text.className = 'notification-text';
    text.textContent = message;
    
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
    notification.appendChild(closeButton);
    
    notificationContainer.appendChild(notification);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, duration);
    }
    
    return true;
}

// Schedule a notification
function scheduleNotification(date, title, message) {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }
    
    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return false;
    }
    
    const notificationDate = new Date(date);
    const now = new Date();
    
    if (notificationDate <= now) {
        console.log('Notification date is in the past');
        return false;
    }
    
    const timeout = notificationDate.getTime() - now.getTime();
    
    const notificationId = setTimeout(() => {
        showNotification(title, {
            body: message,
            tag: 'memento-reminder'
        });
    }, timeout);
    
    // Store notification ID for cancellation
    const scheduledNotifications = JSON.parse(localStorage.getItem('memento_scheduled_notifications') || '{}');
    scheduledNotifications[notificationId.toString()] = {
        date: notificationDate.toISOString(),
        title,
        message
    };
    localStorage.setItem('memento_scheduled_notifications', JSON.stringify(scheduledNotifications));
    
    return notificationId;
}

// Cancel a scheduled notification
function cancelScheduledNotification(notificationId) {
    clearTimeout(parseInt(notificationId));
    
    const scheduledNotifications = JSON.parse(localStorage.getItem('memento_scheduled_notifications') || '{}');
    delete scheduledNotifications[notificationId];
    localStorage.setItem('memento_scheduled_notifications', JSON.stringify(scheduledNotifications));
    
    return true;
}

// Cancel all scheduled notifications
function cancelAllScheduledNotifications() {
    const scheduledNotifications = JSON.parse(localStorage.getItem('memento_scheduled_notifications') || '{}');
    
    for (const notificationId in scheduledNotifications) {
        clearTimeout(parseInt(notificationId));
    }
    
    localStorage.setItem('memento_scheduled_notifications', '{}');
    
    return true;
}

// Restore scheduled notifications after page load
function restoreScheduledNotifications() {
    const scheduledNotifications = JSON.parse(localStorage.getItem('memento_scheduled_notifications') || '{}');
    const now = new Date();
    
    for (const notificationId in scheduledNotifications) {
        const notification = scheduledNotifications[notificationId];
        const notificationDate = new Date(notification.date);
        
        if (notificationDate > now) {
            const timeout = notificationDate.getTime() - now.getTime();
            
            setTimeout(() => {
                showNotification(notification.title, {
                    body: notification.message,
                    tag: 'memento-reminder'
                });
            }, timeout);
        } else {
            // Remove expired notifications
            delete scheduledNotifications[notificationId];
        }
    }
    
    localStorage.setItem('memento_scheduled_notifications', JSON.stringify(scheduledNotifications));
}

// Schedule a reminder based on AI response
function scheduleReminderIfNeeded(aiResponse) {
    const settings = getSettings();
    
    if (!settings.autoReminders) {
        return false;
    }
    
    // Look for time-related keywords in the AI response
    const timeKeywords = [
        'tomorrow', 'next week', 'next month', 'next year',
        'in an hour', 'in two hours', 'in a few hours',
        'later today', 'tonight', 'this evening',
        'next Monday', 'next Tuesday', 'next Wednesday', 'next Thursday', 'next Friday', 'next Saturday', 'next Sunday',
        'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let hasTimeKeyword = false;
    for (const keyword of timeKeywords) {
        if (aiResponse.toLowerCase().includes(keyword)) {
            hasTimeKeyword = true;
            break;
        }
    }
    
    if (!hasTimeKeyword) {
        return false;
    }
    
    // Extract potential reminder text
    const sentences = aiResponse.split('. ');
    let reminderText = '';
    
    for (const sentence of sentences) {
        if (sentence.length > 10 && sentence.length < 200) {
            let hasKeyword = false;
            for (const keyword of timeKeywords) {
                if (sentence.toLowerCase().includes(keyword)) {
                    hasKeyword = true;
                    break;
                }
            }
            
            if (hasKeyword) {
                reminderText = sentence.trim();
                break;
            }
        }
    }
    
    if (!reminderText) {
        return false;
    }
    
    // Schedule notification for tomorrow at 9 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return scheduleNotification(tomorrow, 'MementoAI Reminder', reminderText);
}

// Show daily summary notification
function showDailySummaryNotification() {
    const settings = getSettings();
    
    if (!settings.dailySummary || !areNotificationsEnabled()) {
        return false;
    }
    
    const lastSummaryDate = localStorage.getItem('memento_last_summary_date');
    const today = new Date().toDateString();
    
    if (lastSummaryDate === today) {
        return false;
    }
    
    // Schedule for 6 PM
    const now = new Date();
    const summaryTime = new Date();
    summaryTime.setHours(18, 0, 0, 0);
    
    if (summaryTime <= now) {
        // If it's already past 6 PM, schedule for tomorrow
        summaryTime.setDate(summaryTime.getDate() + 1);
    }
    
    const timeout = summaryTime.getTime() - now.getTime();
    
    setTimeout(() => {
        generateDailySummary().then(summary => {
            showNotification('MementoAI Daily Summary', {
                body: summary,
                tag: 'memento-daily-summary'
            });
            
            localStorage.setItem('memento_last_summary_date', today);
        });
    }, timeout);
    
    return true;
}

// Generate daily summary
async function generateDailySummary() {
    const conversation = getConversation();
    
    if (conversation.length === 0) {
        return 'No conversations today.';
    }
    
    // Get today's conversations
    const today = new Date().toDateString();
    const todayConversations = conversation.filter(msg => {
        const msgDate = new Date(msg.timestamp).toDateString();
        return msgDate === today;
    });
    
    if (todayConversations.length === 0) {
        return 'No new conversations today.';
    }
    
    // Generate summary
    try {
        const conversationText = todayConversations
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        const summaryPrompt = `Summarize today's conversation in a concise way, focusing on key points and action items:\n\n${conversationText}`;
        
        const summary = await sendMessageToAPI(summaryPrompt);
        
        if (summary) {
            return summary;
        } else {
            return 'Could not generate summary for today\'s conversations.';
        }
        
    } catch (error) {
        console.error('Error generating daily summary:', error);
        return 'Error generating daily summary.';
    }
}

// Show weekly summary notification
function showWeeklySummaryNotification() {
    const settings = getSettings();
    
    if (!settings.weeklySummary || !areNotificationsEnabled()) {
        return false;
    }
    
    const lastSummaryDate = localStorage.getItem('memento_last_weekly_summary_date');
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    
    if (lastSummaryDate === currentWeek.toString()) {
        return false;
    }
    
    // Schedule for next Sunday at 6 PM
    const now = new Date();
    const summaryTime = new Date();
    summaryTime.setDate(now.getDate() + (7 - now.getDay())); // Next Sunday
    summaryTime.setHours(18, 0, 0, 0);
    
    if (summaryTime <= now) {
        // If it's already past Sunday 6 PM, schedule for next week
        summaryTime.setDate(summaryTime.getDate() + 7);
    }
    
    const timeout = summaryTime.getTime() - now.getTime();
    
    setTimeout(() => {
        generateWeeklySummary().then(summary => {
            showNotification('MementoAI Weekly Summary', {
                body: summary,
                tag: 'memento-weekly-summary'
            });
            
            localStorage.setItem('memento_last_weekly_summary_date', currentWeek.toString());
        });
    }, timeout);
    
    return true;
}

// Get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Generate weekly summary
async function generateWeeklySummary() {
    const conversation = getConversation();
    
    if (conversation.length === 0) {
        return 'No conversations this week.';
    }
    
    // Get this week's conversations
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekConversations = conversation.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= weekStart;
    });
    
    if (weekConversations.length === 0) {
        return 'No new conversations this week.';
    }
    
    // Generate summary
    try {
        const conversationText = weekConversations
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
        
        const summaryPrompt = `Summarize this week's conversations in a concise way, focusing on key points, patterns, and action items:\n\n${conversationText}`;
        
        const summary = await sendMessageToAPI(summaryPrompt);
        
        if (summary) {
            return summary;
        } else {
            return 'Could not generate summary for this week\'s conversations.';
        }
        
    } catch (error) {
        console.error('Error generating weekly summary:', error);
        return 'Error generating weekly summary.';
    }
}

// Show milestone notification
function showMilestoneNotification() {
    const settings = getSettings();
    
    if (!settings.milestoneNotifications || !areNotificationsEnabled()) {
        return false;
    }
    
    const conversation = getConversation();
    const messageCount = conversation.length;
    
    // Check for milestones
    const milestones = [10, 25, 50, 100, 250, 500, 1000];
    
    for (const milestone of milestones) {
        if (messageCount === milestone) {
            const notifiedMilestones = JSON.parse(localStorage.getItem('memento_notified_milestones') || '[]');
            
            if (!notifiedMilestones.includes(milestone)) {
                showNotification('MementoAI Milestone', {
                    body: `Congratulations! You've reached ${milestone} messages!`,
                    tag: 'memento-milestone'
                });
                
                notifiedMilestones.push(milestone);
                localStorage.setItem('memento_notified_milestones', JSON.stringify(notifiedMilestones));
                
                return true;
            }
        }
    }
    
    return false;
}

// Show inactive user notification
function showInactiveUserNotification() {
    const settings = getSettings();
    
    if (!settings.inactiveNotifications || !areNotificationsEnabled()) {
        return false;
    }
    
    const lastActivity = localStorage.getItem('memento_last_activity');
    
    if (!lastActivity) {
        return false;
    }
    
    const lastActivityDate = new Date(lastActivity);
    const now = new Date();
    const daysInactive = Math.floor((now - lastActivityDate) / (1000 * 60 * 60 * 24));
    
    // Check if user has been inactive for 3 days
    if (daysInactive === 3) {
        showNotification('MementoAI Misses You', {
            body: 'It\'s been a few days. Check in and continue your conversation!',
            tag: 'memento-inactive'
        });
        
        return true;
    }
    
    return false;
}

// Update last activity timestamp
function updateLastActivity() {
    localStorage.setItem('memento_last_activity', new Date().toISOString());
}