import { create } from "zustand";
import axios from "axios";

export const useProfileStore = create((set) => ({
  profile: {
    _id: "",
    firstName: "",
    lastName: "",
    fullName: "",
    department: "",
    yearLevel: "",
    course: "",
    studentNumber: "",
    email: "",
    avatar: "",
  },
  loading: false,
  error: null,

  // ---------------- FETCH PROFILE ----------------
  fetchProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(
        `http://localhost:4000/api/getStarted/profile/${userId}`
      );
      if (response.status === 200) {
        const data = response.data.data;
        set({
          profile: {
            _id: data.userId._id || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            fullName: data.fullName || "",
            department: data.department || "",
            yearLevel: data.yearLevel || "",
            course: data.course || "",
            studentNumber: data.studentNumber || "",
            email: data.userId.email || "",
            avatar: data.profileImage || "",
          },
        });
      }
    } catch (err) {
      console.error(
        "Error fetching profile:",
        err.response?.data || err.message
      );
      set({ error: err.response?.data || err.message });
    } finally {
      set({ loading: false });
    }
  },

  // ---------------- UPDATE PROFILE ----------------
  updateProfile: async (userId, formData) => {
    if (!userId) throw new Error("User ID (_id) is required for update");
    set({ loading: true, error: null });
    try {
      const response = await axios.put(
        `http://localhost:4000/api/getStarted/update-profile/${userId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (response.status === 200) {
        const data = response.data.data;
        set({
          profile: {
            _id: data.userId._id || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            fullName: data.fullName || "",
            department: data.department || "",
            yearLevel: data.yearLevel || "",
            course: data.course || "",
            studentNumber: data.studentNumber || "",
            email: data.userId.email || "",
            avatar: data.profileImage || "",
          },
        });
      }
    } catch (err) {
      console.error(
        "Error updating profile:",
        err.response?.data || err.message
      );
      set({ error: err.response?.data || err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
