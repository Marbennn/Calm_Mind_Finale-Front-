import { create } from "zustand";
import axios from "axios";

export const useProfileStore = create((set) => ({
  profile: {
    firstName: "",
    lastName: "",
    fullName: "",
    year: "",
    course: "",
    studentNumber: "",
    phone: "",
    email: "",
    address: "",
    avatar: "",
    id: "",
  },
  loading: false,
  error: null,

  fetchProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`http://localhost:4000/api/getStarted/profile/${userId}`);
      if (response.status === 200) {
        const data = response.data.data;
        set({
          profile: {
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            fullName: `${data.firstName || ""} ${data.lastName || ""}`,
            year: data.yearLevel || "",
            course: data.course || "",
            studentNumber: data.studentNumber || "",
            phone: data.contactNumber || "",
            email: data.userId?.email || "",
            address: data.address || "",
            avatar: data.profileImage || "",
            id: data.studentNumber || "",
          },
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err.response?.data || err.message);
      set({ error: err.response?.data || err.message });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userId, formData) => {
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
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            fullName: `${data.firstName || ""} ${data.lastName || ""}`,
            year: data.yearLevel || "",
            course: data.course || "",
            studentNumber: data.studentNumber || "",
            phone: data.contactNumber || "",
            email: data.userId?.email || "",
            address: data.address || "",
            avatar: data.profileImage || "",
            id: data.studentNumber || "",
          },
        });
      }
    } catch (err) {
      console.error("Error updating profile:", err.response?.data || err.message);
      set({ error: err.response?.data || err.message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));
