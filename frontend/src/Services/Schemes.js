import api from './Api';

export const schemesService = {
  async list(params = {}) {
    const { data } = await api.get('/schemes', { params });
    return data?.data;
  },
  async search(query) {
    const { data } = await api.get('/schemes/search', { params: { query } });
    return data?.data;
  },
  async getById(id) {
    const { data } = await api.get(`/schemes/${id}`);
    return data?.data;
  },
  async create(payload) {
    const { data } = await api.post('/schemes', payload);
    return data?.data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/schemes/${id}`, payload);
    return data?.data;
  },
  async remove(id) {
    const { data } = await api.delete(`/schemes/${id}`);
    return data?.data;
  }
};

