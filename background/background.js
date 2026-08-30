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

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('task-')) {
    const taskId = alarm.name.replace('task-', '');
    chrome.runtime.sendMessage({
      type: 'TASK_TRIGGERED',
      payload: { taskId }
    }).catch(() => {});
  }
});
