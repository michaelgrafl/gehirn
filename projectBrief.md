# MementoAI Project Brief

## Project Overview
MementoAI is an intelligent chat assistant designed for individuals with ADHD to manage daily life, long-term goals, and personal information through a conversational AI interface.

### Key Features
- Conversational AI interface for natural interaction
- Persistent memory system for automatic information capture and retrieval
- Progressive Web App (PWA) with cross-device compatibility and offline functionality
- Local storage for privacy and data ownership
- Task and reminder system with smart scheduling
- Context-aware processing and AI-powered assistance

## Technical Architecture

### Project Structure
```
MementoAI/
├── css/            # Stylesheet files organized by responsibility
├── js/             # JavaScript modules separated by functionality
├── libs/           # Third-party libraries and dependencies
├── index.html      # Main application entry point
├── sw.js           # Service Worker for PWA functionality
└── AGENTS.md       # Project documentation
```

### CSS Files
- `variables.css` - CSS custom properties and design tokens
- `layout.css` - Page structure and layout components
- `forms.css` - Form elements and input styling
- `messages.css` - Chat interface message styling
- `markdown.css` - Markdown content rendering styles

### JavaScript Files
- `main.js` - Application entry point and orchestrator
- `state.js` - Centralized state management
- `ui.js` - User interface interactions and DOM manipulation
- `api.js` - External API communications
- `memory.js` - Core memory management system
- `notifications.js` - Notification functionality
- `pwa.js` - Progressive Web App features

## Core Components Analysis

### 1. HTML Structure (index.html)
The main HTML file implements a chat interface with:
- Semantic HTML elements for accessibility
- Responsive design with viewport meta tag
- CSS variable-based theming
- Structured layout with header, main content area, and input section
- Preloaded critical CSS for performance

### 2. State Management (js/state.js)
- Centralized state object with localStorage persistence
- Automatic saving of chat history, settings, and memory
- Initialization with default values for all state properties
- Clean separation of concerns for state operations

### 3. User Interface (js/ui.js)
- Dynamic message rendering with user/AI differentiation
- Markdown support for rich text formatting
- Auto-scrolling to latest messages
- Theme switching capabilities
- Responsive design handling
- Loading indicators for AI responses

### 4. API Integration (js/api.js)
- OpenRouter API communication for AI capabilities
- Streaming response handling for real-time message updates
- Error handling for network issues and API errors
- API key management through settings

### 5. Memory System (js/memory.js)
- Automatic extraction of important information from conversations
- Smart reminder creation based on conversation content
- Memory persistence using localStorage
- Background task scheduling for reminder management

### 6. Notifications (js/notifications.js)
- Browser notification API integration
- Background task scheduling using setTimeout/setInterval
- Permission handling for notifications
- Reminder management with localStorage persistence

### 7. Progressive Web App (js/pwa.js & sw.js)
- Service worker implementation for offline functionality
- Cache management for static assets
- Install prompt handling for PWA installation
- Offline fallback strategies

## Key Technical Concepts

### PWA Implementation
- Full offline capability through service worker caching
- Installable as a standalone application
- Background synchronization for tasks
- Push notification support

### Data Management
- Client-side storage using localStorage
- Automatic data persistence across sessions
- Structured data organization for chat history and settings
- Memory system for important information retention

### Responsive Design
- CSS variables for consistent theming
- Flexible layout using CSS Grid and Flexbox
- Mobile-first design approach
- Adaptive component sizing

### Security Considerations
- Client-side API key storage (security risk)
- No server-side data processing
- Local data ownership and privacy

## Potential Improvements

### Security
- Server-side API key management to prevent exposure
- Data encryption for sensitive information
- Secure authentication mechanism

### Performance
- Lazy loading for non-critical JavaScript modules
- Image optimization for any media content
- Code splitting for better initial load times

### Testing
- Unit tests for JavaScript modules
- Integration tests for API communication
- End-to-end tests for user workflows

### Accessibility
- Enhanced screen reader support
- Keyboard navigation improvements
- Contrast optimization for better visibility

## Development Setup

### Starting a Local Webserver
To debug the front-end with the available browser tool, you can start a local webserver using Python on port 5500:

1. Open a terminal in the project root directory
2. Run the following command:
   ```bash
   python -m http.server 5500
   ```
3. Open your browser and navigate to `http://localhost:5500` to view the application

This will serve the MementoAI application locally, allowing you to test and debug the front-end using the browser development tools.