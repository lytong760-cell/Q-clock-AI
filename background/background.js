const EXTENSION_ID = 'q-clock-ai';

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
        sendResponse({ success: true, task: newTask });
        break;
      }
      case 'REMOVE_TASK': {
        let { tasks } = await chrome.storage.sync.get(['tasks']);
        tasks = tasks.filter(t => t.id !== message.payload);
        await chrome.storage.sync.set({ tasks });
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
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  })();
  return true;
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('task-')) {
    const taskId = alarm.name.replace('task-', '');
    chrome.runtime.sendMessage({
      type: 'TASK_TRIGGERED',
      payload: { taskId }
    }).catch(() => {});
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
