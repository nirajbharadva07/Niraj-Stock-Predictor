const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (import.meta.env.DEV) return 'http://localhost:8001';
  throw new Error('Missing VITE_API_BASE in production. Set it in Netlify environment variables or netlify.toml.');
})();

export default API_BASE_URL;
