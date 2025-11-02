import React, { useState, useContext, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/theme.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  // derive active tab from current path so tab highlighting follows route
  const pathname = location.pathname || '';
  let activeTab = 'Edit Profile';
  if (pathname.startsWith('/settings/login')) activeTab = 'Login & Password';
  else if (pathname.startsWith('/settings/about')) activeTab = 'About';
  const tabs = ['Edit Profile', 'Login & Password', 'About'];
  const [editMode, setEditMode] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const departments = ['CITE', 'CAHS', 'CEA', 'CCJE', 'CELA', 'CMA'];
  const courseMap = {
    CITE: ['Bachelor of Science in Information Technology'],
    CAHS: [
      'Bachelor of Science in Nursing',
      'Bachelor of Science in Pharmacy',
      'Bachelor in Medical Laboratory Science',
      'Bachelor of Science in Psychology'
    ],
    CEA: [
      'Bachelor of Science in Architecture',
      'Bachelor of Science in Computer Engineering',
      'Bachelor of Science in Civil Engineering',
      'Bachelor of Science in Electrical Engineering',
      'Bachelor of Science in Mechanical Engineering'
    ],
    CCJE: ['Bachelor of Science in Criminology'],
    CELA: [
      'Bachelor of Arts in Political Science',
      'Bachelor of Science in Elementary Education',
      'Bachelor of Secondary Education Major in English',
      'Bachelor of Secondary Education Major in Math',
      'Bachelor of Secondary Education Major in Science',
      'Bachelor of Secondary Education Major in Social Studies'
    ],
    CMA: [
      'Bachelor of Science in Accountancy',
      'Bachelor of Science in Management Accounting',
      'Bachelor of Science in Accountancy Technology',
      'Bachelor of Science in Hospitality Management',
      'Bachelor of Science in Tourism Management',
      'Bachelor of Science in Business Administration Major in Marketing Management',
      'Bachelor of Science in Business Administration Major in Financial Management'
    ]
  };

  const [profile, setProfile] = useState({
    avatar: '/path-to-your-profile-image.jpg',
    fullName: 'Dodi Dacanay',
    year: '3rd Year',
    department: 'CITE',
    course: 'Bachelor of Science in Information Technology',
    id: '03-2122-032245',
    firstName: 'Dodi',
    lastName: 'Dacanay',
    email: 'xyfe.dacanay.up@phinmaed.com',
  });
  const [draftProfile, setDraftProfile] = useState(null);

  const fullNameRef = useRef(null);
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const idRef = useRef(null);
  const emailRef = useRef(null);
  const departmentRef = useRef(null);

  useEffect(() => {
    if (editMode) {
      const el = fullNameRef.current;
      if (el && typeof el.focus === 'function') {
        el.focus({ preventScroll: true });
        if (typeof el.select === 'function') el.select();
      }
    }
  }, [editMode]);

  // If URL includes ?edit=profile, open edit mode and scroll to profile on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === 'profile') {
      setDraftProfile({ ...profile });
      setEditMode(true);
      // scroll to profile card after a tick so layout is ready
      setTimeout(() => {
        const el = document.querySelector('.profile-content');
        if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.search, profile]);

  const startEdit = () => {
    setDraftProfile({ ...profile });
    setEditMode(true);
  };

  const cancelEdit = () => {
    setDraftProfile(null);
    setEditMode(false);
  };

  const saveEdit = async () => {
    setIsSaving(true);
    const updated = {
      avatar: draftProfile?.avatar || profile.avatar,
      fullName: fullNameRef.current ? fullNameRef.current.value : profile.fullName,
      year: draftProfile?.year || profile.year,
      department: draftProfile?.department || profile.department,
      course: draftProfile?.course || profile.course,
      id: idRef.current ? idRef.current.value : profile.id,
      firstName: firstNameRef.current ? firstNameRef.current.value : profile.firstName,
      lastName: lastNameRef.current ? lastNameRef.current.value : profile.lastName,
     
      email: emailRef.current ? emailRef.current.value : profile.email,
    };
    
    // Simulate a save delay with progressive loading
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    setProfile(updated);
    setDraftProfile(null);
    setEditMode(false);
    setIsSaving(false);
    setShowSaveSuccess(true);
    
    // Hide success message after animation completes (2s total: 0.3s slide in + 1.4s visible + 0.3s fade out)
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 2000);
  };

  const ProfileContent = () => {
    const current = editMode && draftProfile ? draftProfile : profile;
    return (
      <div className="profile-content bg-card rounded-lg pt-1 pl-8 pr-8 pb-8 shadow-lg">
        <div className="profile-header mb-8 cm-fade-up cm-delay-1">
          <h2 className="text-2xl font-semibold text-primary mb-4">My Profile</h2>
          <div className="profile-card bg-card p-6 rounded-lg border border-gray-200 flex items-center gap-8 justify-between">
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                  <img 
                    src={current.avatar} 
                    alt="Profile" 
                    className={`w-full h-full object-cover cursor-pointer transition-all duration-300
                      ${editMode ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900' : ''}`}
                    onClick={() => editMode && fileInputRef.current?.click()}
                  />
                  {editMode && (
                    <div 
                      className={`absolute inset-0 flex flex-col items-center justify-center rounded-full
                        bg-black/30 backdrop-blur-sm transition-all duration-300
                        ${isImageLoading ? 'opacity-100' : 'opacity-70 hover:opacity-100 hover:bg-black/50'}
                        cursor-pointer`}
                      onClick={() => !isImageLoading && fileInputRef.current?.click()}
                    >
                      {!isImageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                          <svg 
                            className="w-6 h-6 text-white transform transition-transform duration-300 group-hover:scale-110 mb-1" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" 
                            />
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" 
                            />
                          </svg>
                          <span className="text-xs font-medium text-white leading-tight transform transition-transform duration-300 group-hover:scale-110">
                            Change<br />Photo
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setIsImageLoading(true);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setDraftProfile(prev => ({
                            ...prev,
                            avatar: e.target?.result
                          }));
                          setIsImageLoading(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {isImageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
                      <div className="relative w-10 h-10">
                        <div className="absolute inset-0 rounded-full border-2 border-yellow-500/30"></div>
                        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-yellow-500 animate-spin"></div>
                      </div>
                      <span className="text-sm font-medium text-white mt-2">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                {editMode ? (
                  <input
                    ref={fullNameRef}
                    autoComplete="name"
                    className="text-xl font-semibold text-primary bg-transparent outline-none mb-2"
                    defaultValue={current.fullName}
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-primary mb-2">{current.fullName}</h3>
                )}
                <div className="flex items-center gap-4 mb-1">
                  {editMode ? (
                    <>
                      <select
                        ref={departmentRef}
                        value={current.department}
                        onChange={(e) => setDraftProfile(prev => ({ ...prev, department: e.target.value, course: '' }))}
                        className="text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-24"
                      >
                        <option value="">Select</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <select
                        value={current.year}
                        onChange={(e) => setDraftProfile(prev => ({ ...prev, year: e.target.value }))}
                        className="text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-24"
                      >
                        <option value="">Select</option>
                        {yearLevels.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <p className="text-muted">{current.department} {current.year}</p>
                  )}
                </div>
                {editMode ? (
                  <select
                    value={current.course}
                    onChange={(e) => setDraftProfile(prev => ({ ...prev, course: e.target.value }))}
                    disabled={!current.department}
                    className={`text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-full mb-1 text-sm
                      ${current.department ? '' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <option value="">Select course</option>
                    {current.department && courseMap[current.department]?.map(course => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-muted text-sm mb-1">{current.course}</p>
                )}
                {editMode ? (
                  <input
                    ref={idRef}
                    className="text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                    defaultValue={current.id}
                  />
                ) : (
                  <p className="text-muted">{current.id}</p>
                )}
              </div>
            </div>
            {!editMode ? (
              <button onClick={startEdit} className="edit-button px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors">Edit</button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={saveEdit} 
                  disabled={isSaving}
                  className={`px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 
                    transition-all duration-300 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <>
                      <div className="relative w-4 h-4">
                        <div className="absolute inset-0 rounded-full border border-white/30"></div>
                        <div className="absolute inset-0 rounded-full border-t border-r border-white animate-spin"></div>
                      </div>
                      <span>Saving...</span>
                    </>
                  ) : 'Save'}
                </button>
                <button 
                  onClick={cancelEdit} 
                  disabled={isSaving}
                  className={`px-4 py-2 bg-gray-200 text-primary rounded-md hover:bg-gray-300 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  Cancel
                </button>
              </div>
            )}
            {showSaveSuccess && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg
                animate-[slideIn_0.3s_ease-out,fadeOut_0.3s_ease-in_1.7s] flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Changes saved successfully!</span>
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes fadeOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}</style>

        <div className="personal-info mt-8 cm-fade-up cm-delay-2">
          <h3 className="text-xl font-semibold mb-6 text-primary">Personal Information</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted mb-2">First Name</label>
              {editMode ? (
                <input
                  ref={firstNameRef}
                  className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  defaultValue={current.firstName}
                />
              ) : (
                <p className="text-primary">{current.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Last Name</label>
              {editMode ? (
                <input
                  ref={lastNameRef}
                  className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  defaultValue={current.lastName}
                />
              ) : (
                <p className="text-primary">{current.lastName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Email Address</label>
              {editMode ? (
                <input
                  ref={emailRef}
                  className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  defaultValue={current.email}
                />
              ) : (
                <p className="text-primary">{current.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-card">
      <Sidebar active="Settings" />
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
                      activeTab === tab
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      if (tab === 'Login & Password') navigate('/settings/login');
                      else if (tab === 'Edit Profile') navigate('/settings');
                      else if (tab === 'About') navigate('/settings/about');
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {activeTab === 'Edit Profile' && <ProfileContent />}
        </div>
      </div>

      <div className="block lg:hidden fixed bottom-4 left-4 z-50">
        <div className={`theme-switch ${theme === "dark" ? "dark" : ""}`} role="group" aria-label="Theme toggle">
          <button
            type="button"
            className="sun-button"
            aria-pressed={theme === "light"}
            aria-label="Switch to light mode"
            onClick={() => setTheme("light")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTheme("light"); }}
          >
            <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="M4.93 4.93l1.41 1.41" />
                <path d="M17.66 17.66l1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M4.93 19.07l1.41-1.41" />
                <path d="M17.66 6.34l1.41-1.41" />
              </g>
            </svg>
          </button>

          <button type="button" className="knob-button" aria-hidden="true" tabIndex={-1} />

          <button
            type="button"
            className="moon-button"
            aria-pressed={theme === "dark"}
            aria-label="Switch to dark mode"
            onClick={() => setTheme("dark")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTheme("dark"); }}
          >
            <svg className="moon moon-icon" viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;