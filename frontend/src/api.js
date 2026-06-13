const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8001'
  : 'https://niraj-stock-predictor.onrender.com';

console.log('[API] Using backend URL:', API_BASE_URL);

export default API_BASE_URL;
