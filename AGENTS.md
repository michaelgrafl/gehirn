# MementoAI Project Summary

## Overview
MementoAI is an intelligent chat assistant designed for individuals with ADHD to manage daily life, long-term goals, and personal information through a conversational AI interface.

**Elevator Pitch**: "A brain for ADHD people that struggle with planning and staying on track"

## Key Features
- Conversational AI interface for natural interaction
- Persistent memory system for automatic information capture and retrieval
- Progressive Web App (PWA) with cross-device compatibility and offline functionality
- Local storage for privacy and data ownership
- Task and reminder system with smart scheduling
- Context-aware processing and AI-powered assistance

## Target Audience
- Adults and students with ADHD struggling with executive function deficits
- Neurodivergent individuals with similar challenges
- Users who prefer conversational interfaces over traditional productivity tools

## Core Solutions
- Addresses executive function deficits (memory, planning, time management)
- Helps with task initiation, switching, and sustained attention
- Supports maintaining focus on long-term goals
- Reduces cognitive load through automated organization

## Technical Architecture
- Modular structure with CSS/JS files organized by functionality
- Local storage for all personal data
- OpenRouter integration for AI model access
- Responsive design that works across devices

## Unique Value
MementoAI works with users' natural cognitive patterns rather than forcing them into rigid systems, providing structure without rigidity and support without judgment.

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

## Project Structure

MementoAI follows a modular architecture with a clear separation of concerns:

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

*Note: This project structure overview should be updated anytime something important changes in the project.*