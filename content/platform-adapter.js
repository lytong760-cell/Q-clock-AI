const PlatformAdapter = (() => {
  const ADAPTERS = {
    chatgpt: {
      id: 'chatgpt',
      name: 'ChatGPT',
      urlPatterns: ['chatgpt.com', 'chat.openai.com'],
      selectors: {
        chatContainer: 'main .flex-1.overflow-hidden, main [data-testid="conversation-turn"], .group\\/conversation-turn',
        inputArea: 'form textarea, form [contenteditable="true"], div[contenteditable="true"]',
        sendButton: 'form button[type="submit"], form button[data-testid="send-button"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('[data-message-author-role="assistant"], [data-message-author-role="chatgpt"]');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('[data-message-author-role="assistant"], [data-message-author-role="chatgpt"]');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        if (el.querySelector('[data-testid="stop-button"]')) return 'streaming';
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    claude: {
      id: 'claude',
      name: 'Claude',
      urlPatterns: ['claude.ai'],
      selectors: {
        chatContainer: 'main .flex-1, .overflow-y-auto',
        inputArea: 'div[contenteditable="true"], textarea',
        sendButton: 'button[type="submit"], button[aria-label="Send Message"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('.font-claude-message, [data-testid="message"]');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('.font-claude-message, [data-testid="message"]');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        if (el.querySelector('[data-testid="stop-button"]')) return 'streaming';
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    gemini: {
      id: 'gemini',
      name: 'Gemini',
      urlPatterns: ['gemini.google.com'],
      selectors: {
        chatContainer: 'main .conversation-container, .model-response-container',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[aria-label="Send"], button[type="submit"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('.response-content, .model-response');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('.response-content, .model-response');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    copilot: {
      id: 'copilot',
      name: 'Copilot',
      urlPatterns: ['copilot.microsoft.com'],
      selectors: {
        chatContainer: '.chat-container, main .cib-serp-main',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[aria-label="Send"], button[type="submit"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('.cib-message, [class*="message"]');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('.cib-message, [class*="message"]');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      urlPatterns: ['perplexity.ai'],
      selectors: {
        chatContainer: 'main .prose, .answer-container',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label="Submit"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('.answer-container, main .prose');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('.answer-container, main .prose');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    },
    generic: {
      id: 'generic',
      name: 'Generic AI',
      urlPatterns: [],
      selectors: {
        chatContainer: 'main, .chat-container, .conversation',
        inputArea: 'textarea, div[contenteditable="true"]',
        sendButton: 'button[type="submit"], button[aria-label="Send"]'
      },
      findAssistantMessages(root) {
        return (root || document).querySelectorAll('article, .message, [class*="assistant"], [class*="response"]');
      },
      isAssistantMessage(el) {
        return el.matches && el.matches('article, .message, [class*="assistant"], [class*="response"]');
      },
      getMessageId(el) {
        return el.getAttribute('data-message-id') || el.id;
      },
      getResponseState(el) {
        return 'complete';
      },
      submitPrompt(input, text) {
        if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
          input.value = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (input.contentEditable === 'true') {
          input.innerText = text;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    }
  };

  function detect() {
    const hostname = window.location.hostname.replace(/^www\./, '');
    for (const [key, adapter] of Object.entries(ADAPTERS)) {
      if (adapter.id === 'generic') continue;
      if (adapter.urlPatterns.some(pattern => hostname.includes(pattern))) {
        return adapter;
      }
    }
    if (document.querySelector('textarea, div[contenteditable="true"]')) {
      return ADAPTERS.generic;
    }
    return null;
  }

  function getAdapter(platformId) {
    return ADAPTERS[platformId] || ADAPTERS.generic;
  }

  function findElement(platformId, selectorName) {
    const adapter = getAdapter(platformId);
    const selector = adapter.selectors[selectorName];
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch {
      return null;
    }
  }

  return { detect, getAdapter, findElement, ADAPTERS };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlatformAdapter;
}
