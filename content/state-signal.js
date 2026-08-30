const StateSignal = (() => {
  let boostActive = false;
  let sandboxActive = false;
  let status = 'idle';
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    window.QCLOCK_AI = window.QCLOCK_AI || {};
    window.QCLOCK_AI.active = true;
    window.QCLOCK_AI.boostActive = false;
    window.QCLOCK_AI.sandboxActive = false;
    window.QCLOCK_AI.status = 'idle';
    window.QCLOCK_AI.qworkActive = false;
    window.QCLOCK_AI.lastAction = null;
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    injectMetaTag();
    injectDOMMarker();
    notifyUI();
  }

  function injectMetaTag() {
    if (document.querySelector('meta[name="qclock-ai"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'qclock-ai';
    meta.content = 'active';
    document.head.appendChild(meta);
  }

  function injectDOMMarker() {
    if (document.getElementById('qclock-ai-signal')) return;
    const marker = document.createElement('div');
    marker.id = 'qclock-ai-signal';
    marker.setAttribute('data-qclock-ai', 'true');
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
    marker.innerText = 'Q-clock-AI is active on this page.';
    document.body.appendChild(marker);
  }

  function setBoostActive(active) {
    boostActive = active;
    window.QCLOCK_AI.boostActive = active;
    window.QCLOCK_AI.lastAction = active ? 'boost-activated' : 'boost-deactivated';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    updateStatus();
  }

  function setSandboxActive(active) {
    sandboxActive = active;
    window.QCLOCK_AI.sandboxActive = active;
    window.QCLOCK_AI.lastAction = active ? 'sandbox-started' : 'sandbox-stopped';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    updateStatus();
  }

  function setStatus(newStatus) {
    status = newStatus;
    window.QCLOCK_AI.status = newStatus;
    window.QCLOCK_AI.lastAction = 'status-changed';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    updateStatus();
  }

  function setQworkActive(active) {
    window.QCLOCK_AI.qworkActive = active;
    window.QCLOCK_AI.lastAction = active ? 'qwork-activated' : 'qwork-deactivated';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
  }

  function updateStatus() {
    if (boostActive && sandboxActive) {
      status = 'boosting';
    } else if (sandboxActive) {
      status = 'processing';
    } else if (boostActive) {
      status = 'boosting';
    }
    window.QCLOCK_AI.status = status;
    notifyUI();
  }

  function notifyUI() {
    window.dispatchEvent(new CustomEvent('qclock-signal', {
      detail: { boostActive, sandboxActive, status }
    }));
  }

  function observeForUI() {
    window.addEventListener('qclock-signal', (event) => {
      const { boostActive: isBoost, sandboxActive: isSandbox, status: currentStatus } = event.detail;
      const indicator = document.getElementById('qclock-status-indicator');
      const label = document.getElementById('qclock-status-label');
      if (indicator) {
        indicator.className = 'qclock-status-indicator';
        if (isBoost) indicator.classList.add('qclock-boosting');
        else if (isSandbox) indicator.classList.add('qclock-processing');
        else indicator.classList.add('qclock-idle');
      }
      if (label) {
        label.innerText = isBoost ? 'Q-clock-AI (Boosting)' : isSandbox ? 'Q-clock-AI (Processing)' : 'Q-clock-AI';
      }
    });
  }

  function isBoostActive() {
    return boostActive;
  }

  function isSandboxActive() {
    return sandboxActive;
  }

  function getStatus() {
    return status;
  }

  return { init, observeForUI, setBoostActive, setSandboxActive, setStatus, setQworkActive, isBoostActive, isSandboxActive, getStatus };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateSignal;
}
