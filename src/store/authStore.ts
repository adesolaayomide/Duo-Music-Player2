import { create } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  email?: string;
  username: string;
  avatarUrl?: string;
}

interface AuthState {
  user: UserProfile | null;
  status: "loading" | "authenticated" | "unauthenticated";
  error: string | null;
  initAuth: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    username?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (
    provider: "google",
  ) => Promise<{ success: boolean; error?: string }>;
  signInAsGuest: (username?: string) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const GUEST_STORAGE_KEY = "duo_guest_user";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  error: null,

  initAuth: async () => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      // Offline / Local guest fallback
      try {
        const storedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
        if (storedGuest) {
          const guest = JSON.parse(storedGuest) as UserProfile;
          set({ user: guest, status: "authenticated", error: null });
          return;
        }
      } catch {
        // ignore
      }
      set({ user: null, status: "unauthenticated", error: null });
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", session.user.id)
          .single();

        set({
          user: {
            id: session.user.id,
            email: session.user.email,
            username:
              profile?.username || session.user.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url || undefined,
          },
          status: "authenticated",
          error: null,
        });
      } else {
        set({ user: null, status: "unauthenticated", error: null });
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (newSession?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", newSession.user.id)
            .single();

          set({
            user: {
              id: newSession.user.id,
              email: newSession.user.email,
              username:
                profile?.username ||
                newSession.user.email?.split("@")[0] ||
                "User",
              avatarUrl: profile?.avatar_url || undefined,
            },
            status: "authenticated",
            error: null,
          });
        } else {
          set({ user: null, status: "unauthenticated", error: null });
        }
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Auth initialization failed";
      set({ user: null, status: "unauthenticated", error: msg });
    }
  },

  signInWithPassword: async (email, password) => {
    set({ error: null });
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      // Local fallback sign in
      const guestUser: UserProfile = {
        id: "local-user-" + Math.random().toString(36).substring(2, 9),
        email,
        username: email.split("@")[0] || "Duo Listener",
      };
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
      } catch {
        // ignore
      }
      set({ user: guestUser, status: "authenticated", error: null });
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", data.user.id)
          .single();

        set({
          user: {
            id: data.user.id,
            email: data.user.email,
            username:
              profile?.username || data.user.email?.split("@")[0] || "User",
            avatarUrl: profile?.avatar_url || undefined,
          },
          status: "authenticated",
          error: null,
        });
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  signUp: async (email, password, username) => {
    set({ error: null });
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const guestUser: UserProfile = {
        id: "local-user-" + Math.random().toString(36).substring(2, 9),
        email,
        username: username?.trim() || email.split("@")[0] || "Duo Listener",
      };
      try {
        localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
      } catch {
        // ignore
      }
      set({ user: guestUser, status: "authenticated", error: null });
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username?.trim() || email.split("@")[0],
          },
        },
      });

      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email,
            username:
              username?.trim() || data.user.email?.split("@")[0] || "User",
          },
          status: "authenticated",
          error: null,
        });
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  signInWithOAuth: async (provider) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return {
        success: false,
        error: "Supabase OAuth is not configured in this environment",
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/`
              : undefined,
        },
      });

      if (error) {
        set({ error: error.message });
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "OAuth sign in failed";
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  signInAsGuest: (username = "Duo Guest") => {
    const guestUser: UserProfile = {
      id: "guest-" + Math.random().toString(36).substring(2, 9),
      username,
    };
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    } catch {
      // ignore
    }
    set({ user: guestUser, status: "authenticated", error: null });
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch {
      // ignore
    }
    set({ user: null, status: "unauthenticated", error: null });
  },

  clearError: () => set({ error: null }),
}));
