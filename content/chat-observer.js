const ChatObserver = (() => {
  const State = { IDLE: 'idle', WATCHING: 'watching', BOOSTING: 'boosting', PROCESSING: 'processing' };

  let state = State.IDLE;
  let platformId = null;
  let observer = null;
  let processedTurns = new WeakSet();
  let continuationCount = 0;
  const MAX_CONTINUATIONS = 3;
  let pendingContinuation = null;
  let requestIdCounter = 0;
  let qworkActive = false;
  let boostActive = false;

  function init(platform) {
    platformId = platform ? platform.id : null;
    reset();
  }

  function reset() {
    state = State.IDLE;
    processedTurns = new WeakSet();
    continuationCount = 0;
    pendingContinuation = null;
    requestIdCounter = 0;
    boostActive = false;
    StateSignal.setBoostActive(false);
    StateSignal.setSandboxActive(false);
    StateSignal.setStatus('idle');
  }

  function setQworkActive(active) {
    qworkActive = active;
    if (active) {
      state = State.WATCHING;
      startObserving();
      StateSignal.setStatus('watching');
    } else {
      state = State.IDLE;
      stopObserving();
      StateSignal.setStatus('idle');
    }
    StateSignal.setQworkActive(active);
  }

  function isQworkActive() {
    return qworkActive;
  }

  function startObserving() {
    if (observer) return;
    const chatContainer = PlatformAdapter.findElement(platformId, 'chatContainer');
    if (!chatContainer) {
      setTimeout(startObserving, 2000);
      return;
    }

    observer = new MutationObserver((mutations) => {
      handleMutations(mutations);
    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    scanExistingMessages();
  }

  function stopObserving() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function scanExistingMessages() {
    const adapter = PlatformAdapter.getAdapter(platformId);
    if (!adapter) return;
    const messages = adapter.findAssistantMessages();
    messages.forEach(msg => processMessage(msg));
  }

  function handleMutations(mutations) {
    if (!qworkActive) return;

    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const adapter = PlatformAdapter.getAdapter(platformId);
          if (!adapter) return;

          if (adapter.isAssistantMessage(node)) {
            handleNewMessage(node);
          }

          const messages = adapter.findAssistantMessages(node);
          messages.forEach(msg => handleNewMessage(msg));
        }
      });
    });
  }

  function handleNewMessage(messageElement) {
    if (processedTurns.has(messageElement)) return;

    if (pendingContinuation) {
      const isResponse = consumeContinuationResponse(messageElement);
      if (isResponse) return;
    }

    processMessage(messageElement);
  }

  function processMessage(messageElement) {
    if (!messageElement || processedTurns.has(messageElement)) return;
    processedTurns.add(messageElement);

    const text = messageElement.innerText || messageElement.textContent || '';
    if (text.length < 50) return;

    const codeBlocks = extractCodeBlocks(text);
    if (codeBlocks.length > 0) {
      enhanceCodeBlocks(messageElement, codeBlocks);
    }

    if (isTruncatedResponse(text)) {
      attemptContinuation(messageElement, text);
    }
  }

  function consumeContinuationResponse(messageElement) {
    if (!pendingContinuation) return false;

    const adapter = PlatformAdapter.getAdapter(platformId);
    if (!adapter || !adapter.isAssistantMessage(messageElement)) return false;

    processedTurns.add(messageElement);

    const messageTime = Date.now();
    if (messageTime < pendingContinuation.timestamp) {
      return true;
    }
    if (messageTime - pendingContinuation.timestamp > 30000) {
      resetContinuationState();
      return true;
    }

    const originalElement = pendingContinuation.originalElement;
    const text = messageElement.innerText || messageElement.textContent || '';

    if (text.length > 10) {
      appendContinuation(originalElement, text);
    }

    messageElement.setAttribute('data-qclock-merged', 'true');
    messageElement.style.display = 'none';

    const combinedText = originalElement.innerText || originalElement.textContent || '';
    if (isTruncatedResponse(combinedText) && continuationCount < MAX_CONTINUATIONS) {
      setTimeout(() => {
        attemptContinuation(originalElement, combinedText);
      }, 1000);
    } else {
      resetContinuationState();
      StateSignal.setBoostActive(false);
      StateSignal.setStatus(qworkActive ? 'watching' : 'idle');
    }

    return true;
  }

  function findLastTruncatedMessage() {
    const adapter = PlatformAdapter.getAdapter(platformId);
    if (!adapter) return null;

    const messages = adapter.findAssistantMessages();
    let lastTruncated = null;
    let lastTruncatedTime = 0;

    messages.forEach(msg => {
      const text = msg.innerText || msg.textContent || '';
      if (text.length >= 50 && isTruncatedResponse(text)) {
        const time = parseInt(msg.getAttribute('data-qclock-observed-time') || '0');
        if (time > lastTruncatedTime) {
          lastTruncatedTime = time;
          lastTruncated = msg;
        }
      }
    });

    return lastTruncated;
  }

  function isTruncatedResponse(text) {
    if (!text || text.length < 100) return false;
    const trimmed = text.trim();
    if (trimmed.length < 50) return false;

    let score = 0;

    const codeFences = (trimmed.match(/```/g) || []);
    if (codeFences.length % 2 !== 0) score += 3;

    if (/[,;:]\s*$/.test(trimmed)) score += 1;

    const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
    const lastLine = lines.length > 0 ? lines[lines.length - 1].trim() : '';
    if (lastLine.length > 0 && !/[.!?]$/.test(lastLine) && !/^[\s\W]*$/.test(lastLine)) {
      score += 1;
    }

    if (/<[^>]*$/.test(trimmed)) score += 2;

    if (/\.\.\.\s*$/.test(trimmed)) score += 1;

    const codeIndicators = ['function', 'const ', 'let ', 'var ', 'if (', 'else', 'for (', 'while (', 'return ', 'import ', 'export ', 'class ', '=>'];
    if (codeIndicators.some(ind => lastLine.startsWith(ind))) score += 1;

    if (/^\s{4,}/.test(lastLine)) score += 1;

    return score >= 3;
  }

  function extractCodeBlocks(text) {
    const codeBlocks = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      codeBlocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    return codeBlocks;
  }

  function enhanceCodeBlocks(container, codeBlocks) {
    codeBlocks.forEach((block, index) => {
      const existingCode = container.querySelectorAll('pre code, pre');
      if (existingCode.length > index) {
        const codeEl = existingCode[index];
        if (!codeEl.dataset.qclockEnhanced) {
          codeEl.dataset.qclockEnhanced = 'true';
          UIInjector.injectCodeActions(codeEl, block);
        }
      }
    });
  }

  function generateContinuationId() {
    return 'qclock-continuation-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function attemptContinuation(element, text) {
    if (boostActive) return;
    if (continuationCount >= MAX_CONTINUATIONS) return;
    if (pendingContinuation) return;

    boostActive = true;
    continuationCount++;
    StateSignal.setBoostActive(true);
    StateSignal.setStatus('boosting');

    const requestId = 'req-' + (++requestIdCounter) + '-' + Date.now();
    const continuationId = generateContinuationId();
    const prompt = buildContinuationPrompt(text, continuationId);

    pendingContinuation = {
      id: continuationId,
      requestId: requestId,
      originalElement: element,
      originalText: text,
      timestamp: Date.now()
    };

    element.setAttribute('data-qclock-continuation-id', continuationId);

    sendContinuation(prompt);

    setTimeout(() => {
      if (pendingContinuation && pendingContinuation.id === continuationId) {
        boostActive = false;
        StateSignal.setBoostActive(false);
        if (state === State.BOOSTING) StateSignal.setStatus(qworkActive ? 'watching' : 'idle');
      }
    }, 10000);
  }

  function buildContinuationPrompt(text, continuationId) {
    const truncationMarker = text.trim().slice(-120);
    return `[Q-clock-AI continuation:${continuationId}] Please continue your previous response from where you left off. Do not repeat what you already said. Last visible text: "...${truncationMarker}"`;
  }

  function sendContinuation(prompt) {
    const adapter = PlatformAdapter.getAdapter(platformId);
    if (!adapter) {
      resetContinuationState();
      return;
    }

    const input = PlatformAdapter.findElement(platformId, 'inputArea');
    if (!input) {
      console.log('[Q-clock-AI] No input area found for continuation');
      resetContinuationState();
      return;
    }

    adapter.submitPrompt(input, prompt);

    const sendButton = PlatformAdapter.findElement(platformId, 'sendButton');
    if (sendButton) {
      setTimeout(() => {
        sendButton.click();
      }, 300);
    } else {
      resetContinuationState();
    }
  }

  function appendContinuation(originalElement, continuationText) {
    const contentArea = findContentArea(originalElement);
    if (!contentArea) return;

    const separator = document.createElement('hr');
    separator.className = 'qclock-continuation-separator';
    separator.style.cssText = 'border:none;border-top:1px dashed rgba(167,139,250,0.3);margin:8px 0;';

    const continuationDiv = document.createElement('div');
    continuationDiv.className = 'qclock-continuation-content';
    continuationDiv.setAttribute('data-qclock-continuation', 'true');
    continuationDiv.style.cssText = 'padding:8px 0;border-left:2px solid rgba(167,139,250,0.3);padding-left:12px;margin-top:4px;';
    continuationDiv.textContent = continuationText;

    contentArea.appendChild(separator);
    contentArea.appendChild(continuationDiv);
  }

  function findContentArea(element) {
    const selectors = [
      '.markdown',
      '.prose',
      '[data-message-author-role] .markdown',
      'article .markdown',
      '.font-claude-message',
      '.response-content',
      '.cib-message',
      '.message-content'
    ];

    for (const selector of selectors) {
      try {
        const found = element.querySelector(selector);
        if (found) return found;
      } catch {
        // ignore
      }
    }

    if (element.children.length > 0) {
      return element;
    }

    return null;
  }

  function resetContinuationState() {
    pendingContinuation = null;
    boostActive = false;
    StateSignal.setBoostActive(false);
  }

  function observe(mutations) {
    if (!qworkActive) return;
    handleMutations(mutations);
  }

  function getState() {
    return state;
  }

  function getStatus() {
    return {
      qworkActive,
      boostActive,
      state,
      continuationCount,
      hasPending: !!pendingContinuation
    };
  }

  return {
    init,
    setQworkActive,
    isQworkActive,
    observe,
    processMessage,
    findLastTruncatedMessage,
    isTruncatedResponse,
    attemptContinuation,
    buildContinuationPrompt,
    generateContinuationId,
    sendContinuation,
    appendContinuation,
    getState,
    getStatus,
    reset
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatObserver;
}
