import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";
import axios from "axios";

const SuccessModal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-800/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-lg p-6 shadow-2xl max-w-sm w-full mx-4 relative border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Success!</h3>
          <p className="text-gray-600 mb-6">{message}</p>
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
  const { profile, fetchProfile } = useProfileStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const tabs = ["Edit Profile", "Login & Password", "About"];

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) fetchProfile(userId);
  }, [fetchProfile]);

  const handlePasswordUpdate = async () => {
    try {
      if (!currentPassword || !password || !confirmPassword) {
        setError("All fields are required");
        return;
      }
      if (password.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.put(
        "http://localhost:4000/api/users/update-password",
        { currentPassword, newPassword: password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setEditing(false);
        setCurrentPassword("");
        setPassword("");
        setConfirmPassword("");
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error updating password");
    }
  };

  return (
    <>
      <div className="flex h-screen bg-card">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <main className="flex-1 min-h-0 flex flex-col gap-3 px-2 pb-2 pt-2 overflow-hidden">
            <div className="mb-8">
              <div className="h-20 md:h-[80px] w-full px-4 flex items-center justify-between bg-card rounded-xl shadow-md cursor-default">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Settings
                </h1>
              </div>
              <div className="mt-4 border-b border-gray-200">
                <nav className="flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        tab === "Login & Password"
                          ? "border-yellow-500 text-yellow-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        if (tab === "Edit Profile") navigate("/settings");
                        if (tab === "Login & Password")
                          navigate("/settings/login");
                        if (tab === "About") navigate("/settings/about");
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="profile-content bg-card rounded-lg pt-1 pl-8 pr-8 pb-8 shadow-lg">
                <div className="profile-header mb-8">
                  <h2 className="text-2xl font-semibold text-primary mb-4">
                    My Profile
                  </h2>
                  <div className="profile-card bg-card p-6 rounded-lg border border-gray-200 flex items-center gap-8 justify-between">
                    <div className="flex items-center gap-8">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                          <img
                            src={profile.avatar || "/default-avatar.png"}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-xl font-semibold text-primary">
                          {profile.fullName || ""}
                        </div>
                        <p className="text-muted">{profile.yearLevel || ""}</p>
                        <p className="text-muted text-sm">
                          {profile.course || ""}
                        </p>
                        <p className="text-muted">
                          {profile.studentNumber || ""}
                        </p>
                        <p className="text-muted">{profile.email || ""}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password panel */}
                <div className="bg-card rounded-lg p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold mb-6 text-primary">
                    Change Password
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-800"
                        disabled={!editing}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-800"
                        disabled={!editing}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="mt-1 text-sm text-gray-600"
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-md bg-white border border-gray-200 text-gray-800"
                        disabled={!editing}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="mt-1 text-sm text-gray-600"
                      >
                        {showConfirm ? "Hide" : "Show"}
                      </button>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600">{error}</div>
                    )}

                    <div className="flex items-center gap-3">
                      {!editing ? (
                        <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={handlePasswordUpdate}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditing(false);
                              setCurrentPassword("");
                              setPassword("");
                              setConfirmPassword("");
                              setError("");
                            }}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-md"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Password updated successfully"
      />
    </>
  );
};

export default SettingsLogin;
