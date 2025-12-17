import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { schemesService } from '../../Services/Schemes';
import { useAuth } from '../../Hooks/useauth';

const SchemesPanel = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    eligibility: '',
    how_to_apply: '',
    benefits: '',
    category: '',
    state: '',
    last_date: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = query
        ? await schemesService.search(query)
        : await schemesService.list({ limit: 20 });
      setSchemes(data?.schemes || data || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load schemes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await schemesService.create(form);
      toast.success('Scheme created');
      setForm({
        title: '',
        description: '',
        eligibility: '',
        how_to_apply: '',
        benefits: '',
        category: '',
        state: '',
        last_date: ''
      });
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (scheme) => {
    try {
      await schemesService.update(scheme.id, { is_active: !scheme.is_active });
      toast.success('Updated');
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scheme?')) return;
    try {
      await schemesService.remove(id);
      toast.success('Deleted');
      load();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Government Schemes</h2>
            <p className="text-gray-600">Browse and search active schemes.</p>
          </div>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="Search schemes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn-primary" onClick={load} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Add new scheme</h3>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
            <input className="input-field" placeholder="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="input-field" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <input className="input-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input className="input-field" placeholder="Last date (YYYY-MM-DD)" value={form.last_date} onChange={(e) => setForm({ ...form, last_date: e.target.value })} />
            <textarea className="input-field md:col-span-2" placeholder="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <textarea className="input-field md:col-span-2" placeholder="Eligibility" required value={form.eligibility} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} />
            <textarea className="input-field md:col-span-2" placeholder="How to apply" required value={form.how_to_apply} onChange={(e) => setForm({ ...form, how_to_apply: e.target.value })} />
            <textarea className="input-field md:col-span-2" placeholder="Benefits" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
            <button type="submit" className="btn-primary md:col-span-2" disabled={creating}>
              {creating ? 'Creating...' : 'Create scheme'}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          <p className="text-gray-600">Loading schemes...</p>
        ) : schemes.length === 0 ? (
          <p className="text-gray-600">No schemes found.</p>
        ) : (
          schemes.map((s) => (
            <div key={s.id} className="card space-y-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-sm text-gray-600">{s.category || 'General'} • {s.state || 'All India'}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => handleToggleActive(s)}>
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="text-red-600" onClick={() => handleDelete(s.id)}>Delete</button>
                  </div>
                )}
              </div>
              <p className="text-gray-700 text-sm line-clamp-3">{s.description}</p>
              <p className="text-sm"><strong>Eligibility:</strong> {s.eligibility}</p>
              <p className="text-sm"><strong>How to apply:</strong> {s.how_to_apply}</p>
              {s.benefits && <p className="text-sm"><strong>Benefits:</strong> {s.benefits}</p>}
              {s.last_date && <p className="text-sm text-gray-600">Last date: {s.last_date}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SchemesPanel;


