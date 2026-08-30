const Content = (() => {
  let platform = null;
  let observer = null;
  let enabled = true;

  async function init() {
    const data = await Storage.get(['settings']);
    if (data.settings) {
      enabled = data.settings.enabled !== false;
    }

    if (!enabled) {
      console.log('[Q-clock-AI] Extension disabled in settings');
      return;
    }

    platform = PlatformDetector.detect();
    if (!platform) {
      console.log('[Q-clock-AI] No supported platform detected');
      return;
    }

    console.log(`[Q-clock-AI] Platform detected: ${platform.name}`);
    NativeBridge.init();
    ReasoningBoost.init(platform.id);
    UIInjector.inject(platform);
    observeChat();
    setupMessageListener();
  }

  function observeChat() {
    const chatContainer = PlatformDetector.findElement(platform.id, 'chatContainer');
    if (!chatContainer) {
      setTimeout(observeChat, 2000);
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      ReasoningBoost.observe(mutations);
      observeNewMessages();
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });

    observeNewMessages();
  }

  function observeNewMessages() {
    const messages = document.querySelectorAll('[data-message-author-role], .message, article, .font-claude-message, [class*="message"]');
    messages.forEach(msg => ReasoningBoost.processResponse(msg));
  }

  function setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'qclock-internal') {
        handleInternalMessage(event.data);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'TASK_TRIGGERED') {
        console.log('[Q-clock-AI] Task triggered:', message.payload);
      }
      sendResponse({ received: true });
    });
  }

  function handleInternalMessage(message) {
    switch (message.action) {
      case 'runCode':
        Sandbox.runJs(message.code).then(result => {
          UIInjector.showOutput(JSON.stringify(result, null, 2));
        });
        break;
      case 'saveFile':
        UIInjector.saveFile(message.code, message.language);
        break;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Content;
}
