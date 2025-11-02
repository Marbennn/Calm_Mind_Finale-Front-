import React, { useState, useContext, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { ThemeContext } from "../context/ThemeContext";
import "../styles/theme.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useProfileStore } from "../store/useProfileStore";

const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const { profile, fetchProfile, updateProfile, loading } = useProfileStore();

  const pathname = location.pathname || "";
  let activeTab = "Edit Profile";
  if (pathname.startsWith("/settings/login")) activeTab = "Login & Password";
  else if (pathname.startsWith("/settings/about")) activeTab = "About";
  const tabs = ["Edit Profile", "Login & Password", "About"];

  const [editMode, setEditMode] = useState(false);
  const [draftProfile, setDraftProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const fullNameRef = useRef(null);

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const departments = ["CITE", "CAHS", "CEA", "CCJE", "CELA", "CMA"];
  const courseMap = {
    CITE: ["Bachelor of Science in Information Technology"],
    CAHS: [
      "Bachelor of Science in Nursing",
      "Bachelor of Science in Pharmacy",
      "Bachelor in Medical Laboratory Science",
      "Bachelor of Science in Psychology",
    ],
    CEA: [
      "Bachelor of Science in Architecture",
      "Bachelor of Science in Computer Engineering",
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Mechanical Engineering",
    ],
    CCJE: ["Bachelor of Science in Criminology"],
    CELA: [
      "Bachelor of Arts in Political Science",
      "Bachelor of Science in Elementary Education",
      "Bachelor of Secondary Education Major in English",
      "Bachelor of Secondary Education Major in Math",
      "Bachelor of Secondary Education Major in Science",
      "Bachelor of Secondary Education Major in Social Studies",
    ],
    CMA: [
      "Bachelor of Science in Accountancy",
      "Bachelor of Science in Management Accounting",
      "Bachelor of Science in Accountancy Technology",
      "Bachelor of Science in Hospitality Management",
      "Bachelor of Science in Tourism Management",
      "Bachelor of Science in Business Administration Major in Marketing Management",
      "Bachelor of Science in Business Administration Major in Financial Management",
    ],
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) fetchProfile(userId);
  }, [fetchProfile]);

  useEffect(() => {
    if (editMode && fullNameRef.current) {
      fullNameRef.current.focus();
      fullNameRef.current.select();
    }
  }, [editMode]);

  const startEdit = () => setDraftProfile({ ...profile }) || setEditMode(true);
  const cancelEdit = () => {
    setDraftProfile(null);
    setEditMode(false);
  };

  const saveEdit = async () => {
    if (!draftProfile || !profile._id) return;

    setIsSaving(true);

    const formData = new FormData();
    formData.append("firstName", draftProfile.firstName || "");
    formData.append("lastName", draftProfile.lastName || "");
    formData.append("department", draftProfile.department || "");
    formData.append("yearLevel", draftProfile.yearLevel || "");
    formData.append("course", draftProfile.course || "");
    formData.append("studentNumber", draftProfile.studentNumber || "");

    // Handle avatar image upload if changed
    if (draftProfile.avatar && draftProfile.avatar.startsWith("data:")) {
      const blob = await (await fetch(draftProfile.avatar)).blob();
      formData.append("profileImage", blob, "avatar.png");
    }

    try {
      await updateProfile(profile._id, formData);
      setDraftProfile(null);
      setEditMode(false);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const ProfileContent = () => {
    const current = editMode && draftProfile ? draftProfile : profile;

    return (
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
                    src={current.avatar || "/default-avatar.png"}
                    alt="Profile"
                    className={`w-full h-full object-cover cursor-pointer transition-all duration-300 ${
                      editMode
                        ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900"
                        : ""
                    }`}
                    onClick={() => editMode && fileInputRef.current?.click()}
                  />
                  {editMode && (
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setDraftProfile((prev) => ({
                              ...prev,
                              avatar: ev.target?.result,
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="flex-1">
                {editMode ? (
                  <input
                    ref={fullNameRef}
                    value={current.fullName || ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="text-xl font-semibold text-primary bg-transparent outline-none mb-2 w-full"
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {current.fullName}
                  </h3>
                )}

                <div className="flex items-center gap-4 mb-1">
                  {editMode ? (
                    <>
                      <select
                        value={current.department || ""}
                        onChange={(e) =>
                          setDraftProfile((prev) => ({
                            ...prev,
                            department: e.target.value,
                            course: "",
                          }))
                        }
                        className="text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-24"
                      >
                        <option value="">Select</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>

                      <select
                        value={current.yearLevel || ""}
                        onChange={(e) =>
                          setDraftProfile((prev) => ({
                            ...prev,
                            yearLevel: e.target.value,
                          }))
                        }
                        className="text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-24"
                      >
                        <option value="">Select Year</option>
                        {yearLevels.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <p className="text-muted">
                      {current.department} {current.yearLevel}
                    </p>
                  )}
                </div>

                {editMode ? (
                  <select
                    value={current.course || ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        course: e.target.value,
                      }))
                    }
                    disabled={!current.department}
                    className={`text-muted bg-transparent border border-gray-200 rounded px-2 py-1 w-full mb-2 text-sm ${
                      current.department ? "" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <option value="">Select Course</option>
                    {current.department &&
                      courseMap[current.department]?.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                  </select>
                ) : (
                  <p className="text-muted text-sm mb-1">{current.course}</p>
                )}
              </div>
            </div>

            {!editMode ? (
              <button
                onClick={startEdit}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-primary rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {showSaveSuccess && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
                Changes saved successfully!
              </div>
            )}
          </div>

          <div className="personal-info mt-8">
            <h3 className="text-xl font-semibold mb-6 text-primary">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  First Name
                </label>
                {editMode ? (
                  <input
                    value={current.firstName || ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                        fullName: `${e.target.value} ${
                          prev.lastName || ""
                        }`.trim(),
                      }))
                    }
                    className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-primary">{current.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Last Name
                </label>
                {editMode ? (
                  <input
                    value={current.lastName || ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                        fullName: `${prev.firstName || ""} ${
                          e.target.value
                        }`.trim(),
                      }))
                    }
                    className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-primary">{current.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  Email Address
                </label>
                {editMode ? (
                  <input
                    value={current.email || ""}
                    onChange={(e) =>
                      setDraftProfile((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="text-primary bg-transparent border border-gray-200 rounded px-2 py-1 w-full"
                  />
                ) : (
                  <p className="text-primary">{current.email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-card">
      <Sidebar active="Settings" />
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
                      activeTab === tab
                        ? "border-yellow-500 text-yellow-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => {
                      if (tab === "Login & Password")
                        navigate("/settings/login");
                      else if (tab === "Edit Profile") navigate("/settings");
                      else if (tab === "About") navigate("/settings/about");
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-white">
            {activeTab === "Edit Profile" && <ProfileContent />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
