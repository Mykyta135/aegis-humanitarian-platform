import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  id: string;
  email: string;
  role: "admin" | "volunteer";
  exp?: number; // JWT standard expiry field (Unix seconds)
  sub?: string; // JWT subject — the user id used by the backend
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: DecodedToken | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

function isTokenExpired(decoded: DecodedToken): boolean {
  if (!decoded.exp) return false;
  // Give a 10-second leeway to avoid edge-case race conditions
  return decoded.exp * 1000 < Date.now() - 10_000;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isAuthenticated: false,
      user: null,
      setToken: (token) => {
        if (token) {
          const decoded = jwtDecode<DecodedToken>(token);
          if (isTokenExpired(decoded)) {
            // Don't store an already-expired token
            set({ token: null, isAuthenticated: false, user: null });
          } else {
            // Normalise: backend uses `sub` as user id but the app uses `id`
            const user: DecodedToken = {
              ...decoded,
              id: decoded.id ?? decoded.sub ?? "",
            };
            set({ token, isAuthenticated: true, user });
          }
        } else {
          set({ token: null, isAuthenticated: false, user: null });
        }
      },
      logout: () => set({ token: null, isAuthenticated: false, user: null }),
    }),
    {
      name: "aegis-auth-storage",
      // On rehydration from localStorage, validate the restored token
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          try {
            const decoded = jwtDecode<DecodedToken>(state.token);
            if (isTokenExpired(decoded)) {
              state.logout();
            }
          } catch {
            state.logout();
          }
        }
      },
    }
  )
);
