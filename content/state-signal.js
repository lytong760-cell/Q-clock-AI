const StateSignal = (() => {
  let boostActive = false;
  let sandboxActive = false;
  let status = 'idle';
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;
    observeForUI();
  }

  function setBoostActive(active) {
    boostActive = active;
    updateStatus();
  }

  function setSandboxActive(active) {
    sandboxActive = active;
    updateStatus();
  }

  function setStatus(newStatus) {
    status = newStatus;
    updateStatus();
  }

  function updateStatus() {
    if (boostActive && sandboxActive) {
      status = 'boosting';
    } else if (sandboxActive) {
      status = 'processing';
    } else if (boostActive) {
      status = 'boosting';
    }
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

  return { init, observeForUI, setBoostActive, setSandboxActive, setStatus, isBoostActive, isSandboxActive, getStatus };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateSignal;
}
