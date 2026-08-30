const Sandbox = (() => {
  let iframe = null;
  let consoleLogs = [];

  function getIframe() {
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
      iframe.sandbox = 'allow-scripts';
      document.body.appendChild(iframe);
    }
    return iframe;
  }

  function runJs(code) {
    return new Promise((resolve) => {
      const frame = getIframe();
      const logs = [];
      const startTime = performance.now();

      const script = frame.contentDocument.createElement('script');
      script.textContent = `
        (function() {
          const logs = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;
          const originalTable = console.table;
          const originalDir = console.dir;
          const originalTrace = console.trace;

          console.log = function(...args) {
            logs.push({ type: 'log', content: args.map(a => serialize(a)).join(' ') });
          };
          console.error = function(...args) {
            logs.push({ type: 'error', content: args.map(a => serialize(a)).join(' ') });
          };
          console.warn = function(...args) {
            logs.push({ type: 'warn', content: args.map(a => serialize(a)).join(' ') });
          };
          console.info = function(...args) {
            logs.push({ type: 'info', content: args.map(a => serialize(a)).join(' ') });
          };
          console.table = function(...args) {
            logs.push({ type: 'table', content: JSON.stringify(args[0], null, 2) });
          };
          console.dir = function(...args) {
            logs.push({ type: 'dir', content: JSON.stringify(args[0], null, 2) });
          };
          console.trace = function() {
            logs.push({ type: 'trace', content: new Error().stack });
          };

          function serialize(obj) {
            try {
              if (typeof obj === 'undefined') return 'undefined';
              if (obj === null) return 'null';
              if (typeof obj === 'function') return obj.toString();
              if (typeof obj === 'symbol') return obj.toString();
              if (typeof obj === 'bigint') return obj.toString() + 'n';
              try {
                return JSON.stringify(obj, null, 2);
              } catch {
                return String(obj);
              }
            } catch (e) {
              return '[Unserializable]';
            }
          }

          try {
            const result = (function() {
              ${code}
            })();
            setTimeout(() => {
              parent.postMessage({ type: 'qclock-sandbox-result', logs, result: serialize(result) }, '*');
            }, 0);
          } catch (e) {
            setTimeout(() => {
              parent.postMessage({ type: 'qclock-sandbox-result', logs, error: e.message, stack: e.stack }, '*');
            }, 0);
          }
        })();
      `;

      const handler = (event) => {
        if (event.source === frame.contentWindow && event.data && event.data.type === 'qclock-sandbox-result') {
          window.removeEventListener('message', handler);
          const duration = performance.now() - startTime;
          if (event.data.error) {
            resolve({ success: false, logs: event.data.logs, error: event.data.error, duration });
          } else {
            resolve({ success: true, logs: event.data.logs, result: event.data.result, duration });
          }
        }
      };

      window.addEventListener('message', handler);
      frame.contentDocument.head.appendChild(script);

      setTimeout(() => {
        window.removeEventListener('message', handler);
        if (logs.length === 0 || !logs.some(l => l.type === 'complete')) {
          resolve({ success: false, logs: [{ type: 'error', content: 'Sandbox execution timed out' }], error: 'Timeout' });
        }
      }, 10000);
    });
  }

  async function runPython(code) {
    return { success: false, error: 'Python sandbox not available in MVP. Please use JavaScript.' };
  }

  return { runJs, runPython };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Sandbox;
}
