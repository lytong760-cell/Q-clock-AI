const UIInjector = (() => {
  let container = null;
  let statusIndicator = null;
  let mode = 'idle'; // idle | boosting | error | disabled
  let qworkButton = null;
  let qworkActive = false;

  function inject(platform) {
    remove();
    container = document.createElement('div');
    container.id = 'q-clock-ai-root';
    container.innerHTML = buildHTML(platform);
    document.body.appendChild(container);
    attachEvents();
    setStatus('idle');
    injectChatBarButton();
  }

  function remove() {
    const existing = document.getElementById('q-clock-ai-root');
    if (existing) existing.remove();
    container = null;
    removeChatBarButton();
  }

  function injectChatBarButton() {
    if (qworkButton) return;
    const inputArea = PlatformDetector.findElement(Content.getPlatformId(), 'inputArea');
    if (!inputArea) {
      setTimeout(injectChatBarButton, 2000);
      return;
    }

    qworkButton = document.createElement('button');
    qworkButton.id = 'qclock-qwork-btn';
    qworkButton.className = 'qclock-qwork-btn';
    qworkButton.innerHTML = 'Qwork';
    qworkButton.title = 'Toggle Q-clock Qwork Mode';
    qworkButton.addEventListener('click', toggleQwork);

    if (inputArea.parentNode) {
      inputArea.parentNode.style.position = inputArea.parentNode.style.position || 'relative';
      inputArea.parentNode.insertBefore(qworkButton, inputArea);
    }
  }

  function removeChatBarButton() {
    if (qworkButton && qworkButton.parentNode) {
      qworkButton.parentNode.removeChild(qworkButton);
    }
    qworkButton = null;
  }

  function toggleQwork() {
    qworkActive = !qworkActive;
    if (qworkButton) {
      qworkButton.classList.toggle('qclock-qwork-active', qworkActive);
    }
    setQworkStatus(qworkActive ? 'active' : 'inactive');
    if (qworkActive) {
      showNotification('Qwork mode activated');
      QworkDetector.activate(Content.getPlatformId());
    } else {
      showNotification('Qwork mode deactivated');
      QworkDetector.deactivate();
    }
  }

  function setQworkStatus(status) {
    const existing = document.querySelector('.qclock-qwork-indicator');
    if (existing) existing.remove();

    if (status === 'active') {
      const indicator = document.createElement('div');
      indicator.className = 'qclock-qwork-indicator';
      indicator.innerHTML = '<span class="qclock-qwork-dot"></span><span>Qwork Active</span>';
      document.body.appendChild(indicator);
    }
  }

  function isQworkActive() {
    return qworkActive;
  }

  function buildHTML() {
    return `
      <div id="qclock-panel" class="qclock-hidden">
        <div class="qclock-header">
          <span class="qclock-title">Q-clock-AI</span>
          <div class="qclock-status">
            <span class="qclock-status-dot qclock-idle"></span>
            <span class="qclock-status-text">Ready</span>
          </div>
        </div>
        <div class="qclock-actions">
          <button id="qclock-boost" class="qclock-btn qclock-boost-btn" title="Boost Reasoning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Boost
          </button>
          <button id="qclock-run" class="qclock-btn qclock-run-btn" title="Run in Sandbox">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Run
          </button>
          <button id="qclock-save" class="qclock-btn qclock-save-btn" title="Save File">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save
          </button>
          <button id="qclock-schedule" class="qclock-btn qclock-schedule-btn" title="Schedule Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Schedule
          </button>
          <button id="qclock-settings" class="qclock-btn qclock-settings-btn" title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            Settings
          </button>
        </div>
        <div id="qclock-output" class="qclock-output qclock-hidden">
          <div class="qclock-output-header">
            <span>Output</span>
            <button id="qclock-send-error" class="qclock-small-btn" title="Send error to AI">Send to AI</button>
            <button id="qclock-close-output" class="qclock-small-btn" title="Close">×</button>
          </div>
          <pre id="qclock-output-content"></pre>
        </div>
      </div>
      <div id="qclock-status-bar" class="qclock-status-bar">
        <span id="qclock-status-indicator" class="qclock-status-indicator"></span>
        <span id="qclock-status-label">Q-clock-AI</span>
      </div>
    `;
  }

  function attachEvents() {
    const qclockRun = document.getElementById('qclock-run');
    const qclockSave = document.getElementById('qclock-save');
    const qclockBoost = document.getElementById('qclock-boost');
    const qclockSchedule = document.getElementById('qclock-schedule');
    const qclockSettings = document.getElementById('qclock-settings');
    const qclockCloseOutput = document.getElementById('qclock-close-output');
    const qclockSendError = document.getElementById('qclock-send-error');

    if (qclockRun) {
      qclockRun.addEventListener('click', () => {
        const code = extractCodeFromSelection();
        if (code) {
          runSandbox(code);
        } else {
          showNotification('Please select code to run');
        }
      });
    }

    if (qclockSave) {
      qclockSave.addEventListener('click', () => {
        const code = extractCodeFromSelection();
        if (code) {
          saveFile(code);
        } else {
          showNotification('Please select code to save');
        }
      });
    }

    if (qclockBoost) {
      qclockBoost.addEventListener('click', () => {
        triggerBoost();
      });
    }

    if (qclockSchedule) {
      qclockSchedule.addEventListener('click', () => {
        scheduleTask();
      });
    }

    if (qclockSettings) {
      qclockSettings.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }

    if (qclockCloseOutput) {
      qclockCloseOutput.addEventListener('click', hideOutput);
    }

    if (qclockSendError) {
      qclockSendError.addEventListener('click', () => {
        const content = document.getElementById('qclock-output-content');
        if (content) {
          sendErrorToAI(content.innerText);
        }
      });
    }
  }

  function setStatus(status) {
    mode = status;
    const dot = document.querySelector('.qclock-status-dot');
    const text = document.querySelector('.qclock-status-text');
    const indicator = document.getElementById('qclock-status-indicator');
    const label = document.getElementById('qclock-status-label');

    if (!dot) return;

    dot.className = 'qclock-status-dot';
    if (indicator) indicator.className = 'qclock-status-indicator';

    switch (status) {
      case 'boosting':
        dot.classList.add('qclock-boosting');
        if (text) text.innerText = 'Boosting';
        if (indicator) indicator.classList.add('qclock-boosting');
        if (label) label.innerText = 'Q-clock-AI (Boosting)';
        break;
      case 'error':
        dot.classList.add('qclock-error');
        if (text) text.innerText = 'Error';
        if (indicator) indicator.classList.add('qclock-error');
        if (label) label.innerText = 'Q-clock-AI (Error)';
        break;
      case 'disabled':
        dot.classList.add('qclock-disabled');
        if (text) text.innerText = 'Disabled';
        if (indicator) indicator.classList.add('qclock-disabled');
        if (label) label.innerText = 'Q-clock-AI (Disabled)';
        break;
      case 'idle':
      default:
        dot.classList.add('qclock-idle');
        if (text) text.innerText = 'Ready';
        if (indicator) indicator.classList.add('qclock-idle');
        if (label) label.innerText = 'Q-clock-AI';
        break;
    }
  }

  function injectCodeActions(codeElement, block) {
    const wrapper = document.createElement('div');
    wrapper.className = 'qclock-code-actions';

    const runBtn = document.createElement('button');
    runBtn.className = 'qclock-code-btn';
    runBtn.innerHTML = '▶ Run';
    runBtn.addEventListener('click', () => {
      runSandbox(block.code);
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'qclock-code-btn';
    saveBtn.innerHTML = '💾 Save';
    saveBtn.addEventListener('click', () => {
      saveFile(block.code, block.language);
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'qclock-code-btn';
    copyBtn.innerHTML = '📋 Copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.code);
    });

    wrapper.appendChild(runBtn);
    wrapper.appendChild(saveBtn);
    wrapper.appendChild(copyBtn);

    if (codeElement.parentNode) {
      codeElement.parentNode.style.position = 'relative';
      codeElement.parentNode.insertBefore(wrapper, codeElement);
    }
  }

  function extractCodeFromSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();
      const div = document.createElement('div');
      div.appendChild(fragment);
      const text = div.innerText || div.textContent;
      if (text.trim()) return text.trim();
    }

    const codeBlocks = document.querySelectorAll('pre code, pre, code');
    if (codeBlocks.length > 0) {
      return codeBlocks[0].innerText || codeBlocks[0].textContent;
    }
    return null;
  }

  async function runSandbox(code) {
    setStatus('boosting');
    StateSignal.setBoostActive(true);
    StateSignal.setSandboxActive(true);
    showOutput('Running...');
    try {
      const result = await Sandbox.runJs(code);
      if (result.success) {
        let output = result.logs.map(l => `[${l.type}] ${l.content}`).join('\n');
        if (result.result !== undefined) {
          output += `\n<Returned: ${result.result}>`;
        }
        showOutput(output || '(No output)');
        setStatus('idle');
        StateSignal.setBoostActive(false);
        StateSignal.setSandboxActive(false);
      } else {
        showOutput(`Error: ${result.error}`);
        setStatus('error');
        StateSignal.setBoostActive(false);
        StateSignal.setSandboxActive(false);
      }
    } catch (e) {
      showOutput(`Sandbox error: ${e.message}`);
      setStatus('error');
      StateSignal.setBoostActive(false);
      StateSignal.setSandboxActive(false);
    }
  }

  async function saveFile(code, language = 'js') {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qclock-snippet-${Date.now()}.${language === 'python' ? 'py' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('File saved');
  }

  function triggerBoost() {
    if (!UIInjector.isQworkActive()) {
      showNotification('Enable Qwork mode first');
      return;
    }
    
    const lastMessage = ReasoningBoost.findLastTruncatedMessage();
    if (!lastMessage) {
      showNotification('No truncated response found');
      setStatus('idle');
      return;
    }
    
    setStatus('boosting');
    StateSignal.setBoostActive(true);
    showNotification('Requesting continuation...');
    
    const text = lastMessage.innerText || lastMessage.textContent || '';
    const prompt = ReasoningBoost.buildContinuationPrompt(lastMessage, text, ReasoningBoost.generateContinuationId ? 'manual-' + Date.now() : 'manual');
    ReasoningBoost.sendContinuation(prompt);
    
    setTimeout(() => {
      setStatus('idle');
      StateSignal.setBoostActive(false);
    }, 5000);
  }

  function scheduleTask() {
    const code = prompt('Enter script code to schedule:');
    if (!code) return;
    const delayMinutes = prompt('Schedule after (minutes):', '60');
    if (!delayMinutes) return;

    chrome.runtime.sendMessage({
      type: 'SAVE_TASK',
      payload: {
        code,
        language: 'javascript',
        scheduledAt: new Date(Date.now() + parseInt(delayMinutes) * 60000).toISOString()
      }
    }, (response) => {
      if (response && response.success) {
        showNotification('Task scheduled');
      }
    });
  }

  function showOutput(content) {
    const output = document.getElementById('qclock-output');
    const contentEl = document.getElementById('qclock-output-content');
    if (output && contentEl) {
      output.classList.remove('qclock-hidden');
      contentEl.innerText = content;
    }
  }

  function hideOutput() {
    const output = document.getElementById('qclock-output');
    if (output) {
      output.classList.add('qclock-hidden');
    }
  }

  function sendErrorToAI(text) {
    const input = document.querySelector('textarea, div[contenteditable="true"]');
    if (input) {
      const escaped = text.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const errorMsg = `I got this error when running the code. Please fix it:\n\`\`\`\n${text}\n\`\`\``;
      if (input.tagName.toLowerCase() === 'textarea') {
        input.value = errorMsg;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        input.innerText = errorMsg;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      showNotification('Error sent to AI');
    } else {
      showNotification('Could not find input area');
    }
  }

  function showNotification(message) {
    const existing = document.querySelector('.qclock-notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.className = 'qclock-notification';
    notif.innerText = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  return { inject, remove, setStatus, injectCodeActions, showOutput, hideOutput, injectChatBarButton, toggleQwork, isQworkActive, setQworkStatus, triggerBoost, runSandbox };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIInjector;
}
