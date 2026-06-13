const API_BASE_URL = (() => {
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
  if (import.meta.env.DEV) return 'http://localhost:8001';
  // Default production backend URL when no env var is configured.
  return 'https://niraj-stock-predictor.onrender.com';
})();

export default API_BASE_URL;
