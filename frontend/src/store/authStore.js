import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return { username: decoded.username, role: decoded.role, id: decoded.user_id };
  } catch {
    return null;
  }
};

const storedAccessToken = localStorage.getItem("access_token");

export const useAuthStore = create((set) => ({
  accessToken: storedAccessToken,
  refreshToken: localStorage.getItem("refresh_token") || null,
  user: getUserFromToken(storedAccessToken),

  login: (access, refresh) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    set({ accessToken: access, refreshToken: refresh, user: getUserFromToken(access) });
  },

  setAccessToken: (access) => {
    localStorage.setItem("access_token", access);
    set({ accessToken: access, user: getUserFromToken(access) });
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));