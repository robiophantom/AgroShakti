import api from './Api';

export const hooksService = {
  async soilAnalysis(payload) {
    const { data } = await api.post('/hooks/soil-analysis', payload);
    return data?.data;
  },
  async resourceEstimation(payload) {
    const { data } = await api.post('/hooks/resource-estimation', payload);
    return data?.data;
  },
  async weatherAdvisory(payload) {
    const { data } = await api.post('/hooks/weather-advisory', payload);
    return data?.data;
  },
  async schemeSearch(payload) {
    const { data } = await api.post('/hooks/scheme-search', payload);
    return data?.data;
  }
};

