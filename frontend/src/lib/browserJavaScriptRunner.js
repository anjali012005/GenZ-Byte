const RUN_TIMEOUT_MS = 2000;

/**
 * Runs JavaScript in a Web Worker so user code cannot freeze the main UI.
 * This is intended for DSA practice snippets that print answers with console.log.
 *
 * @param {string} code
 * @returns {Promise<{success:boolean, output?:string, error?:string}>}
 */
export function executeJavaScriptInBrowser(code) {
  if (typeof Worker === "undefined") {
    return Promise.resolve({
      success: false,
      error: "Your browser does not support Web Workers.",
    });
  }

  return new Promise((resolve) => {
    const workerSource = `
      const formatValue = (value) => {
        if (typeof value === "undefined") return "undefined";
        if (typeof value === "string") return value;

        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const logs = [];
      const originalConsole = self.console;

      self.console = {
        ...originalConsole,
        log: (...args) => logs.push(args.map(formatValue).join(" ")),
        error: (...args) => logs.push(args.map(formatValue).join(" ")),
        warn: (...args) => logs.push(args.map(formatValue).join(" ")),
      };

      try {
        new Function(${JSON.stringify(code)})();
        self.postMessage({ success: true, output: logs.join("\\n") });
      } catch (error) {
        self.postMessage({
          success: false,
          output: logs.join("\\n"),
          error: error && error.stack ? error.stack : String(error),
        });
      }
    `;

    const workerUrl = URL.createObjectURL(
      new Blob([workerSource], { type: "application/javascript" })
    );
    const worker = new Worker(workerUrl);

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve({
        success: false,
        error: `Time Limit Exceeded. JavaScript code must finish within ${RUN_TIMEOUT_MS / 1000}s.`,
      });
    }, RUN_TIMEOUT_MS);

    worker.onmessage = (event) => {
      window.clearTimeout(timeoutId);
      cleanup();

      resolve({
        ...event.data,
        output: event.data.output || "No output",
      });
    };

    worker.onerror = (error) => {
      window.clearTimeout(timeoutId);
      cleanup();

      resolve({
        success: false,
        error: error.message || "JavaScript execution failed.",
      });
    };
  });
}
