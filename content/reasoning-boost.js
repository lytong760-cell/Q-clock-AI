const ReasoningBoost = (() => {
  let currentPlatform = null;
  let boostActive = false;
  let processedTurns = new WeakSet();
  let continuationCount = 0;
  const MAX_CONTINUATIONS = 3;
  let pendingContinuation = null;

  function init(platform) {
    currentPlatform = platform;
    boostActive = false;
    processedTurns = new WeakSet();
    continuationCount = 0;
    pendingContinuation = null;
  }

  function isTruncatedResponse(text) {
    if (!text || text.length < 100) return false;
    const trimmed = text.trim();
    if (trimmed.length < 50) return false;
    
    const abnormalEndings = [
      /```\s*$/,
      /\n\s*$/,
      /\.\.\.\s*$/,
      /<\/[^>]*\s*$/,
      /,\s*$/,
      /[^.!?<>]\s*$/
    ];
    
    return abnormalEndings.some(regex => regex.test(trimmed));
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

  function generateContinuationId() {
    return 'qclock-continuation-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  }

  function processResponse(messageElement) {
    if (!messageElement || processedTurns.has(messageElement)) return;
    if (!UIInjector.isQworkActive()) return;
    
    const text = messageElement.innerText || messageElement.textContent || '';
    if (text.length < 50) return;

    const codeBlocks = extractCodeBlocks(text);
    if (codeBlocks.length > 0) {
      enhanceCodeBlocks(messageElement, codeBlocks);
    }

    if (isTruncatedResponse(text)) {
      attemptContinuation(messageElement, text);
    }
    
    processedTurns.add(messageElement);
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

  function attemptContinuation(element, text) {
    if (boostActive) return;
    if (continuationCount >= MAX_CONTINUATIONS) return;
    if (pendingContinuation) return;
    
    boostActive = true;
    continuationCount++;
    
    const continuationId = generateContinuationId();
    const prompt = buildContinuationPrompt(element, text, continuationId);
    
    pendingContinuation = {
      id: continuationId,
      originalElement: element,
      originalText: text
    };
    
    element.setAttribute('data-qclock-continuation-id', continuationId);
    
    sendContinuation(prompt);
    
    setTimeout(() => {
      boostActive = false;
    }, 10000);
  }

  function buildContinuationPrompt(element, text, continuationId) {
    const truncationMarker = text.trim().slice(-80);
    return `[Q-clock-AI continuation:${continuationId}] Please continue your previous response from where you left off. Do not repeat what you already said. Last visible text: "...${truncationMarker}"`;
  }

  function sendContinuation(prompt) {
    const platformId = Content.getPlatformId();
    if (!platformId) {
      resetContinuationState();
      return;
    }
    
    const input = PlatformDetector.findElement(platformId, 'inputArea');
    if (!input) {
      console.log('[Q-clock-AI] No input area found for continuation');
      resetContinuationState();
      return;
    }
    
    if (input.tagName && input.tagName.toLowerCase() === 'textarea') {
      input.value = prompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (input.contentEditable === 'true') {
      input.innerText = prompt;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const sendButton = PlatformDetector.findElement(platformId, 'sendButton');
    if (sendButton) {
      setTimeout(() => {
        sendButton.click();
StateSignal.setBoostActive(true);
        StateSignal.setStatus('boosting');
      }, 300);
    } else {
      resetContinuationState();
    }
  }

  function handleContinuationResponse(messageElement) {
    if (!pendingContinuation) return false;
    
    const text = messageElement.innerText || messageElement.textContent || '';
    const continuationId = pendingContinuation.id;
    const marker = `[Q-clock-AI continuation:${continuationId}]`;
    
    if (text.includes(marker) || text.includes('continue your previous response')) {
      const originalElement = pendingContinuation.originalElement;
      const originalText = originalElement.innerText || originalElement.textContent || '';
      
      const continuationText = text.replace(marker, '').replace('Please continue your previous response from where you left off. Do not repeat what you already said.', '').trim();
      
      if (continuationText && continuationText.length > 10) {
        appendContinuation(originalElement, continuationText);
      }
      
      messageElement.style.display = 'none';
      messageElement.setAttribute('data-qclock-merged', 'true');
      
      resetContinuationState();
      
      const combinedText = originalElement.innerText || originalElement.textContent || '';
      if (isTruncatedResponse(combinedText) && continuationCount < MAX_CONTINUATIONS) {
        setTimeout(() => {
          attemptContinuation(originalElement, combinedText);
        }, 1000);
      } else {
        boostActive = false;
        StateSignal.setBoostActive(false);
        StateSignal.setStatus('idle');
      }
      
      return true;
    }
    
    return false;
  }

  function appendContinuation(originalElement, continuationText) {
    const existingContent = originalElement.innerHTML || '';
    const separator = '<hr class="qclock-continuation-separator" style="border:none;border-top:1px dashed rgba(167,139,250,0.3);margin:8px 0;">';
    originalElement.innerHTML = existingContent + separator + '<div class="qclock-continuation-content">' + escapeHtml(continuationText) + '</div>';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function resetContinuationState() {
    pendingContinuation = null;
    boostActive = false;
    StateSignal.setBoostActive(false);
  }

  function observe(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const messages = node.querySelectorAll ? node.querySelectorAll('[data-message-author-role], article, .font-claude-message') : [];
          if (messages.length === 0 && node.matches && node.matches('[data-message-author-role], article, .font-claude-message')) {
            const isContinuation = handleContinuationResponse(node);
            if (!isContinuation) {
              processResponse(node);
            }
          }
          messages.forEach(msg => {
            const isContinuation = handleContinuationResponse(msg);
            if (!isContinuation) {
              processResponse(msg);
            }
          });
        }
      });
    });
  }

  return { 
    init, 
    observe, 
    processResponse, 
    isTruncatedResponse, 
    attemptContinuation, 
    findLastTruncatedMessage,
    buildContinuationPrompt,
    sendContinuation,
    handleContinuationResponse
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReasoningBoost;
}
