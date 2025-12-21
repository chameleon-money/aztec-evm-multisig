/**
 * Polyfills for Node.js built-ins in the browser
 * Required for Aztec.js and other blockchain libraries
 */

if (typeof window !== "undefined") {
  // Polyfill Buffer globally
  const { Buffer } = require("buffer");

  if (!window.Buffer) {
    window.Buffer = Buffer;
  }

  // Polyfill global if needed
  if (!window.global) {
    window.global = window;
  }

  // Polyfill process if needed
  if (!window.process) {
    window.process = require("process/browser");
  }
}

export {};
