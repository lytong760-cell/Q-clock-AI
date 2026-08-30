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

    platform = PlatformAdapter.detect();
    if (!platform) {
      console.log('[Q-clock-AI] No supported platform detected');
      return;
    }

    console.log(`[Q-clock-AI] Platform detected: ${platform.name}`);
    NativeBridge.init();
    StateSignal.init();
    StateSignal.observeForUI();
    ChatObserver.init(platform);
    UIInjector.inject(platform);
    setupMessageListener();
  }

  function getPlatformId() {
    return platform ? platform.id : null;
  }

  function observeChat() {
    const chatContainer = PlatformAdapter.findElement(platform.id, 'chatContainer');
    if (!chatContainer) {
      setTimeout(observeChat, 2000);
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      ChatObserver.observe(mutations);
    });

    observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
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
      if (message.type === 'EXECUTE_SCHEDULED_TASK') {
        handleScheduledTask(message.payload);
      }
      sendResponse({ received: true });
    });
  }

  function handleScheduledTask(payload) {
    if (payload && payload.code) {
      StateSignal.setStatus('processing');
      StateSignal.setSandboxActive(true);
      Sandbox.runJs(payload.code).then(result => {
        console.log('[Q-clock-AI] Scheduled task result:', result);
        StateSignal.setStatus('idle');
        StateSignal.setSandboxActive(false);
      });
    }
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

  return { init, getPlatformId };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Content;
}
