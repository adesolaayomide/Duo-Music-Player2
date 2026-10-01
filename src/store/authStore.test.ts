import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      status: "unauthenticated",
      error: null,
    });
  });

  it("starts with unauthenticated state after reset", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.status).toBe("unauthenticated");
    expect(state.error).toBeNull();
  });

  it("signs in as a guest with default and custom username", () => {
    const { signInAsGuest } = useAuthStore.getState();
    signInAsGuest("MusicLover");

    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user).not.toBeNull();
    expect(state.user?.username).toBe("MusicLover");
    expect(state.user?.id).toMatch(/^guest-/);

    // Stored in localStorage
    const stored = localStorage.getItem("duo_guest_user");
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).username).toBe("MusicLover");
  });

  it("signs out and clears session from localStorage", async () => {
    const { signInAsGuest, signOut } = useAuthStore.getState();
    signInAsGuest("TestGuest");
    expect(useAuthStore.getState().status).toBe("authenticated");

    await signOut();
    const state = useAuthStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.user).toBeNull();
    expect(localStorage.getItem("duo_guest_user")).toBeNull();
  });

  it("falls back to local account on password sign-up when Supabase is unconfigured", async () => {
    const { signUp } = useAuthStore.getState();
    const res = await signUp("alice@example.com", "password123", "Alice");

    expect(res.success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.user?.email).toBe("alice@example.com");
    expect(state.user?.username).toBe("Alice");
  });

  it("clears errors when clearError is called", () => {
    useAuthStore.setState({ error: "Some auth error" });
    expect(useAuthStore.getState().error).toBe("Some auth error");

    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
