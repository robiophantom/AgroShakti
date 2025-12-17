import api from './Api';

export const feedbackService = {
  async submitFeedback(payload) {
    const { data } = await api.post('/feedback', payload);
    return data?.data;
  },
  async submitReport(payload) {
    const { data } = await api.post('/feedback/reports', payload);
    return data?.data;
  },
  async listFeedback(params = {}) {
    const { data } = await api.get('/feedback', { params });
    return data?.data;
  },
  async listReports(params = {}) {
    const { data } = await api.get('/feedback/reports', { params });
    return data?.data;
  },
  async resolveReport(id, status) {
    const { data } = await api.put(`/feedback/reports/${id}/resolve`, { status });
    return data?.data;
  }
};

