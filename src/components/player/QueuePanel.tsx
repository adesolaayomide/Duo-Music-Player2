"use client";

import { usePlayerStore, selectCurrentTrack } from "@/store/playerStore";
import { formatDuration } from "@/lib/utils/helpers";
import { X, Trash2, Music2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QueuePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QueuePanel({ isOpen, onClose }: QueuePanelProps) {
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const currentTrack = usePlayerStore(selectCurrentTrack);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Play Queue"
      className="fixed bottom-[var(--player-height)] right-4 z-40 w-80 md:w-96 max-h-[460px] bg-bg-surface border border-bg-hover rounded-md shadow-2xl flex flex-col overflow-hidden animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-bg-hover bg-bg-elevated">
        <div className="flex items-center gap-2">
          <Music2 size={18} className="text-accent" />
          <h2 className="text-sm font-bold text-white">Play Queue</h2>
          <span className="text-xs text-text-muted">({queue.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              className="text-text-muted hover:text-danger p-1 rounded-sm transition-colors text-xs flex items-center gap-1 font-medium"
              title="Clear queue"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close queue"
            className="text-text-secondary hover:text-white p-1 rounded-sm transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Queue tracks list */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 py-1">
        {queue.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">
            Your queue is empty.
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent =
              idx === currentIndex && track.id === currentTrack?.id;

            return (
              <div
                key={`${track.id}-${idx}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-xs hover:bg-bg-hover/60 transition-colors group",
                  isCurrent && "bg-accent/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => playQueue(queue, idx)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <span
                    className={cn(
                      "w-5 text-right font-medium",
                      isCurrent ? "text-accent font-bold" : "text-text-muted",
                    )}
                  >
                    {idx + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate font-semibold",
                        isCurrent ? "text-accent" : "text-white",
                      )}
                    >
                      {track.title}
                    </p>
                    <p className="text-text-muted truncate">
                      {track.artistName}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-2 ml-2">
                  <span className="text-text-muted tabular-nums">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromQueue(idx)}
                    aria-label={`Remove ${track.title} from queue`}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-opacity p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
