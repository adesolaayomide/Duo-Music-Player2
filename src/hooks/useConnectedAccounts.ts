"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

export interface ConnectedAccount {
  id: string;
  user_id: string;
  provider: string;
  external_account_id: string;
  status: "connected" | "revoked" | "error";
  connected_at: string;
  revoked_at?: string | null;
}

const GUEST_ACCOUNTS_STORAGE_KEY = "duo_guest_connected_accounts";

export function useConnectedAccounts() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/transfer/accounts");
      if (res.ok) {
        const data = await res.json();
        const serverAccounts = data.accounts || [];

        // In guest mode, combine with any local guest accounts
        if (typeof window !== "undefined") {
          const storedGuest = localStorage.getItem(GUEST_ACCOUNTS_STORAGE_KEY);
          if (storedGuest) {
            try {
              const guestAccounts = JSON.parse(storedGuest) as ConnectedAccount[];
              const merged = [...serverAccounts];
              for (const ga of guestAccounts) {
                if (!merged.some((a) => a.id === ga.id || a.external_account_id === ga.external_account_id)) {
                  merged.push(ga);
                }
              }
              setAccounts(merged);
              return;
            } catch {
              // Ignore parse error
            }
          }
        }
        setAccounts(serverAccounts);
      } else {
        // Fallback to local storage
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(GUEST_ACCOUNTS_STORAGE_KEY);
          if (stored) {
            setAccounts(JSON.parse(stored));
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load connected accounts";
      setError(msg);
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(GUEST_ACCOUNTS_STORAGE_KEY);
        if (stored) {
          try {
            setAccounts(JSON.parse(stored));
          } catch {
            // Ignore parse error
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        await fetchAccounts();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [fetchAccounts, user?.id]);

  const connectService = async (service: string) => {
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/api/transfer/callback`;
      const res = await fetch(
        `/api/transfer/connect-url?service=${encodeURIComponent(service)}&returnUrl=${encodeURIComponent(returnUrl)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to get authorization URL");
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
      throw err;
    }
  };

  const disconnectAccount = async (accountId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/transfer/accounts/${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, status: "revoked", revoked_at: new Date().toISOString() } : acc
        )
      );

      // Also clean up local storage if in guest mode
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(GUEST_ACCOUNTS_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as ConnectedAccount[];
            const updated = parsed.map((acc) =>
              acc.id === accountId ? { ...acc, status: "revoked" as const } : acc
            );
            localStorage.setItem(GUEST_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
          } catch {
            // Ignore parse error
          }
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to disconnect account");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Disconnect failed";
      setError(msg);
      throw err;
    }
  };

  const addGuestAccount = (account: ConnectedAccount) => {
    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== account.id);
      const next = [account, ...filtered];
      if (typeof window !== "undefined") {
        localStorage.setItem(GUEST_ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const activeAccounts = accounts.filter((a) => a.status === "connected");
  const isLimitReached = activeAccounts.length >= 5;

  return {
    accounts,
    activeAccounts,
    loading,
    error,
    isLimitReached,
    connectService,
    disconnectAccount,
    addGuestAccount,
    refreshAccounts: fetchAccounts,
  };
}
