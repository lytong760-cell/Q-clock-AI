document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get(['settings']);
  const settings = data.settings || {};

  const applyToggle = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', settings[key] !== false);
    el.addEventListener('click', async () => {
      el.classList.toggle('active');
      settings[key] = el.classList.contains('active');
      await save();
    });
  };

  applyToggle('toggle-enabled', 'enabled');
  applyToggle('toggle-boost', 'reasoningBoost');
  applyToggle('toggle-sandbox', 'sandboxEnabled');
  applyToggle('toggle-native', 'nativeBridgeEnabled');
  applyToggle('toggle-autorun', 'autoRunSafe');
  applyToggle('toggle-confirm', 'confirmActions');

  const saveBtn = document.getElementById('save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const blocked = document.getElementById('blocked-commands');
      if (blocked) {
        settings.blockedCommands = blocked.value.split('\n').filter(c => c.trim());
      }
      await save();
      saveBtn.innerText = 'Saved!';
      setTimeout(() => { saveBtn.innerText = 'Save Settings'; }, 2000);
    });
  }

  async function save() {
    await chrome.storage.sync.set({ settings });
  }
});
