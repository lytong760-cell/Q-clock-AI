const QworkDetector = (() => {
  let active = false;
  let platform = null;
  let observer = null;

  function init() {
    if (active) return;
    active = false;
  }

  function activate(platformId) {
    if (active) return;
    active = true;
    platform = platformId;
    observeInputChanges();
  }

  function deactivate() {
    active = false;
    stopObserving();
  }

  function isActive() {
    return active;
  }

  function observeInputChanges() {
    observeTruncation();
  }

  function observeTruncation() {
    if (!active) return;
    const chatContainer = PlatformDetector.findElement(platform, 'chatContainer');
    if (!chatContainer) {
      setTimeout(observeTruncation, 2000);
      return;
    }

    stopObserving();
    observer = new MutationObserver((mutations) => {
      if (!active) return;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const messages = node.querySelectorAll ? node.querySelectorAll('[data-message-author-role="assistant"], [data-message-author-role="chatgpt"], article, .font-claude-message, [class*="message"]') : [];
            if (messages.length === 0 && node.matches && node.matches('[data-message-author-role="assistant"], article, .font-claude-message, [class*="message"]')) {
              processMessage(node);
            }
            messages.forEach(processMessage);
          }
        });
      });
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
  }

  function processMessage(node) {
    if (!active) return;
    
    const isContinuation = ReasoningBoost.handleContinuationResponse(node);
    if (isContinuation) return;
    
    const text = node.innerText || node.textContent || '';
    if (text.length < 100) return;
    if (ReasoningBoost.isTruncatedResponse(text)) {
      ReasoningBoost.attemptContinuation(node, text);
    }
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  return { init, activate, deactivate, isActive, observeInputChanges };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QworkDetector;
}
