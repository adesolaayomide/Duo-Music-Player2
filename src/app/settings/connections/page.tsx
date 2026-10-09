"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Music2,
  RefreshCw,
  Plus,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { useConnectedAccounts } from "@/hooks/useConnectedAccounts";

interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
}

const SUPPORTED_SERVICES: ServiceInfo[] = [
  {
    id: "spotify",
    name: "Spotify",
    description: "Import your public and saved playlists from Spotify",
    badgeColor: "#1DB954",
  },
  {
    id: "appleMusic",
    name: "Apple Music",
    description: "Import playlists and curated libraries from Apple Music",
    badgeColor: "#FA243C",
  },
  {
    id: "youtube",
    name: "YouTube Music",
    description: "Transfer your YouTube Music playlists directly to Duo",
    badgeColor: "#FF0000",
  },
  {
    id: "tidal",
    name: "TIDAL",
    description: "Import Hi-Fi playlists and collections from TIDAL",
    badgeColor: "#000000",
  },
  {
    id: "amazonMusic",
    name: "Amazon Music",
    description: "Transfer your playlists from Amazon Music Unlimited or Prime",
    badgeColor: "#00A8E1",
  },
  {
    id: "deezer",
    name: "Deezer",
    description: "Import Flow playlists and favorites from Deezer",
    badgeColor: "#A238FF",
  },
];

function ConnectionsContent() {
  const searchParams = useSearchParams();
  const successParam = searchParams.get("success");
  const errorParam = searchParams.get("error");
  const canceledParam = searchParams.get("canceled");

  const {
    activeAccounts,
    loading,
    error,
    isLimitReached,
    connectService,
    disconnectAccount,
    refreshAccounts,
  } = useConnectedAccounts();

  const [connectingService, setConnectingService] = useState<string | null>(
    null,
  );
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleConnect = async (serviceId: string) => {
    setActionError(null);
    setConnectingService(serviceId);
    try {
      await connectService(serviceId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect";
      setActionError(msg);
      setConnectingService(null);
    }
  };

  const handleDisconnect = async (accountId: string) => {
    setActionError(null);
    setDisconnectingId(accountId);
    try {
      await disconnectAccount(accountId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect";
      setActionError(msg);
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopBar />

      <div className="px-6 py-6 -mt-16 pt-20 max-w-5xl mx-auto w-full pb-28">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-4">
          <Link href="/library" className="hover:text-white transition">
            Library
          </Link>
          <span>/</span>
          <span className="text-white">Connected Accounts</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Connected Music Services
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Connect external streaming accounts to import your playlists into
              Duo Player.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshAccounts()}
              disabled={loading}
              className="text-xs text-[var(--color-text-secondary)] hover:text-white"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin mr-1.5" : "mr-1.5"}
              />
              Refresh
            </Button>
            <Link href="/library/imports">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-2 rounded-full px-4 text-xs font-bold bg-[var(--color-accent)] text-black hover:scale-105 transition"
              >
                <span>Import Playlists</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Banners */}
        {successParam && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 text-sm">
            <CheckCircle size={18} className="shrink-0" />
            <span>
              Account connected successfully! You can now import playlists
              below.
            </span>
          </div>
        )}

        {canceledParam && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-amber-300 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>Authorization was canceled. No account was connected.</span>
          </div>
        )}

        {(errorParam || actionError || error) && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorParam || actionError || error}</span>
          </div>
        )}

        {/* Sandbox Limit Tracker */}
        <div className="mb-8 rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={20} className="text-[var(--color-accent)]" />
              <div>
                <h2 className="text-sm font-bold text-white">
                  Sandbox Account Capacity
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  The provider sandbox supports up to 5 concurrent connected
                  streaming accounts.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white px-2.5 py-1 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-bg-hover)]">
                {activeAccounts.length} / 5 connected
              </span>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="w-full bg-[var(--color-bg-surface)] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isLimitReached ? "bg-amber-400" : "bg-[var(--color-accent)]"
              }`}
              style={{
                width: `${Math.min(100, (activeAccounts.length / 5) * 100)}%`,
              }}
            />
          </div>

          {isLimitReached && (
            <p className="text-xs text-amber-300 mt-2 font-medium">
              You have reached the maximum 5 connected accounts for the sandbox.
              Disconnect an account to connect a new one.
            </p>
          )}
        </div>

        {/* Active Connected Accounts Section */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span>Your Connected Accounts</span>
            <span className="text-xs font-normal text-[var(--color-text-muted)]">
              ({activeAccounts.length})
            </span>
          </h2>

          {activeAccounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)]/50 p-8 text-center">
              <Music2
                size={36}
                className="mx-auto text-[var(--color-text-muted)] mb-3 opacity-60"
              />
              <h3 className="text-sm font-semibold text-white mb-1">
                No services connected yet
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] max-w-sm mx-auto mb-4">
                Connect Spotify, Apple Music, or another service below to import
                your playlists directly.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeAccounts.map((account) => {
                const isDisconnecting = disconnectingId === account.id;
                const serviceConfig = SUPPORTED_SERVICES.find(
                  (s) => s.id.toLowerCase() === account.provider.toLowerCase(),
                );

                return (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] hover:border-white/20 transition"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-sm"
                        style={{
                          backgroundColor: serviceConfig?.badgeColor || "#333",
                        }}
                      >
                        {account.provider.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate capitalize">
                            {serviceConfig?.name || account.provider}
                          </h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Connected
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate font-mono">
                          ID: {account.external_account_id.slice(0, 16)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Link href={`/library/imports?accountId=${account.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-[var(--color-accent)] hover:text-white hover:bg-[var(--color-bg-hover)]"
                        >
                          Import
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        disabled={isDisconnecting}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        aria-label={`Disconnect ${account.provider}`}
                      >
                        {isDisconnecting ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available Services to Connect */}
        <div>
          <h2 className="text-base font-bold text-white mb-4">
            Available Streaming Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SUPPORTED_SERVICES.map((service) => {
              const isAlreadyConnected = activeAccounts.some(
                (a) => a.provider.toLowerCase() === service.id.toLowerCase(),
              );
              const isConnecting = connectingService === service.id;

              return (
                <div
                  key={service.id}
                  className="flex flex-col justify-between p-5 rounded-xl border border-[var(--color-bg-hover)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-surface)] transition group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md"
                        style={{ backgroundColor: service.badgeColor }}
                      >
                        {service.id.substring(0, 2).toUpperCase()}
                      </div>
                      {isAlreadyConnected && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-[var(--color-accent)] transition">
                      {service.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1 mb-4 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <Button
                    variant={isAlreadyConnected ? "secondary" : "primary"}
                    size="sm"
                    disabled={
                      isLimitReached || isConnecting || isAlreadyConnected
                    }
                    onClick={() => handleConnect(service.id)}
                    className={`w-full rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isAlreadyConnected
                        ? "opacity-50 cursor-not-allowed"
                        : "bg-[var(--color-bg-hover)] hover:bg-white hover:text-black text-white"
                    }`}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : isAlreadyConnected ? (
                      <span>Already Connected</span>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Connect {service.name}</span>
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full">
          <TopBar />
          <div className="px-6 py-6 -mt-16 pt-20 max-w-5xl mx-auto w-full text-center py-20 text-[var(--color-text-secondary)]">
            Loading connections...
          </div>
        </div>
      }
    >
      <ConnectionsContent />
    </Suspense>
  );
}
