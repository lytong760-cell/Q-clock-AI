const AISignal = (() => {
  let initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    window.QCLOCK_AI = window.QCLOCK_AI || {};
    window.QCLOCK_AI.status = 'idle';
    window.QCLOCK_AI.qworkActive = false;
    window.QCLOCK_AI.boostActive = false;
    window.QCLOCK_AI.sandboxActive = false;
    window.QCLOCK_AI.lastAction = null;
    window.QCLOCK_AI.lastActionTime = null;

    injectMetaTag();
    injectDOMMarker();
    broadcastStatus();
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

  function broadcastStatus() {
    const status = {
      status: window.QCLOCK_AI.status,
      qworkActive: window.QCLOCK_AI.qworkActive,
      boostActive: window.QCLOCK_AI.boostActive,
      sandboxActive: window.QCLOCK_AI.sandboxActive,
      lastAction: window.QCLOCK_AI.lastAction,
      lastActionTime: window.QCLOCK_AI.lastActionTime,
      timestamp: new Date().toISOString()
    };

    document.dispatchEvent(new CustomEvent('qclock-ai-status', { detail: status }));
    window.dispatchEvent(new Event('qclock-ai-status', { detail: status }));
  }

  function setStatus(status) {
    window.QCLOCK_AI.status = status;
    broadcastStatus();
  }

  function setQworkActive(active) {
    window.QCLOCK_AI.qworkActive = active;
    window.QCLOCK_AI.lastAction = active ? 'qwork-activated' : 'qwork-deactivated';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    broadcastStatus();
  }

  function setBoostActive(active) {
    window.QCLOCK_AI.boostActive = active;
    window.QCLOCK_AI.lastAction = active ? 'boost-activated' : 'boost-deactivated';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    broadcastStatus();
  }

  function setSandboxActive(active) {
    window.QCLOCK_AI.sandboxActive = active;
    window.QCLOCK_AI.lastAction = active ? 'sandbox-started' : 'sandbox-stopped';
    window.QCLOCK_AI.lastActionTime = new Date().toISOString();
    broadcastStatus();
  }

  function getStatus() {
    return window.QCLOCK_AI ? { ...window.QCLOCK_AI } : null;
  }

  function isActive() {
    return window.QCLOCK_AI && window.QCLOCK_AI.status !== 'disabled';
  }

  function observeForAI() {
    if (!window.QCLOCK_AI) return;

    const statusObserver = new MutationObserver(() => {
      broadcastStatus();
    });

    const marker = document.getElementById('qclock-ai-signal');
    if (marker) {
      statusObserver.observe(marker, { attributes: true, attributeFilter: ['data-qclock-ai'] });
    }

    document.addEventListener('qclock-ai-status', () => {
      statusObserver.disconnect();
      setTimeout(() => {
        if (marker) statusObserver.observe(marker, { attributes: true, attributeFilter: ['data-qclock-ai'] });
      }, 0);
    });
  }

  return { init, setStatus, setQworkActive, setBoostActive, setSandboxActive, getStatus, isActive, observeForAI };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AISignal;
}
