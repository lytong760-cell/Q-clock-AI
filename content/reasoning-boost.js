const ReasoningBoost = (() => {
  let currentPlatform = null;
  let boostActive = false;
  let originalText = '';
  let processedTurns = new Set();

  function init(platform) {
    currentPlatform = platform;
    boostActive = false;
    processedTurns.clear();
  }

  function isTruncatedResponse(text) {
    if (!text || text.length < 100) return false;
    const truncationIndicators = [
      /[.!?]\s*$/,
      /```$/,
      /\n\s*$/,
      /<\/[^>]+>\s*$/
    ];
    return truncationIndicators.some(regex => !regex.test(text.trim()));
  }

  function extractCodeBlocks(text) {
    const codeBlocks = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    return codeBlocks;
  }

  function processResponse(messageElement) {
    if (!messageElement || processedTurns.has(messageElement)) return;
    processedTurns.add(messageElement);

    const text = messageElement.innerText || messageElement.textContent || '';
    if (text.length < 50) return;

    const codeBlocks = extractCodeBlocks(text);
    if (codeBlocks.length > 0) {
      enhanceCodeBlocks(messageElement, codeBlocks);
    }

    if (isTruncatedResponse(text)) {
      attemptContinuation(messageElement, text);
    }
  }

  function enhanceCodeBlocks(container, codeBlocks) {
    codeBlocks.forEach((block, index) => {
      const existingCode = container.querySelectorAll('pre code, pre');
      if (existingCode.length > index) {
        const codeEl = existingCode[index];
        if (!codeEl.dataset.qclockEnhanced) {
          codeEl.dataset.qclockEnhanced = 'true';
          UIInjector.injectCodeActions(codeEl, block);
        }
      }
    });
  }

  function attemptContinuation(element, text) {
    if (boostActive) return;
    boostActive = true;
    setTimeout(() => {
      boostActive = false;
    }, 5000);
  }

  function observe(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const messages = node.querySelectorAll ? node.querySelectorAll('[data-message-author-role], .message, article, .font-claude-message, [class*="message"]') : [];
          if (messages.length === 0 && node.matches && node.matches('[data-message-author-role], .message, article, .font-claude-message, [class*="message"]')) {
            processResponse(node);
          }
          messages.forEach(msg => processResponse(msg));
        }
      });
    });
  }

  return { init, observe, processResponse };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReasoningBoost;
}
