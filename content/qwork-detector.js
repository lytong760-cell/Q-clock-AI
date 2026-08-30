const QworkDetector = (() => {
  let active = false;
  let startTime = null;
  let usageCount = 0;
  let lastPlatform = null;

  function init() {
    active = false;
    startTime = null;
    usageCount = 0;
    lastPlatform = null;
  }

  function activate(platform) {
    active = true;
    startTime = startTime || Date.now();
    lastPlatform = platform;
    usageCount++;
    logUsage('activated');
  }

  function deactivate() {
    if (active) {
      logUsage('deactivated');
    }
    active = false;
  }

  function isActive() {
    return active;
  }

  function getStats() {
    return {
      active,
      startTime,
      usageCount,
      lastPlatform,
      duration: startTime ? Date.now() - startTime : 0
    };
  }

  function logUsage(action) {
    const stats = getStats();
    console.log(`[Q-clock-AI] Qwork ${action}:`, {
      platform: stats.lastPlatform,
      usageCount: stats.usageCount,
      duration: stats.duration + 'ms'
    });
  }

  function observeInputChanges() {
    const observer = new MutationObserver((mutations) => {
      if (!active) return;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          chrome.runtime.sendMessage({
            type: 'QWORK_USAGE',
            payload: {
              platform: lastPlatform,
              timestamp: new Date().toISOString(),
              action: 'input_change'
            }
          }).catch(() => {});
        }
      });
    });

    const inputArea = document.querySelector('textarea, div[contenteditable="true"]');
    if (inputArea) {
      observer.observe(inputArea, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  return { init, activate, deactivate, isActive, getStats, observeInputChanges };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = QworkDetector;
}
