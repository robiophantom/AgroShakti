import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../Services/Admin';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        adminService.getStats(),
        adminService.getAllUsers({ limit: 50 })
      ]);
      setStats(s);
      // Backend returns { users: [...], pagination: {...} }
      setUsers(u?.users || []);
    } catch (error) {
      console.error('Admin load error:', error);
      toast.error(error?.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (id, role) => {
    try {
      await adminService.changeUserRole(id, role);
      toast.success('Role updated successfully');
      load();
    } catch (error) {
      console.error('Change role error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update role');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await adminService.deleteUser(id);
      toast.success('User deleted successfully');
      load();
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admin dashboard</h2>
            <p className="text-gray-600">Platform stats and user management.</p>
          </div>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
        {loading && <p className="text-gray-600 mt-2">Loading...</p>}
        {stats && (
          <div className="grid gap-3 md:grid-cols-3 mt-3">
            <div className="card">
              <p className="text-sm text-gray-600">Users</p>
              <p className="text-2xl font-bold">{stats.users.total}</p>
              <p className="text-xs text-gray-500">Farmers: {stats.users.farmers}, Admins: {stats.users.admins}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">AI usage</p>
              <p className="text-lg font-semibold">Chat: {stats.ai_usage.chat_interactions}</p>
              <p className="text-lg font-semibold">Disease: {stats.ai_usage.disease_detections}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Engagement</p>
              <p className="text-lg font-semibold">Schemes active: {stats.schemes.active}</p>
              <p className="text-lg font-semibold">Surveys active: {stats.surveys.active}</p>
              <p className="text-sm text-gray-500">Feedback: {stats.feedback.total} (avg {stats.feedback.average_rating})</p>
              <p className="text-sm text-gray-500">Pending reports: {stats.reports.pending}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Users Management</h3>
          <span className="text-sm text-gray-500">{users.length} users</span>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found.</p>
            </div>
          ) : (
            users.map((u) => (
              <div 
                key={u.id} 
                className="border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">{u.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {u.phone} • {u.location || 'Location N/A'} • Joined {new Date(u.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    className="input-field text-sm min-w-[100px]"
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                  >
                    <option value="farmer">Farmer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button 
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium" 
                    onClick={() => deleteUser(u.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;


