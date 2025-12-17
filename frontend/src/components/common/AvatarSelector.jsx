import React, { useState } from 'react';
import { User, Check } from 'lucide-react';

// Farmer avatar options - using emoji/icon representations
const AVATAR_OPTIONS = [
  { id: 'farmer1', name: 'Farmer 1', icon: '👨‍🌾', color: 'bg-green-100 text-green-700' },
  { id: 'farmer2', name: 'Farmer 2', icon: '👩‍🌾', color: 'bg-blue-100 text-blue-700' },
  { id: 'farmer3', name: 'Farmer 3', icon: '🧑‍🌾', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'farmer4', name: 'Farmer 4', icon: '👨‍🌾', color: 'bg-orange-100 text-orange-700' },
  { id: 'farmer5', name: 'Farmer 5', icon: '👩‍🌾', color: 'bg-purple-100 text-purple-700' },
  { id: 'farmer6', name: 'Farmer 6', icon: '🧑‍🌾', color: 'bg-pink-100 text-pink-700' },
];

const AvatarSelector = ({ selectedAvatar, onSelect, showLabel = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (avatarId) => {
    onSelect(avatarId);
    setIsOpen(false);
  };

  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-10 h-10 rounded-full ${selectedAvatarData.color} hover:opacity-80 transition-opacity`}
        title="Select avatar"
      >
        <span className="text-xl">{selectedAvatarData.icon}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-12 right-0 z-20 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
            {showLabel && (
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                Choose Avatar
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => handleSelect(avatar.id)}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full ${avatar.color} hover:opacity-80 transition-opacity ${
                    selectedAvatar === avatar.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  title={avatar.name}
                >
                  <span className="text-xl">{avatar.icon}</span>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute -top-1 -right-1 bg-primary-600 rounded-full p-0.5">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AvatarSelector;
export { AVATAR_OPTIONS };

