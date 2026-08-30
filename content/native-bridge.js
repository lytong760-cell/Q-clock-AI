const NativeBridge = (() => {
  let enabled = false;

  function init() {
    Storage.get(['settings']).then(data => {
      if (data.settings) {
        enabled = data.settings.nativeBridgeEnabled || false;
      }
    });
  }

  function isEnabled() {
    return enabled;
  }

  function requestPermission(action, details) {
    return new Promise((resolve) => {
      const confirmed = confirm(
        `Q-clock-AI requests permission to:\n\n${action}\n\n${details || ''}\n\nDo you allow?`
      );
      resolve(confirmed);
    });
  }

  async function createFile(path, content) {
    if (!enabled) {
      return { success: false, error: 'Native bridge not enabled' };
    }
    const allowed = await requestPermission('Create file', `Path: ${path}`);
    if (!allowed) {
      return { success: false, error: 'Permission denied' };
    }
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'NATIVE_CREATE_FILE',
        payload: { path, content }
      });
      return response || { success: false, error: 'No response' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function runScript(path) {
    if (!enabled) {
      return { success: false, error: 'Native bridge not enabled' };
    }
    const allowed = await requestPermission('Run script', `Path: ${path}`);
    if (!allowed) {
      return { success: false, error: 'Permission denied' };
    }
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'NATIVE_RUN_SCRIPT',
        payload: { path }
      });
      return response || { success: false, error: 'No response' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function scheduleTask(cronExpression, command) {
    if (!enabled) {
      return { success: false, error: 'Native bridge not enabled' };
    }
    const allowed = await requestPermission('Schedule task', `${command}\nSchedule: ${cronExpression}`);
    if (!allowed) {
      return { success: false, error: 'Permission denied' };
    }
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'NATIVE_SCHEDULE_TASK',
        payload: { cronExpression, command }
      });
      return response || { success: false, error: 'No response' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return { init, isEnabled, createFile, runScript, scheduleTask };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NativeBridge;
}
