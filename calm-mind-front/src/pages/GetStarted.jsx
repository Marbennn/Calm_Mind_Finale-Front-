import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetStartedStore } from "../store/useGetStartedStore";

const GetStarted = () => {
  const navigate = useNavigate();
  const { getStartedData, setGetStartedData, submitGetStarted, loading } =
    useGetStartedStore();

  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    setFormVisible(true);
  }, []);

  const departments = ["CITE", "CAHS", "CEA", "CCJE", "CELA", "CMA"];
  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGetStartedData({
      ...getStartedData,
      [name]: value,
      ...(name === "department" ? { course: "" } : {}),
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submitGetStarted(getStartedData, navigate);
  };

  const isCourseDropdownEnabled =
    getStartedData.department && getStartedData.yearLevel;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div
        className={`w-full max-w-[800px] bg-white rounded-3xl shadow-xl p-12 transition-all duration-500 transform ${
          formVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[32px] font-bold text-gray-900">
            Getting Started.
          </h1>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
        </div>
        <p className="text-gray-600 mb-8 text-lg">
          Set up your account by adding the details below to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-600 mb-2">Department</label>
              <div className="relative">
                <select
                  name="department"
                  value={getStartedData.department}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-14 bg-white border border-gray-300 rounded-2xl appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-700 text-base"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="py-2">
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <div
                    className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-gray-600 mb-2">Year Level</label>
              <div className="relative">
                <select
                  name="yearLevel"
                  value={getStartedData.yearLevel}
                  onChange={handleInputChange}
                  className="w-full p-3 pr-14 bg-white border border-gray-300 rounded-2xl appearance-none cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-700 text-base"
                  style={{
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none",
                  }}
                >
                  <option value="">Select year level</option>
                  {yearLevels.map((year) => (
                    <option key={year} value={year} className="py-2">
                      {year}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <div
                    className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">Course</label>
            <div className="relative">
              <select
                name="course"
                value={getStartedData.course}
                onChange={handleInputChange}
                disabled={!isCourseDropdownEnabled}
                className={`w-full p-3 pr-14 bg-white border border-gray-300 rounded-2xl appearance-none text-gray-700 text-base ${
                  isCourseDropdownEnabled
                    ? "cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    : "cursor-not-allowed opacity-50"
                }`}
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                }}
              >
                <option value="">Select course</option>
                {getStartedData.department &&
                  courseMap[getStartedData.department]?.map((course) => (
                    <option key={course} value={course} className="py-2">
                      {course}
                    </option>
                  ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div
                  className="bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center"
                  style={{ width: "32px", height: "32px" }}
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 mb-2">Student Number</label>
            <input
              type="text"
              name="studentNumber"
              value={getStartedData.studentNumber}
              onChange={handleInputChange}
              placeholder="Enter your Student Number"
              className="w-full p-3 border border-gray-300 rounded-2xl"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 bg-black text-white rounded-2xl mt-6 transition-all duration-200 transform ${
              loading
                ? "opacity-75 cursor-not-allowed"
                : "hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Setting up...</span>
              </div>
            ) : (
              "Get Started"
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
};

export default GetStarted;
