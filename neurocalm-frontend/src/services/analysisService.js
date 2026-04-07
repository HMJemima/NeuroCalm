import api from './api';

export const analysisService = {
  async upload(file, options = {}, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    if (options.analysisMode) {
      formData.append('analysis_mode', options.analysisMode);
    }

    const response = await api.post('/analysis/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });
    return response.data;
  },

  async getAnalysis(id) {
    const response = await api.get(`/analysis/${id}`);
    return response.data;
  },

  async deleteAnalysis(id) {
    const response = await api.delete(`/analysis/${id}`);
    return response.data;
  },

  async getHistory(page = 1, pageSize = 10) {
    const response = await api.get(`/history?page=${page}&page_size=${pageSize}`);
    return response.data;
  },

  async getReportPdf(id) {
    const response = await api.get(`/reports/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  async getReportJson(id) {
    const response = await api.get(`/reports/${id}/json`);
    return response.data;
  },
};
