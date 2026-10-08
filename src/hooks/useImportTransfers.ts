"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ExternalPlaylist } from "@/lib/providers/musicTransfer/types";
import { useAuthStore } from "@/store/authStore";

export interface ImportTransferEvent {
  id: string;
  transfer_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  received_at: string;
}

export interface ImportTransfer {
  id: string;
  user_id: string;
  connected_account_id: string | null;
  provider_transfer_id: string | null;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  source_playlist_name: string;
  total_items: number;
  imported_items: number;
  failed_items: number;
  created_at: string;
  updated_at: string;
  import_transfer_events?: ImportTransferEvent[];
}

const GUEST_TRANSFERS_STORAGE_KEY = "duo_guest_import_transfers";

export function useImportTransfers() {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<ImportTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadTransfers = useCallback(async () => {
    try {
      const res = await fetch("/api/transfer/status");
      if (res.ok) {
        const data = await res.json();
        const serverTransfers = (data.transfers || []) as ImportTransfer[];

        if (typeof window !== "undefined") {
          const storedGuest = localStorage.getItem(GUEST_TRANSFERS_STORAGE_KEY);
          if (storedGuest) {
            try {
              const guestTransfers = JSON.parse(storedGuest) as ImportTransfer[];
              const merged = [...serverTransfers];
              for (const gt of guestTransfers) {
                if (!merged.some((t) => t.id === gt.id)) {
                  merged.push(gt);
                }
              }
              setTransfers(merged);
              return;
            } catch {
              // Ignore parse error
            }
          }
        }
        setTransfers(serverTransfers);
      } else {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem(GUEST_TRANSFERS_STORAGE_KEY);
          if (stored) {
            try {
              setTransfers(JSON.parse(stored));
            } catch {
              // Ignore parse error
            }
          }
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(GUEST_TRANSFERS_STORAGE_KEY);
        if (stored) {
          try {
            setTransfers(JSON.parse(stored));
          } catch {
            // Ignore parse error
          }
        }
      }
    }
  }, []);

  // Poll while any transfers are pending or in_progress
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        await loadTransfers();
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, [loadTransfers, user?.id]);

  useEffect(() => {
    const hasActive = transfers.some(
      (t) => t.status === "pending" || t.status === "in_progress"
    );

    if (hasActive) {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          loadTransfers();
        }, 2500);
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [transfers, loadTransfers]);

  const fetchSourcePlaylists = async (
    accountId?: string,
    userUuid?: string
  ): Promise<ExternalPlaylist[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (userUuid) params.set("userUuid", userUuid);

      const res = await fetch(`/api/transfer/playlists?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to fetch source playlists");
      }

      const data = await res.json();
      return (data.playlists || []) as ExternalPlaylist[];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load playlists";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const startTransfer = async (params: {
    accountId?: string;
    userUuid?: string;
    playlists: Array<{ id: string; name: string; trackCount: number }>;
  }): Promise<ImportTransfer[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transfer/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to start transfer");
      }

      const data = await res.json();
      const newTransfers = (data.transfers || []) as ImportTransfer[];

      setTransfers((prev) => {
        const updated = [...newTransfers, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(
            GUEST_TRANSFERS_STORAGE_KEY,
            JSON.stringify(updated)
          );
        }
        return updated;
      });

      return newTransfers;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start transfer";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const activeTransfers = transfers.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  );
  const completedTransfers = transfers.filter(
    (t) => t.status === "completed" || t.status === "failed" || t.status === "cancelled"
  );

  return {
    transfers,
    activeTransfers,
    completedTransfers,
    isLoading,
    error,
    refreshTransfers: loadTransfers,
    fetchSourcePlaylists,
    startTransfer,
  };
}
