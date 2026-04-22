export const logger = {
  info: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ℹ️  ${msg}`, data);
  },

  success: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${msg}`, data);
  },

  warn: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️  ${msg}`, data);
  },

  error: (msg, data = '') => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${msg}`, data);
  },

  debug: (msg, data = '') => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🔧 ${msg}`, data);
    }
  },
};

export default logger;
