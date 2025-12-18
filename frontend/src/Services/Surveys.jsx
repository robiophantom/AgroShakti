import api from './Api';

export const surveysService = {
  async getActive() {
    const { data } = await api.get('/surveys/active');
    return data?.data;
  },

  async list(params = {}) {
    const { data } = await api.get('/surveys', { params });
    return data?.data;
  },

  async create(payload) {
    const { data } = await api.post('/surveys', payload);
    return data?.data;
  },

  async submitResponse(id, payload) {
    const formData = new FormData();
    formData.append('disease_name', payload.disease_name);
    formData.append('cure_description', payload.cure_description);
    formData.append('why_description', payload.why_description);
    formData.append('image', payload.image);

    const { data } = await api.post(`/surveys/${id}/respond`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data?.data;
  },

  async getResponses(id, params = {}) {
    const { data } = await api.get(`/surveys/${id}/responses`, { params });
    return data?.data;
  }
};


