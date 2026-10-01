"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/playerStore";

/**
 * Global keyboard shortcuts hook for Duo Player.
 *
 * Controls:
 * - Space: Play / Pause (prevents page scrolling)
 * - ArrowRight: Seek +5s
 * - ArrowLeft: Seek -5s
 * - Shift + ArrowRight: Next track
 * - Shift + ArrowLeft: Previous track
 * - ArrowUp: Volume +5%
 * - ArrowDown: Volume -5%
 * - M: Toggle mute
 * - S: Toggle shuffle
 * - R: Cycle repeat
 *
 * Automatically ignored when user is typing in form fields or editable content.
 */
export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input, textarea, select, or contenteditable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName?.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const store = usePlayerStore.getState();

      switch (e.code) {
        case "Space": {
          e.preventDefault(); // Stop page scrolling
          store.togglePlay();
          break;
        }

        case "ArrowRight": {
          e.preventDefault();
          if (e.shiftKey) {
            store.next();
          } else {
            store.seek(Math.min(store.duration, store.currentTime + 5));
          }
          break;
        }

        case "ArrowLeft": {
          e.preventDefault();
          if (e.shiftKey) {
            store.previous();
          } else {
            store.seek(Math.max(0, store.currentTime - 5));
          }
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          store.setVolume(Math.min(1, store.volume + 0.05));
          break;
        }

        case "ArrowDown": {
          e.preventDefault();
          store.setVolume(Math.max(0, store.volume - 0.05));
          break;
        }

        case "KeyM": {
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            store.toggleMute();
          }
          break;
        }

        case "KeyS": {
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            store.toggleShuffle();
          }
          break;
        }

        case "KeyR": {
          if (!e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            store.cycleRepeat();
          }
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
