const EXTENSION_ID = 'q-clock-ai';
const SUPPORTED_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'gemini.google.com',
  'copilot.microsoft.com',
  'perplexity.ai',
  'huggingchat.co',
  'poe.com',
  'openrouter.ai'
];

function isSupportedUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return SUPPORTED_HOSTS.some(host => hostname.includes(host));
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings', 'tasks'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          enabled: true,
          reasoningBoost: true,
          sandboxEnabled: true,
          nativeBridgeEnabled: false,
          autoRunSafe: false,
          darkMode: false,
          platforms: {
            chatgpt: true,
            claude: true,
            gemini: true,
            copilot: true,
            perplexity: true
          }
        }
      });
    }
    if (!result.tasks) {
      chrome.storage.sync.set({ tasks: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_SETTINGS': {
        const data = await chrome.storage.sync.get(['settings', 'tasks']);
        sendResponse(data);
        break;
      }
      case 'SAVE_SETTINGS': {
        await chrome.storage.sync.set({ settings: message.payload });
        sendResponse({ success: true });
        break;
      }
      case 'SAVE_TASK': {
        const { tasks } = await chrome.storage.sync.get(['tasks']);
        const newTask = {
          id: Date.now().toString(36),
          ...message.payload,
          createdAt: new Date().toISOString()
        };
        tasks.push(newTask);
        await chrome.storage.sync.set({ tasks });

        if (message.payload.scheduledAt) {
          const scheduledTime = new Date(message.payload.scheduledAt).getTime();
          const now = Date.now();
          const delayMs = scheduledTime - now;
          if (delayMs > 60000) {
            const delayMinutes = Math.ceil(delayMs / 60000);
            try {
              await chrome.alarms.create('task-' + newTask.id, { delayInMinutes: delayMinutes });
            } catch (e) {
              console.error('[Q-clock-AI] Failed to create alarm:', e);
            }
          } else if (delayMs > 0) {
            try {
              await chrome.alarms.create('task-' + newTask.id, { delayInMinutes: 1 });
            } catch (e) {
              console.error('[Q-clock-AI] Failed to create alarm:', e);
            }
          } else {
            try {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              if (tab && tab.url && isSupportedUrl(tab.url)) {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'EXECUTE_SCHEDULED_TASK',
                  payload: { code: newTask.code, language: newTask.language, taskId: newTask.id }
                }).catch(() => {});
              }
            } catch (e) {
              console.error('[Q-clock-AI] Immediate task execution error:', e);
            }
          }
        }

        sendResponse({ success: true, task: newTask });
        break;
      }
      case 'REMOVE_TASK': {
        let { tasks } = await chrome.storage.sync.get(['tasks']);
        tasks = tasks.filter(t => t.id !== message.payload);
        await chrome.storage.sync.set({ tasks });

        try {
          await chrome.alarms.clear('task-' + message.payload);
        } catch (e) {
          console.error('[Q-clock-AI] Failed to clear alarm:', e);
        }

        sendResponse({ success: true });
        break;
      }
      case 'GET_TASKS': {
        const data = await chrome.storage.sync.get(['tasks']);
        sendResponse(data);
        break;
      }
      case 'RUN_SANDBOX': {
        const result = await executeSandbox(message.payload);
        sendResponse(result);
        break;
      }
      case 'NATIVE_CREATE_FILE': {
        sendResponse({
          success: false,
          error: 'Native messaging host not configured. To enable file creation, set up a Chrome Native Messaging host manifest pointing to a local executable.'
        });
        break;
      }
      case 'NATIVE_RUN_SCRIPT': {
        sendResponse({
          success: false,
          error: 'Native messaging host not configured. To enable script execution, set up a Chrome Native Messaging host manifest pointing to a local executable.'
        });
        break;
      }
      case 'NATIVE_SCHEDULE_TASK': {
        sendResponse({
          success: false,
          error: 'Native messaging host not configured. To enable task scheduling, set up a Chrome Native Messaging host manifest pointing to a local executable.'
        });
        break;
      }
      case 'QWORK_USAGE': {
        console.log('[Q-clock-AI] Qwork usage detected:', message.payload);
        sendResponse({ received: true });
        break;
      }
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('task-')) {
    const taskId = alarm.name.replace('task-', '');
    const { tasks } = await chrome.storage.sync.get(['tasks']);
    const task = tasks.find(t => t.id === taskId);

    if (!task) return;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && isSupportedUrl(tab.url)) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'EXECUTE_SCHEDULED_TASK',
          payload: { code: task.code, language: task.language, taskId: task.id }
        }).catch(() => {});
      } else {
        console.log('[Q-clock-AI] No active supported tab for scheduled task:', taskId);
      }
    } catch (e) {
      console.error('[Q-clock-AI] Alarm execution error:', e);
    }
  }
});

async function executeSandbox({ code, language }) {
  try {
    if (language === 'javascript' || language === 'js') {
      const result = await runJsInSandbox(code);
      return { success: true, output: result.output, error: result.error };
    }
    return { success: false, error: 'Unsupported language for sandbox' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function runJsInSandbox(code) {
  return new Promise((resolve) => {
    try {
      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      console.log = (...args) => logs.push({ type: 'log', args: args.map(a => JSON.stringify(a)) });
      console.error = (...args) => logs.push({ type: 'error', args: args.map(a => JSON.stringify(a)) });
      console.warn = (...args) => logs.push({ type: 'warn', args: args.map(a => JSON.stringify(a)) });
      let result;
      let error;
      try {
        const fn = new Function(code);
        result = fn();
      } catch (e) {
        error = e.message;
      }
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      resolve({ output: logs, result, error });
    } catch (e) {
      resolve({ output: [], error: e.message });
    }
  });
}
