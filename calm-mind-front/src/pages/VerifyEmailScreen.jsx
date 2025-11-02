// src/pages/VerifyEmailScreen.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

export default function VerifyEmailScreen() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [status, setStatus] = useState("Verifying your email...");
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
  if (!token) {
    setStatus("No token provided. Cannot verify email.");
    setLoading(false);
    setError(true);
    return;
  }

  const verifyEmail = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/users/verify-email/${token}`
      );

      setStatus(response.data.message || "Email verified successfully!");
      setSuccess(true);
      setError(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed";
      setSuccess(false);
      setError(true);
      setStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  verifyEmail();
}, [token]);


  // Countdown redirect to login
  useEffect(() => {
    if (!loading && countdown > 0) {
      const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      navigate("/login");
    }
  }, [countdown, loading, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 flex">
        <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('/signup.png')" }} />
        <div className="w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('/login.png')" }} />
      </div>
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative flex flex-col lg:flex-row shadow-2xl rounded-3xl overflow-hidden w-full max-w-4xl bg-white transition-all duration-500 animate-fade-slide-up">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-between p-12 text-white relative">
          <div className="absolute inset-0 bg-black/40 rounded-l-3xl"></div>
          <div className="relative z-10 mb-8 border-4 border-[#B9A427] rounded-xl p-3 bg-white">
            <img src="/logo.png" alt="Calm Mind Logo" className="h-28 w-28 object-contain" />
          </div>
          <div className="relative z-10 text-center mt-4">
            <h1 className="text-4xl font-bold mb-2">Calm Mind</h1>
            <h2 className="text-xl opacity-90">Analytics</h2>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-1/2 p-12 flex flex-col items-center justify-center bg-white relative z-10">
          <div className="w-full max-w-md text-center">
            {loading && (
              <div className="mb-6">
                <div className="border-t-4 border-[#B9A427] rounded-full w-20 h-20 mx-auto animate-spin"></div>
              </div>
            )}

            {!loading && success && (
              <div className="mb-6 flex justify-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full animate-draw-circle" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="55" stroke="#B9A427" strokeWidth="5" fill="none" strokeDasharray="345" strokeDashoffset="345" />
                  </svg>
                  <svg className="w-12 h-12 text-green-500 animate-bounce-scale z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {!loading && error && !success && (
              <div className="mb-6 flex justify-center">
                <svg className="w-20 h-20 text-red-500 animate-bounce-scale" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}

            <p className={`text-lg mb-6 transition-opacity duration-500 ${success ? "text-black" : error ? "text-red-600" : "text-black"}`} aria-live="polite">
              {status}
            </p>

            {!loading && (
              <>
                <p className="text-gray-500 mb-6">
                  Redirecting to login in {countdown} second{countdown > 1 ? "s" : ""}...
                </p>
                <button
                  className="bg-[#B9A427] text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-[0_0_15px_#B9A427] hover:bg-[#8C7A20] transform hover:scale-105 transition-all duration-300 underline"
                  onClick={() => navigate("/login")}
                >
                  Login Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes draw-circle { 0% { stroke-dashoffset: 345; } 100% { stroke-dashoffset: 0; } }
        @keyframes bounce-scale { 0%,20%,50%,80%,100% { transform: scale(1); } 40% { transform: scale(1.3); } 60% { transform: scale(1.1); } }
        @keyframes fade-slide-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-draw-circle { animation: draw-circle 1s ease-out forwards; }
        .animate-bounce-scale { animation: bounce-scale 0.6s ease-out forwards; }
        .animate-fade-slide-up { animation: fade-slide-up 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
