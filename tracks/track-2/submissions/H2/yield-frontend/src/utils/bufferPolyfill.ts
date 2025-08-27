// Buffer polyfill for midl-js-executor compatibility
export const setupBufferPolyfill = () => {
  if (typeof window !== 'undefined' && !window.Buffer) {
    const { Buffer } = require('buffer');
    window.Buffer = Buffer;
  }
};