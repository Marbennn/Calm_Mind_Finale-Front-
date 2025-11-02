import React from 'react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const SettingsAbout = () => {
  const navigate = useNavigate();
  const tabs = ['Edit Profile', 'Login & Password', 'About'];

  return (
    <div className="flex h-screen bg-card">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-0">
        <main className="flex-1 min-h-0 flex flex-col gap-3 px-2 pb-2 pt-2 overflow-hidden">
          <div className="mb-8">
            <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
              <div className="flex items-center gap-2">
                <button className="relative h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </button>
                <button className="h-12 w-12 grid place-items-center rounded-full bg-card border border-gray-200 shadow-sm">
                  <span className="text-base">👤</span>
                </button>
              </div>
            </div>
            <div className="mt-4 border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      tab === 'About' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 p-12 backdrop-blur-sm bg-opacity-80">
                <div className="max-w-5xl mx-auto">
                  <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">About Calm Mind</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">Your companion for academic success and mental wellness</p>
                  </div>
                  
                  {/* About Content */}
                  <div className="space-y-16">
                    <section className="flex items-start gap-8 group hover:scale-[1.01] transition-transform duration-300">
                      <div className="bg-yellow-50/50 p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h3>
                        <p className="text-gray-600 leading-relaxed text-lg">
                          Calm Mind is dedicated to helping students manage their academic journey with peace and clarity. 
                          We provide tools for task management, scheduling, and mental wellness to ensure a balanced 
                          educational experience.
                        </p>
                      </div>
                    </section>

                    <section className="flex items-start gap-8 group hover:scale-[1.01] transition-transform duration-300">
                      <div className="bg-blue-50/50 p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Key Features</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">Smart Task Management</span>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">Calendar Integration</span>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">AI-powered Support</span>
                          </div>
                          <div className="flex items-center gap-3 bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700 font-medium">Progress Analytics</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="flex items-start gap-8 group hover:scale-[1.01] transition-transform duration-300">
                      <div className="bg-green-50/50 p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Version & Updates</h3>
                        <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100/50 shadow-sm">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Current Version</p>
                              <p className="text-gray-700 text-lg font-medium">1.0.0</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 mb-1">Last Updated</p>
                              <p className="text-gray-700 text-lg font-medium">October 2025</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="flex items-start gap-8 group hover:scale-[1.01] transition-transform duration-300">
                      <div className="bg-purple-50/50 p-4 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-900 mb-4">Support</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-sm font-medium text-gray-900 mb-1">Email</p>
                            <p className="text-gray-700 font-medium">support@calmmind.edu</p>
                          </div>
                          <div className="bg-gray-50/50 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-sm font-medium text-gray-900 mb-1">Hours</p>
                            <p className="text-gray-700 font-medium">Mon - Fri, 8:00 AM - 5:00 PM PST</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsAbout;