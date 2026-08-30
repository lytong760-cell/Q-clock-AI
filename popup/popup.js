document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get(['settings']);
  const settings = data.settings || {};

  const toggleBoost = document.getElementById('toggle-boost');
  const toggleSandbox = document.getElementById('toggle-sandbox');
  const toggleNative = document.getElementById('toggle-native');
  const toggleAutorun = document.getElementById('toggle-autorun');

  if (toggleBoost) toggleBoost.classList.toggle('active', settings.reasoningBoost !== false);
  if (toggleSandbox) toggleSandbox.classList.toggle('active', settings.sandboxEnabled !== false);
  if (toggleNative) toggleNative.classList.toggle('active', settings.nativeBridgeEnabled || false);
  if (toggleAutorun) toggleAutorun.classList.toggle('active', settings.autoRunSafe || false);

  const applyToggle = (element, key) => {
    if (!element) return;
    element.addEventListener('click', async () => {
      const isActive = element.classList.contains('active');
      element.classList.toggle('active');
      const newSettings = { ...settings, [key]: !isActive };
      await chrome.storage.sync.set({ settings: newSettings });
      updateStatus(newSettings);
    });
  };

  applyToggle(toggleBoost, 'reasoningBoost');
  applyToggle(toggleSandbox, 'sandboxEnabled');
  applyToggle(toggleNative, 'nativeBridgeEnabled');
  applyToggle(toggleAutorun, 'autoRunSafe');

  function updateStatus(newSettings) {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    if (newSettings.enabled === false) {
      if (statusText) statusText.innerText = 'Disabled';
      if (statusIndicator) {
        statusIndicator.style.background = 'rgba(107, 114, 128, 0.1)';
        statusIndicator.style.borderColor = 'rgba(107, 114, 128, 0.2)';
        statusIndicator.style.color = '#6b7280';
      }
    } else {
      if (statusText) statusText.innerText = 'Active';
      if (statusIndicator) {
        statusIndicator.style.background = 'rgba(34, 197, 94, 0.1)';
        statusIndicator.style.borderColor = 'rgba(34, 197, 94, 0.2)';
        statusIndicator.style.color = '#22c55e';
      }
    }
  }

  chrome.runtime.sendMessage({ type: 'GET_TASKS' }, (response) => {
    if (response && response.tasks) {
      console.log('[Q-clock-AI] Scheduled tasks:', response.tasks.length);
    }
  });
});
