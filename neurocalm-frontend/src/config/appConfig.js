const appConfig = {
  // Toggle between mock frontend data and the real backend integration here.
  useMockDataEnabled: false,
  apiBaseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
};

export default appConfig;
