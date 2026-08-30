# Q-clock-AI

Browser extension to boost AI reasoning, run code sandbox, and integrate IDE directly on AI websites.

## Features

- **Reasoning Boost**: Detect truncated AI responses and request continuations via Qwork mode
- **JavaScript Sandbox**: Run code safely in an isolated iframe
- **Code Actions**: Run, save, and copy code blocks directly from chat
- **File Operations**: Save generated code to local files
- **Task Scheduling**: Schedule script execution
- **Multi-Platform**: Support for ChatGPT, Claude, Gemini, Copilot, Perplexity, HuggingChat, Poe, OpenRouter
- **Native Bridge Interface**: Prepared for system operations (requires Native Messaging Host configuration)

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project directory

## Usage

1. Visit a supported AI platform (ChatGPT, Claude, etc.)
2. The Q-clock-AI panel will appear in the bottom-right corner
3. Enable **Qwork mode** using the injected "Qwork" button near the chat input
4. Use the action buttons to:
   - **Boost**: Request continuation of truncated AI responses (requires Qwork mode)
   - **Run**: Run selected code in the sandbox
   - **Save**: Save selected code to a file
   - **Schedule**: Schedule a script task
   - **Settings**: Open extension settings

## Architecture

- `manifest.json` - Extension configuration (Manifest V3)
- `background/background.js` - Service worker for state, alarms, and native bridge stubs
- `content/` - Content scripts injected into AI platforms
  - `platform-detector.js` - Detect AI platform and DOM structure
  - `reasoning-boost.js` - Detect truncated responses, request continuations, and append expanded results
  - `state-signal.js` - Internal state signaling for UI updates
  - `qwork-detector.js` - Watch for truncated messages when Qwork mode is active
  - `sandbox.js` - JavaScript sandbox execution via iframe
  - `ui-injector.js` - Inject UI controls and display results
  - `native-bridge.js` - Interface for system operations (requires Native Messaging Host)
  - `content.js` - Main orchestrator
- `styles/injected.css` - Styles for injected UI
- `popup/` - Extension popup
- `options/` - Settings page

## Security

- JavaScript code execution happens in a sandboxed iframe in content scripts
- Native operations require explicit user confirmation and a configured Native Messaging Host
- No data is sent externally without consent
- All actions are logged and auditable
- The background service worker no longer executes user code directly

## Development

This extension is built with vanilla JavaScript. No build step required.

To test:
1. Load the extension in Chrome
2. Visit a supported AI platform
3. Check the console for `[Q-clock-AI]` logs
4. Enable Qwork mode to activate reasoning boost and continuation features

## License

GNU GPL-3.0
