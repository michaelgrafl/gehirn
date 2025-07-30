# CRUSH Development Guidelines

## Build/Lint/Test Commands
- No formal build process (client-side JavaScript application)
- No linting or testing framework configured
- For testing individual functions, use browser developer console
- To test a specific function:
  1. Open index.html in browser
  2. Open developer console (F12)
  3. Call the function directly, e.g., `getSettings()`

## Code Style Guidelines

### Imports and Dependencies
- All dependencies are included in `libs/` directory (marked.min.js, highlight.min.js)
- No module bundler or package manager (no npm/yarn)
- All JavaScript files in `js/` directory are linked directly in `index.html`

### Formatting
- Use 2-space indentation
- Curly braces on same line as condition/function declaration
- No semicolons (ASI - Automatic Semicolon Insertion)
- Single quotes for strings
- Trailing commas in object/array literals

### Types
- No TypeScript or static typing
- Use JSDoc comments for function documentation
- Dynamic typing with explicit checks where needed

### Naming Conventions
- camelCase for variables and functions
- UPPER_CASE for constants
- Descriptive function names (verb + noun)
- Variable names should be descriptive

### Error Handling
- Use try/catch blocks for async operations
- Show user-friendly error messages with `showNotification()`
- Log errors to console with `console.error()`
- Graceful degradation when offline

### DOM Manipulation
- Use `document.getElementById()` for element access
- Prefer direct DOM manipulation over frameworks
- Use template literals for dynamic content

### Asynchronous Operations
- Use async/await for API calls
- Handle loading states with UI indicators
- Always check for online status before API calls

### Storage
- Use localStorage for persistent data
- Functions: `saveSettingsData()`, `getSettings()`, etc.
- Data is stored as JSON strings

### API Integration
- OpenRouter API for AI interactions
- All API functions in `js/api.js`
- Include error handling and user notifications