// src/store/useGetStartedStore.js
import { create } from "zustand";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const useGetStartedStore = create((set) => ({
  completed: false,
  getStartedData: {
    course: "",
    yearLevel: "",
    studentNumber: "",
    address: "",
    contactNumber: "",
  },
  loading: false,
  error: null,

  // Setters
  setCompleted: (value) => set({ completed: value }),
  setGetStartedData: (data) =>
    set((state) => ({ getStartedData: { ...state.getStartedData, ...data } })),
  setLoading: (value) => set({ loading: value }),
  setError: (error) => set({ error }),

  // 🟢 Submit "Get Started" form to backend
  submitGetStarted: async (data, navigate) => {
    const { user, token } = useAuthStore.getState();

    if (!user?.id || !token) {
      alert("User not logged in. Please log in again.");
      return;
    }

    set({ loading: true, error: null });

    try {
      // ✅ Include userId from logged-in user
      const payload = { ...data, userId: user.id };

      const response = await axios.post(
        "http://localhost:4000/api/get-started",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        set({ getStartedData: data, completed: true });
        navigate("/home");
      }
    } catch (err) {
      console.error(
        "❌ Error submitting get-started form:",
        err.response?.data || err.message
      );
      set({ error: err.response?.data?.message || "Submission failed" });
      alert(
        err.response?.data?.message ||
          "Failed to submit form. Please try again."
      );
    } finally {
      set({ loading: false });
    }
  },

  resetGetStarted: () =>
    set({
      completed: false,
      getStartedData: {
        course: "",
        yearLevel: "",
        studentNumber: "",
        address: "",
        contactNumber: "",
      },
      loading: false,
      error: null,
    }),
}));
