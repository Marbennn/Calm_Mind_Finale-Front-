import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

// Success Modal Component
const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4 relative border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">Password updated successfully</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsLogin = () => {
  const navigate = useNavigate();
  const [email] = useState('xyfe.dacanay.up@phinmaed.com');
  // For display-only Login & Password card we only show the existing email
  const [password, setPassword] = useState('Dodi123');
  const [confirmPassword, setConfirmPassword] = useState('Dodi123');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tabs = ['Edit Profile', 'Login & Password', 'About'];
  const profile = {
    avatar: '/path-to-your-profile-image.jpg',
    fullName: 'Dodi Dacanay',
    year: '3rd Year',
    course: 'Bachelor of Science in Information Technology (CITE)',
    id: '03-2122-032245',
    firstName: 'Dodi',
    lastName: 'Dacanay',
   
    email: 'xyfe.dacanay.up@phinmaed.com',
    address: 'Bolasi, San Fabian Pangasinan',
  };

  return (
    <>
    <div className="flex h-screen bg-card">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-3">
          <div className="mb-8">
            <div className="bg-card rounded-lg shadow-lg px-6 py-6 flex items-center justify-between border border-gray-200">
              <h1 className="text-3xl font-bold text-primary">Settings</h1>
            </div>
            <div className="mt-4 border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      tab === 'Login & Password' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (tab === 'Edit Profile') navigate('/settings');
                      if (tab === 'Login & Password') navigate('/settings/login');
                      if (tab === 'About') navigate('/settings/about');
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="profile-content bg-card rounded-lg pt-1 pl-8 pr-8 pb-8 shadow-lg">
            <div className="profile-header mb-8">
              <h2 className="text-2xl font-semibold text-primary mb-4 cm-fade-up cm-delay-1">My Profile</h2>
              <div className="profile-card bg-card p-6 rounded-lg border border-gray-200 flex items-center gap-8 justify-between cm-fade-up cm-delay-2">
                <div className="flex items-center gap-8">
                  <div className="relative group cm-fade-up cm-delay-3">
                    <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                      <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="cm-fade-up cm-delay-4">
                    <div className="text-xl font-semibold text-primary">{profile.fullName}</div>
                    <p className="text-muted">{profile.year}</p>
                    <p className="text-muted text-sm">{profile.course}</p>
                    <p className="text-muted">{profile.id}</p>
                  </div>
                </div>
                <div className="cm-fade-up cm-delay-5">
                  <button
                    onClick={() => {
                      // On the standalone SettingsLogin page, the top Edit button should
                      // toggle editing for the password fields instead of navigating to /settings
                      setEditing((s) => !s);
                      setError('');
                    }}
                    className="edit-button px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>

            {/* Login & Password panel */}
            <div className="bg-card rounded-lg p-6 border border-gray-200 cm-fade-up cm-delay-1">
              <h2 className="text-xl font-semibold mb-6 text-primary">Login & Password</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
                  <div className="font-medium text-primary cm-fade-up cm-delay-2">{email}</div>
                </div>

                <div className="cm-fade-up cm-delay-3">

                  {editing ? (
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-600">{showPassword ? password : '•'.repeat(Math.max(7, password.length))}</div>
                  )}
                </div>

                <div className="cm-fade-up cm-delay-4">
                  <label className="block text-sm font-medium text-muted mb-2">Confirm Password</label>

                  {editing ? (
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600"
                      >
                        {showConfirm ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-600">{showConfirm ? confirmPassword : '•'.repeat(Math.max(7, confirmPassword.length))}</div>
                  )}
                </div>

                {error ? <div className="text-sm text-red-600">{error}</div> : null}

                {editing ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        // basic validation
                        if (!password || password.length < 4) {
                          setError('Password must be at least 4 characters');
                          return;
                        }
                        if (password !== confirmPassword) {
                          setError('Passwords do not match');
                          return;
                        }
                        // simulate save
                        setEditing(false);
                        setShowPassword(false);
                        setShowConfirm(false);
                        setError('');
                        // In real app, call API here
                        setShowSuccessModal(true);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        // cancel - revert to default for now
                        setPassword('Dodi123');
                        setConfirmPassword('Dodi123');
                        setEditing(false);
                        setShowPassword(false);
                        setShowConfirm(false);
                        setError('');
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <SuccessModal 
      isOpen={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
    />
    </>
  );
};

export default SettingsLogin;