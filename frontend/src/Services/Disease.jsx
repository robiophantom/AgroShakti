import api from './Api';

// Disease detection wired to `/api/hooks/disease-detection`
export const diseaseService = {
  async detectDisease(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const { data } = await api.post('/hooks/disease-detection', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const payload = data?.data || {};
    const detection = payload.detection || {};

    return {
      raw: payload,
      diseaseDetected: Boolean(detection.detected),
      diseaseName: detection.disease || null,
      confidence: detection.confidence ?? null,
      cureRecommendation: payload.cure || null,
    };
  },

  async getDiseaseInfo(diseaseName, language = 'en') {
    const { data } = await api.post('/hooks/chatbot', {
      message: `Tell me about ${diseaseName} plant disease, its symptoms, causes, and treatment methods.`,
      language,
    });
    return data?.data;
  }
};