import { Buffer } from 'buffer';

// Create polyfills for AWS SDK browser compatibility
if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).process = { env: {} };
  (window as any).Buffer = Buffer;
}

export {};
