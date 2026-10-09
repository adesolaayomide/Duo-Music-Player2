"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Music,
  RefreshCw,
  FolderDown,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  PlusCircle,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";
import { useImportTransfers } from "@/hooks/useImportTransfers";
import type { ExternalPlaylist } from "@/lib/providers/musicTransfer/types";

function ImportsContent() {
  const searchParams = useSearchParams();
  const initialAccountId = searchParams.get("accountId");

  const { activeAccounts, loading: accountsLoading } = useConnectedAccounts();
  const {
    transfers,
    activeTransfers,
    fetchSourcePlaylists,
    startTransfer,
    refreshTransfers,
  } = useImportTransfers();

  const [customSelectedAccountId, setCustomSelectedAccountId] =
    useState<string>("");
  const selectedAccountId =
    customSelectedAccountId ||
    (initialAccountId && activeAccounts.some((a) => a.id === initialAccountId)
      ? initialAccountId
      : activeAccounts[0]?.id || "");

  const [sourcePlaylists, setSourcePlaylists] = useState<ExternalPlaylist[]>(
    [],
  );
  const [loadingPlaylists, setLoadingPlaylists] = useState<boolean>(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);

  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(
    new Set(),
  );
  const [isStartingTransfer, setIsStartingTransfer] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Load playlists when account changes
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      if (!selectedAccountId) {
        setSourcePlaylists([]);
        return;
      }

      setLoadingPlaylists(true);
      setPlaylistError(null);
      setSelectedPlaylistIds(new Set());
      try {
        const playlists = await fetchSourcePlaylists(selectedAccountId);
        if (isMounted) setSourcePlaylists(playlists);
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Failed to load playlists";
          setPlaylistError(msg);
        }
      } finally {
        if (isMounted) setLoadingPlaylists(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [selectedAccountId, fetchSourcePlaylists]);

  const toggleSelectPlaylist = (id: string) => {
    setSelectedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPlaylistIds.size === sourcePlaylists.length) {
      setSelectedPlaylistIds(new Set());
    } else {
      setSelectedPlaylistIds(new Set(sourcePlaylists.map((p) => p.id)));
    }
  };

  const handleStartImport = async () => {
    if (selectedPlaylistIds.size === 0 || !selectedAccountId) return;

    setActionMessage(null);
    setIsStartingTransfer(true);

    const chosenPlaylists = sourcePlaylists
      .filter((p) => selectedPlaylistIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        trackCount: p.trackCount,
      }));

    try {
      await startTransfer({
        accountId: selectedAccountId,
        playlists: chosenPlaylists,
      });

      setSelectedPlaylistIds(new Set());
      setActionMessage({
        type: "success",
        text: `Import started for ${chosenPlaylists.length} playlist(s)! Tracking progress below.`,
      });
      refreshTransfers();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to start transfer";
      setActionMessage({ type: "error", text: msg });
    } finally {
      setIsStartingTransfer(false);
    }
  };

  const selectedAccount = activeAccounts.find(
    (a) => a.id === selectedAccountId,
  );

  return (
    <div className="flex flex-col min-h-full">
      <TopBar />

      <div className="px-6 py-6 -mt-16 pt-20 max-w-5xl mx-auto w-full pb-28">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-4">
          <Link href="/library" className="hover:text-white transition">
            Library
          </Link>
          <span>/</span>
          <span className="text-white">Import Playlists</span>
        </div>

        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FolderDown size={28} className="text-[var(--color-accent)]" />
              <span>Import Playlists</span>
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Select playlists from your connected streaming accounts and import
              them into Duo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings/connections">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[var(--color-text-secondary)] hover:text-white border border-[var(--color-bg-hover)]"
              >
                <span>Manage Accounts</span>
                <ArrowRight size={13} className="ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Alerts / Notifications */}
        {actionMessage && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border p-4 text-sm ${
              actionMessage.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertTriangle size={18} className="shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Active In-Progress Transfers Section */}
        {activeTransfers.length > 0 && (
          <div className="mb-10 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-bg-elevated)] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <RefreshCw
                  size={18}
                  className="animate-spin text-[var(--color-accent)]"
                />
                <h2 className="text-sm font-bold text-white">
                  Active Transfers in Progress ({activeTransfers.length})
                </h2>
              </div>
              <span className="text-xs text-[var(--color-text-secondary)]">
                Auto-syncing...
              </span>
            </div>

            <div className="space-y-4">
              {activeTransfers.map((t) => {
                const total = t.total_items || 1;
                const processed =
                  (t.imported_items || 0) + (t.failed_items || 0);
                const percent = Math.min(
                  100,
                  Math.round((processed / total) * 100),
                );

                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-bg-hover)]"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-2">
                      <span className="text-white truncate">
                        {t.source_playlist_name}
                      </span>
                      <span className="text-[var(--color-accent)] font-mono">
                        {processed} / {t.total_items} items ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-[var(--color-bg-hover)] rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-[var(--color-accent)] h-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                      <span>
                        Status:{" "}
                        {t.status === "in_progress"
                          ? "Matching catalog tracks..."
                          : "Queued"}
                      </span>
                      <span>{t.imported_items} matched</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1: Choose Connected Service */}
        {accountsLoading ? (
          <div className="py-12 text-center text-xs text-[var(--color-text-secondary)]">
            Loading accounts...
          </div>
        ) : activeAccounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-10 text-center mb-10">
            <Layers
              size={40}
              className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-60"
            />
            <h3 className="text-base font-bold text-white mb-1">
              No services connected
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
              Connect your Spotify, Apple Music, YouTube Music, or other
              streaming account to browse and import your playlists.
            </p>
            <Link href="/settings/connections">
              <Button
                variant="primary"
                size="sm"
                className="rounded-full px-5 text-xs font-bold bg-[var(--color-accent)] text-black hover:scale-105 transition"
              >
                <PlusCircle size={14} className="mr-1.5" />
                <span>Connect a Service</span>
              </Button>
            </Link>
          </div>
        ) : (
          <div className="mb-10">
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              1. Select Source Account
            </label>

            <div className="flex flex-wrap gap-2.5">
              {activeAccounts.map((account) => {
                const isSelected = account.id === selectedAccountId;
                return (
                  <button
                    key={account.id}
                    onClick={() => setCustomSelectedAccountId(account.id)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                      isSelected
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-white"
                        : "border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-bg-surface)]"
                    }`}
                  >
                    <span className="capitalize">{account.provider}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                      ({account.external_account_id.slice(0, 8)}...)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Browse and Select Playlists */}
        {selectedAccountId && (
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider">
                  2. Select Playlists to Import
                </label>
                <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  Choose which playlists to copy into your Duo Library.
                </p>
              </div>

              {sourcePlaylists.length > 0 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-white underline transition"
                  >
                    {selectedPlaylistIds.size === sourcePlaylists.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={
                      selectedPlaylistIds.size === 0 || isStartingTransfer
                    }
                    onClick={handleStartImport}
                    className="rounded-full px-5 text-xs font-bold bg-[var(--color-accent)] text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition shadow-md flex items-center gap-2"
                  >
                    {isStartingTransfer ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <FolderDown size={14} />
                    )}
                    <span>Import {selectedPlaylistIds.size} Selected</span>
                  </Button>
                </div>
              )}
            </div>

            {loadingPlaylists ? (
              <div className="rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-12 text-center text-xs text-[var(--color-text-secondary)]">
                <RefreshCw
                  size={24}
                  className="animate-spin mx-auto text-[var(--color-accent)] mb-3"
                />
                <span>
                  Loading playlists from{" "}
                  {selectedAccount?.provider || "service"}...
                </span>
              </div>
            ) : playlistError ? (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-400 text-xs flex items-center justify-between">
                <span>{playlistError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchSourcePlaylists(selectedAccountId)}
                  className="text-xs text-rose-300 hover:text-white"
                >
                  Retry
                </Button>
              </div>
            ) : sourcePlaylists.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)]/60 p-8 text-center text-xs text-[var(--color-text-secondary)]">
                <p>No playlists found in this account.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {sourcePlaylists.map((playlist) => {
                  const isChecked = selectedPlaylistIds.has(playlist.id);

                  return (
                    <div
                      key={playlist.id}
                      onClick={() => toggleSelectPlaylist(playlist.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                          : "border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by div onClick
                        className="rounded border-[var(--color-bg-hover)] text-[var(--color-accent)] focus:ring-0 shrink-0 h-4 w-4"
                        aria-label={`Select ${playlist.name}`}
                      />

                      {/* Cover thumbnail */}
                      <div className="h-12 w-12 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-bg-hover)] flex items-center justify-center shrink-0 overflow-hidden relative">
                        {playlist.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={playlist.imageUrl}
                            alt={playlist.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Music
                            size={20}
                            className="text-[var(--color-text-muted)]"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate">
                          {playlist.name}
                        </h4>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                          {playlist.trackCount} tracks
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Import History & Match Reports */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Import History</span>
              <span className="text-xs font-normal text-[var(--color-text-muted)]">
                ({transfers.length})
              </span>
            </h2>

            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTransfers}
              className="text-xs text-[var(--color-text-secondary)] hover:text-white"
            >
              <RefreshCw size={12} className="mr-1" />
              Refresh
            </Button>
          </div>

          {transfers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)]/40 p-8 text-center text-xs text-[var(--color-text-secondary)]">
              No imports completed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((t) => {
                const isExpanded = expandedReportId === t.id;
                const completedEvent = t.import_transfer_events?.find(
                  (e) => e.event_type === "transfer.completed",
                );
                const payload = (completedEvent?.payload || {}) as Record<
                  string,
                  unknown
                >;
                const unmatchedDetails = (payload.unmatchedDetails ||
                  []) as Array<{
                  name: string;
                  artist: string;
                  reason: string;
                }>;

                return (
                  <div
                    key={t.id}
                    className="rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-4 hover:border-white/20 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            {t.source_playlist_name}
                          </h4>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                              t.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : t.status === "failed"
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                          <span>
                            {t.imported_items} / {t.total_items} tracks matched
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(t.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {unmatchedDetails.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedReportId(isExpanded ? null : t.id)
                            }
                            className="text-xs text-[var(--color-text-secondary)] hover:text-white"
                          >
                            <FileText size={13} className="mr-1.5" />
                            <span>
                              Match Report ({unmatchedDetails.length} unmatched)
                            </span>
                            {isExpanded ? (
                              <ChevronUp size={14} className="ml-1" />
                            ) : (
                              <ChevronDown size={14} className="ml-1" />
                            )}
                          </Button>
                        )}
                        <Link href="/library">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-[var(--color-accent)] hover:text-white"
                          >
                            View Library
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Expandable Match Report Drawer */}
                    {isExpanded && unmatchedDetails.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-bg-hover)] animate-in fade-in duration-150">
                        <h5 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                          <AlertTriangle size={14} className="text-amber-400" />
                          <span>Unmatched Tracks Report</span>
                        </h5>
                        <p className="text-[11px] text-[var(--color-text-secondary)] mb-3">
                          These tracks were in the source playlist but could not
                          be matched to a Creative Commons licensed track in the
                          Jamendo catalog.
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                          {unmatchedDetails.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded bg-[var(--color-bg-surface)] text-xs"
                            >
                              <div className="truncate mr-2">
                                <span className="text-white font-medium">
                                  {item.name}
                                </span>
                                <span className="text-[var(--color-text-muted)]">
                                  {" "}
                                  — {item.artist}
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-300 shrink-0 font-medium">
                                {item.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full">
          <TopBar />
          <div className="px-6 py-6 -mt-16 pt-20 max-w-5xl mx-auto w-full text-center py-20 text-[var(--color-text-secondary)]">
            Loading imports...
          </div>
        </div>
      }
    >
      <ImportsContent />
    </Suspense>
  );
}
