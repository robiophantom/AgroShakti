import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { surveysService } from '../../Services/Surveys';
import { useAuth } from '../../Hooks/useauth';

const SurveyPanel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeSurvey, setActiveSurvey] = useState(null);
  const [loadingActive, setLoadingActive] = useState(false);
  const [responseForm, setResponseForm] = useState({
    disease_name: '',
    cure_description: '',
    why_description: '',
    image: null
  });
  const [submitting, setSubmitting] = useState(false);

  const [adminList, setAdminList] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    week_number: '',
    year: '',
    ends_at: ''
  });

  const loadActive = async () => {
    setLoadingActive(true);
    try {
      const data = await surveysService.getActive();
      setActiveSurvey(data);
    } catch (error) {
      setActiveSurvey(null);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    loadActive();
    if (isAdmin) {
      loadAdminList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAdminList = async () => {
    try {
      const data = await surveysService.list({ limit: 20 });
      setAdminList(data?.surveys || []);
    } catch (error) {
      toast.error('Failed to load surveys');
    }
  };

  const loadResponses = async (surveyId) => {
    try {
      const data = await surveysService.getResponses(surveyId, { limit: 20 });
      setResponses(data?.responses || []);
    } catch (error) {
      toast.error('Failed to load responses');
    }
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (!activeSurvey) return;
    if (!responseForm.image) {
      toast.error('Please attach an image.');
      return;
    }
    setSubmitting(true);
    try {
      await surveysService.submitResponse(activeSurvey.id, responseForm);
      toast.success('Response submitted');
      setResponseForm({
        disease_name: '',
        cure_description: '',
        why_description: '',
        image: null
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await surveysService.create(createForm);
      toast.success('Survey created');
      setCreateForm({ title: '', description: '', week_number: '', year: '', ends_at: '' });
      loadAdminList();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Weekly Survey</h2>
        <p className="text-gray-600 mb-4">Share disease observations from your field.</p>
        {loadingActive ? (
          <p>Loading active survey...</p>
        ) : !activeSurvey ? (
          <p className="text-gray-600">No active survey right now.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{activeSurvey.title}</h3>
              <p className="text-gray-700">{activeSurvey.description}</p>
              <p className="text-sm text-gray-600">Ends at: {activeSurvey.ends_at}</p>
            </div>
            <form className="grid gap-3" onSubmit={handleSubmitResponse}>
              <input
                className="input-field"
                placeholder="Disease name"
                value={responseForm.disease_name}
                onChange={(e) => setResponseForm({ ...responseForm, disease_name: e.target.value })}
                required
              />
              <textarea
                className="input-field"
                placeholder="What cure did you try? (cure description)"
                value={responseForm.cure_description}
                onChange={(e) => setResponseForm({ ...responseForm, cure_description: e.target.value })}
                required
              />
              <textarea
                className="input-field"
                placeholder="Why did you think this cure would work?"
                value={responseForm.why_description}
                onChange={(e) => setResponseForm({ ...responseForm, why_description: e.target.value })}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setResponseForm({ ...responseForm, image: e.target.files?.[0] || null })}
                required
              />
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit response'}
              </button>
            </form>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Create survey (admin)</h3>
            <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreateSurvey}>
              <input className="input-field" placeholder="Title" required value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
              <input className="input-field" placeholder="Week number" required value={createForm.week_number} onChange={(e) => setCreateForm({ ...createForm, week_number: e.target.value })} />
              <input className="input-field" placeholder="Year" required value={createForm.year} onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })} />
              <input className="input-field" placeholder="Ends at (YYYY-MM-DD)" required value={createForm.ends_at} onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })} />
              <textarea className="input-field md:col-span-2" placeholder="Description" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
              <button type="submit" className="btn-primary md:col-span-2" disabled={creating}>
                {creating ? 'Creating...' : 'Create survey'}
              </button>
            </form>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">Survey responses (admin)</h3>
                <p className="text-gray-600 text-sm">Select a survey to view responses.</p>
              </div>
              <select
                className="input-field max-w-xs"
                value={selectedSurvey || ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedSurvey(id);
                  if (id) loadResponses(id);
                  else setResponses([]);
                }}
              >
                <option value="">Select survey</option>
                {adminList.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            {responses.length === 0 ? (
              <p className="text-gray-600">No responses loaded.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-auto">
                {responses.map((r) => (
                  <div key={r.id} className="border rounded p-3">
                    <p className="font-semibold">{r.disease_name}</p>
                    <p className="text-sm text-gray-700">Cure: {r.cure_description}</p>
                    <p className="text-sm text-gray-700">Why: {r.why_description}</p>
                    <p className="text-xs text-gray-500">By: {r.user_name} ({r.user_email})</p>
                    {r.image_url && (
                      <a className="text-primary-600 text-sm" href={r.image_url} target="_blank" rel="noreferrer">
                        View image
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SurveyPanel;


