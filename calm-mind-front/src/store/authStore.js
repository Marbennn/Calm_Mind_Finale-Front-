import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/client";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: JSON.parse(localStorage.getItem("user")) || null,
      token: localStorage.getItem("token") || null,
      loading: false,
      error: null,
      // Admin analytics fetch state
      adminLoading: false,
      adminError: null,
      adminAnalytics: { tasks: [], stressLogs: [] },
      // Admin users list state
      users: [],
      usersLoading: false,
      usersError: null,

      // -------------------- SIGNUP --------------------
      signup: async ({ firstName, lastName, email, password }) => {
  try {
    set({ loading: true, error: null });

    const res = await api.post(
      "http://localhost:4000/api/users/register",
      { firstName, lastName, email, password }
    );

    const { user, token } = res.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({ user, token, loading: false });
    return { user, token };
  } catch (err) {
    console.error("Signup failed:", err.response?.data || err.message);
    set({
      error: err.response?.data?.message || "Signup failed",
      loading: false,
    });
    return null;
  }
},

      // -------------------- ADMIN: Users management --------------------
      fetchAllUsers: async () => {
        try {
          set({ usersLoading: true, usersError: null });
          const { data } = await api.get('/admin/users');
          const list = Array.isArray(data?.users) ? data.users : (Array.isArray(data) ? data : []);
          set({ users: list, usersLoading: false });
          return list;
        } catch (err) {
          set({ usersLoading: false, usersError: err?.response?.data?.message || err?.message || 'Failed to fetch users' });
          return [];
        }
      },

      createAdminOrProfessor: async ({ firstName, lastName, email, password, role }) => {
        try {
          const payload = { firstName, lastName, email, password, role };
          const { data } = await api.post('/users/create', payload);
          // Optionally refresh list
          try { await get().fetchAllUsers(); } catch {}
          return data;
        } catch (err) {
          throw err;
        }
      },

      updateCurrentPassword: async ({ currentPassword, newPassword }) => {
        try {
          const payload = { currentPassword, newPassword };
          const { data } = await api.put('/users/update-password', payload);
          return data;
        } catch (err) {
          throw err;
        }
      },

      serverLogout: async () => {
        try {
          await api.post('/users/logout');
        } catch (err) {
          // ignore server error on logout; proceed with local logout
        } finally {
          get().logout();
        }
      },

      // -------------------- LOGIN --------------------
      login: async (email, password) => {
        try {
          set({ loading: true, error: null });

          const res = await api.post("http://localhost:4000/api/users/login", {
            email,
            password,
          });

          const { user, token } = res.data;

          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));

          set({ user, token, loading: false });
          // Admin-side logic: redirect admins/superadmins to the admin dashboard
          if (user?.role === 'admin' || user?.role === 'superadmin') {
            window.location.href = '/admin';
          }
          return user;
        } catch (err) {
          console.error("Login failed:", err.response?.data || err.message);
          set({
            error: err.response?.data?.message || "Login failed",
            loading: false,
          });
          return null;
        }
      },

      // -------------------- FORGOT PASSWORD --------------------
      forgotPassword: async (email) => {
        try {
          set({ loading: true, error: null });
          const res = await api.post(
            "http://localhost:4000/api/users/forgot-password",
            { email }
          );

          console.log("Reset token (check backend terminal):", res.data);
          set({ loading: false });
          return true;
        } catch (err) {
          console.error(
            "Forgot password failed:",
            err.response?.data || err.message
          );
          set({
            error:
              err.response?.data?.message ||
              "Failed to send password reset link",
            loading: false,
          });
          return false;
        }
      },

      // -------------------- RESET PASSWORD --------------------
      resetPassword: async (token, newPassword) => {
        try {
          set({ loading: true, error: null });
          const res = await api.post(
            `http://localhost:4000/api/users/reset-password/${token}`,
            { newPassword }
          );

          console.log("Password reset successful:", res.data.message);
          set({ loading: false });
          return true;
        } catch (err) {
          console.error(
            "Reset password failed:",
            err.response?.data || err.message
          );
          set({
            error: err.response?.data?.message || "Failed to reset password",
            loading: false,
          });
          return false;
        }
      },

      // -------------------- LOGOUT --------------------
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        const storage = get()._storage;
        if (storage?.removeItem) {
          storage.removeItem("auth-store");
        }

        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-store",
      onRehydrateStorage: () => (state) => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");
        if (storedToken && storedUser) {
          state.set({
            token: storedToken,
            user: JSON.parse(storedUser),
          });
        }
      },
    }
  )
);
