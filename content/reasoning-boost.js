const ReasoningBoost = (() => {
  function init(platform) {
    ChatObserver.init(platform);
  }

  function observe(mutations) {
    ChatObserver.observe(mutations);
  }

  function processResponse(messageElement) {
    ChatObserver.processMessage(messageElement);
  }

  function isTruncatedResponse(text) {
    return ChatObserver.isTruncatedResponse(text);
  }

  function attemptContinuation(element, text) {
    ChatObserver.attemptContinuation(element, text);
  }

  function findLastTruncatedMessage() {
    return ChatObserver.findLastTruncatedMessage();
  }

  function buildContinuationPrompt(element, text, continuationId) {
    return ChatObserver.buildContinuationPrompt(text, continuationId);
  }

  function generateContinuationId() {
    return ChatObserver.generateContinuationId();
  }

  function sendContinuation(prompt) {
    ChatObserver.sendContinuation(prompt);
  }

  function handleContinuationResponse(messageElement) {
    return false;
  }

  return {
    init,
    observe,
    processResponse,
    isTruncatedResponse,
    attemptContinuation,
    findLastTruncatedMessage,
    buildContinuationPrompt,
    generateContinuationId,
    sendContinuation,
    handleContinuationResponse
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReasoningBoost;
}
