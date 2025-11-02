// src/routes/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../api/client";

const ProtectedRoute = ({ children }) => {
  const { token, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = token || localStorage.getItem("token");

      // No token — instantly logout and stop checking
      if (!storedToken) {
        logout();
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      try {
        // Verify with backend
        const res = await api.get("http://localhost:4000/api/users/profile", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (res.status === 200 && res.data && res.data._id) {
          setIsValid(true);
        } else {
          logout();
          setIsValid(false);
        }
      } catch (err) {
        console.warn(
          "ProtectedRoute: invalid or expired token → redirecting...",
          err.message
        );
        logout();
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyAuth();
  }, [token, logout]);

  // While checking, prevent flicker
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  // Redirect to login if token invalid
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // Auth verified — render protected page
  return children;
};

export default ProtectedRoute;
