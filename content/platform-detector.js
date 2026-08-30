const PlatformDetector = (() => {
  const PLATFORMS = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      urlPatterns: ['chatgpt.com', 'chat.openai.com'],
      selectors: {
        chatContainer: 'main .flex-1 overflow-hidden, main [data-testid="conversation-turn"], .group\\/conversation-turn',
        messageBody: '.markdown, [data-message-author-role] .markdown, article .markdown, .prose',
        inputArea: 'form textarea, form [contenteditable="true"], div[contenteditable="true"]',
        sendButton: 'form button[type="submit"], form button[data-testid="send-button"]'
      },
      observer: { childList: true, subtree: true }
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      urlPatterns: ['claude.ai'],
      selectors: {
        chatContainer: 'main .flex-1, .overflow-y-auto',
        messageBody: '.font-claude-message, .prose, [data-testid="message"] p',
        inputArea: 'div[contenteditable="true"], textarea',
        sendButton: 'button[type="submit"], button[aria-label="Send Message"]'
      },
      observer: { childList: true, subtree: true }
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      urlPatterns: ['gemini.google.com'],
      selectors: {
        chatContainer: 'main .conversation-container, .model-response-container',
        messageBody: '.response-content, .markdown, p',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[aria-label="Send"], button[type="submit"]'
      },
      observer: { childList: true, subtree: true }
    },
    copilot: {
      id: 'copilot',
      name: 'Copilot',
      urlPatterns: ['copilot.microsoft.com'],
      selectors: {
        chatContainer: '.chat-container, main .cib-serp-main',
        messageBody: '.cib-message, .markdown, p',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[aria-label="Send"], button[type="submit"]'
      },
      observer: { childList: true, subtree: true }
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      urlPatterns: ['perplexity.ai'],
      selectors: {
        chatContainer: 'main .prose, .answer-container',
        messageBody: '.prose, .markdown, p',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label="Submit"]'
      },
      observer: { childList: true, subtree: true }
    },
    generic: {
      id: 'generic',
      name: 'Generic AI',
      urlPatterns: [],
      selectors: {
        chatContainer: 'main, .chat-container, .conversation',
        messageBody: '.markdown, .prose, article p, .message p',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label="Send"]'
      },
      observer: { childList: true, subtree: true }
    }
  };

  function detect() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    for (const [key, platform] of Object.entries(PLATFORMS)) {
      if (platform.id === 'generic') continue;
      if (platform.urlPatterns.some(pattern => hostname.includes(pattern))) {
        return platform;
      }
    }
    if (document.querySelector('textarea, div[contenteditable="true"]')) {
      return PLATFORMS.generic;
    }
    return null;
  }

  function findElement(platform, selectorName) {
    const platformInfo = PLATFORMS[platform] || PLATFORMS.generic;
    const selector = platformInfo.selectors[selectorName];
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }

  return { detect, findElement, PLATFORMS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformDetector;
}
