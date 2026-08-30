# Q-clock-AI

Browser extension to boost AI reasoning, run code sandbox, and integrate IDE directly on AI websites.

## Features

- **Reasoning Boost**: Detect and expand truncated AI responses
- **JavaScript Sandbox**: Run code safely in an isolated iframe
- **Code Actions**: Run, save, and copy code blocks directly from chat
- **File Operations**: Save generated code to local files
- **Task Scheduling**: Schedule script execution
- **Multi-Platform**: Support for ChatGPT, Claude, Gemini, Copilot, Perplexity, and more
- **Native Bridge**: Optional integration with system file operations

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project directory

## Usage

1. Visit a supported AI platform (ChatGPT, Claude, etc.)
2. The Q-clock-AI panel will appear in the bottom-right corner
3. Use the action buttons to:
   - **Boost**: Activate reasoning boost
   - **Run**: Run selected code in the sandbox
   - **Save**: Save selected code to a file
   - **Schedule**: Schedule a script task
   - **Settings**: Open extension settings

## Architecture

- `manifest.json` - Extension configuration (Manifest V3)
- `background/background.js` - Service worker for state and native bridge
- `content/` - Content scripts injected into AI platforms
  - `platform-detector.js` - Detect AI platform and DOM structure
  - `reasoning-boost.js` - Detect truncated responses and enhance code blocks
  - `sandbox.js` - JavaScript sandbox execution via iframe
  - `ui-injector.js` - Inject UI controls and display results
  - `native-bridge.js` - Bridge to system operations
  - `content.js` - Main orchestrator
- `styles/injected.css` - Styles for injected UI
- `popup/` - Extension popup
- `options/` - Settings page

## Security

- All code execution happens in a sandboxed iframe
- Native operations require explicit user confirmation
- No data is sent externally without consent
- All actions are logged and auditable

## Development

This extension is built with vanilla JavaScript. No build step required.

To test:
1. Load the extension in Chrome
2. Visit an AI platform
3. Check the console for `[Q-clock-AI]` logs

## License

MIT
