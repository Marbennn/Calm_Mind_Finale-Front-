import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import api from "../api/client";

const ProtectedRoute = ({ children }) => {
  const { token, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");

    if (!storedToken) {
      logout();
      setIsValid(false);
      setIsChecking(false);
      return;
    }

    setIsValid(true);
    setIsChecking(false);

    const verifyAuth = async () => {
      try {
        const res = await api.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!(res.status === 200 && res.data?._id)) {
          logout();
          setIsValid(false);
        }
      } catch (err) {
        console.warn("Token invalid or expired", err.message);
        logout();
        setIsValid(false);
      }
    };

    verifyAuth();
  }, [token, logout]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
