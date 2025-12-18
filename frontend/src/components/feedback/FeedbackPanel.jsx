import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { feedbackService } from '../../Services/Feedback';
import { useAuth } from '../../Hooks/useauth';

const FeedbackPanel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [feedbackForm, setFeedbackForm] = useState({ feature_type: '', rating: 5, comment: '' });
  const [reportForm, setReportForm] = useState({ report_type: 'bug', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const [adminFeedback, setAdminFeedback] = useState([]);
  const [adminReports, setAdminReports] = useState([]);

  const loadAdmin = async () => {
    if (!isAdmin) return;
    try {
      const f = await feedbackService.listFeedback({ limit: 50 });
      setAdminFeedback(f?.feedback || []);
      const r = await feedbackService.listReports({ limit: 50 });
      setAdminReports(r?.reports || []);
    } catch (error) {
      toast.error('Failed to load feedback/reports');
    }
  };

  useEffect(() => {
    loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feedbackService.submitFeedback(feedbackForm);
      toast.success('Feedback submitted');
      setFeedbackForm({ feature_type: '', rating: 5, comment: '' });
      loadAdmin();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await feedbackService.submitReport(reportForm);
      toast.success('Report submitted');
      setReportForm({ report_type: 'bug', description: '' });
      loadAdmin();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resolveReport = async (id, status) => {
    try {
      await feedbackService.resolveReport(id, status);
      toast.success('Report updated');
      loadAdmin();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Feedback</h2>
        <p className="text-gray-600 mb-4">Rate features and share your comments.</p>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submitFeedback}>
          <input
            className="input-field"
            placeholder="Feature (e.g., chatbot, disease, schemes)"
            value={feedbackForm.feature_type}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, feature_type: e.target.value })}
          />
          <input
            className="input-field"
            type="number"
            min="1"
            max="5"
            value={feedbackForm.rating}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
          />
          <textarea
            className="input-field md:col-span-2"
            placeholder="Comment"
            value={feedbackForm.comment}
            onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
          />
          <button className="btn-primary md:col-span-2" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit feedback'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Report an issue</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={submitReport}>
          <select
            className="input-field"
            value={reportForm.report_type}
            onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
          >
            <option value="bug">Bug</option>
            <option value="inappropriate_content">Inappropriate content</option>
            <option value="other">Other</option>
          </select>
          <textarea
            className="input-field md:col-span-2"
            placeholder="Describe the issue"
            value={reportForm.description}
            onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
            required
          />
          <button className="btn-primary md:col-span-2" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit report'}
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <h3 className="font-semibold mb-2">All feedback</h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {adminFeedback.length === 0 ? (
                <p className="text-gray-600 text-sm">No feedback yet.</p>
              ) : (
                adminFeedback.map((f) => (
                  <div key={f.id} className="border rounded p-2">
                    <p className="font-semibold text-sm">{f.feature_type || 'General'}</p>
                    <p className="text-sm text-gray-700">Rating: {f.rating}</p>
                    {f.comment && <p className="text-sm text-gray-700">{f.comment}</p>}
                    <p className="text-xs text-gray-500">{f.user_name} ({f.user_email})</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Reports</h3>
            <div className="space-y-2 max-h-96 overflow-auto">
              {adminReports.length === 0 ? (
                <p className="text-gray-600 text-sm">No reports yet.</p>
              ) : (
                adminReports.map((r) => (
                  <div key={r.id} className="border rounded p-2">
                    <p className="font-semibold text-sm capitalize">{r.report_type || 'report'}</p>
                    <p className="text-sm text-gray-700">{r.description}</p>
                    <p className="text-xs text-gray-500">Status: {r.status}</p>
                    <p className="text-xs text-gray-500">By: {r.user_name} ({r.user_email})</p>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 mt-1">
                        <button className="btn-primary" onClick={() => resolveReport(r.id, 'resolved')}>Resolve</button>
                        <button className="text-red-600" onClick={() => resolveReport(r.id, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;


