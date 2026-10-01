"use client";

import React from "react";
import { ExternalLink, ShieldCheck, X } from "lucide-react";
import type { Track } from "@/types";

interface LicenseDialogProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LicenseDialog({ track, isOpen, onClose }: LicenseDialogProps) {
  if (!isOpen || !track) return null;

  const jamendoTrackUrl = `https://www.jamendo.com/track/${track.providerTrackId || track.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="license-dialog-title"
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--color-bg-hover)] bg-[var(--color-bg-surface)] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-bg-hover)] pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--color-accent)]" />
            <h3
              id="license-dialog-title"
              className="text-base font-semibold text-[var(--color-text-primary)]"
            >
              License & Attribution
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div>
            <div className="font-semibold text-[var(--color-text-primary)]">
              {track.title}
            </div>
            <div className="text-[var(--color-text-secondary)]">
              by {track.artistName}
            </div>
          </div>

          <div className="rounded-md bg-[var(--color-bg-elevated)] p-3">
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              License
            </div>
            <div className="mt-1 font-medium text-[var(--color-accent)]">
              {track.licenseLabel}
            </div>
            <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Code:{" "}
              <span className="font-mono text-white">{track.license}</span>
            </div>
          </div>

          <div className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
            This track is legally distributed by{" "}
            <strong className="text-[var(--color-text-primary)]">
              Jamendo Music
            </strong>{" "}
            under a Creative Commons license. You are free to stream, share, and
            enjoy this music in accordance with the author's licensing terms.
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {track.licenseUrl && (
              <a
                href={track.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md bg-[var(--color-bg-hover)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)]/80 hover:text-[var(--color-accent)]"
              >
                <span>Read License Deed</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <a
              href={jamendoTrackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-md bg-[var(--color-bg-hover)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)]/80 hover:text-[var(--color-accent)]"
            >
              <span>View on Jamendo</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full bg-[var(--color-bg-hover)] px-5 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-text-secondary)] hover:text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
