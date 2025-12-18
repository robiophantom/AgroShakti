import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../../Services/Auth';
import { useAuth } from '../../Hooks/useauth';
import AvatarSelector from '../common/AvatarSelector';

const ProfilePanel = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    language_preference: '',
    location: '',
    avatar: 'farmer1'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        language_preference: user.language_preference || '',
        location: user.location || '',
        avatar: user.avatar || 'farmer1'
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (avatarId) => {
    setForm({ ...form, avatar: avatarId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authService.updateProfile(form);
      await refreshUser();
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Profile</h2>
      <p className="text-gray-600 mb-4">Update your account details.</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
          <div className="flex items-center space-x-4">
            <AvatarSelector
              selectedAvatar={form.avatar}
              onSelect={handleAvatarSelect}
              showLabel={false}
            />
            <span className="text-sm text-gray-600">Choose your farmer avatar</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            className="input-field"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            className="input-field"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language preference</label>
          <input
            className="input-field"
            name="language_preference"
            value={form.language_preference}
            onChange={handleChange}
            placeholder="en, hi, etc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            className="input-field"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Village / District / State"
          />
        </div>
        <button type="submit" className="w-full btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePanel;

