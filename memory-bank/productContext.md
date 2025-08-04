# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-08-04 07:52:08 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

MementoAI is an intelligent chat assistant designed for individuals with ADHD to manage daily life, long-term goals, and personal information through a conversational AI interface.

## Key Features

- Conversational AI interface for natural interaction
- Persistent memory system for automatic information capture and retrieval
- Progressive Web App (PWA) with cross-device compatibility and offline functionality
- Local storage for privacy and data ownership
- Task and reminder system with smart scheduling
- Context-aware processing and AI-powered assistance

## Overall Architecture

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
[2025-08-04 20:50:00] - UMB Update: Enhanced settings modal implementation with improved UI/UX design and full functionality. The settings modal now seamlessly integrates with the current design system and provides multiple ways to interact with it.