import type { Track } from "@/types";

// ─────────────────────────────────────────────
//  Typed Audio Events
// ─────────────────────────────────────────────

export interface AudioEngineEvents {
  timeupdate: { currentTime: number; duration: number };
  durationchange: { duration: number };
  ended: void;
  play: void;
  pause: void;
  waiting: void;
  canplay: void;
  error: { message: string; isAutoplayBlocked?: boolean };
  bufferedchange: { buffered: number };
}

type EventKey = keyof AudioEngineEvents;
type EventListener<K extends EventKey> = (data: AudioEngineEvents[K]) => void;

// ─────────────────────────────────────────────
//  AudioEngine Singleton
// ─────────────────────────────────────────────

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private audio: HTMLAudioElement | null = null;
  private preloadAudio: HTMLAudioElement | null = null;
  private listeners = new Map<EventKey, Set<(data: unknown) => void>>();

  private currentTrack: Track | null = null;
  private currentLoadId = 0;
  private hasRetried = false;
  private isDestroyed = false;

  private constructor() {
    if (typeof window !== "undefined") {
      this.initAudio();
    }
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private initAudio(): void {
    if (typeof window === "undefined") return;

    this.audio = new Audio();
    this.audio.preload = "auto";

    // DOM event bindings
    this.audio.addEventListener("timeupdate", this.handleTimeUpdate);
    this.audio.addEventListener("durationchange", this.handleDurationChange);
    this.audio.addEventListener("play", this.handlePlay);
    this.audio.addEventListener("pause", this.handlePause);
    this.audio.addEventListener("waiting", this.handleWaiting);
    this.audio.addEventListener("canplay", this.handleCanPlay);
    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("progress", this.handleProgress);
    this.audio.addEventListener("error", this.handleAudioError);
    this.audio.addEventListener("stalled", this.handleStalled);
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.audio) {
      this.initAudio();
    }
    return this.audio;
  }

  // ── Public API ──────────────────────────────────────────

  /** Load a track and prepare for playback */
  public load(track: Track): void {
    const audio = this.ensureAudio();
    if (!audio) return;

    const loadId = ++this.currentLoadId;
    this.currentTrack = track;
    this.hasRetried = false;

    // Reset current element
    audio.pause();
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl;
    }
    audio.currentTime = 0;

    // Verify cancellation after loading initiation
    if (loadId !== this.currentLoadId) {
      return;
    }
  }

  /** Start or resume playback */
  public async play(): Promise<void> {
    const audio = this.ensureAudio();
    if (!audio || !this.currentTrack) return;

    try {
      await audio.play();
    } catch (err: unknown) {
      if (this.isDestroyed) return;

      if (err instanceof Error) {
        // AbortError is benign (rapid track switch or immediate pause)
        if (err.name === "AbortError") {
          return;
        }

        // NotAllowedError indicates autoplay policy restriction
        if (err.name === "NotAllowedError") {
          this.emit("error", {
            message:
              "Playback blocked by browser autoplay policy. Tap play to listen.",
            isAutoplayBlocked: true,
          });
          return;
        }

        this.emit("error", { message: err.message });
      } else {
        this.emit("error", { message: "An unknown playback error occurred." });
      }
    }
  }

  /** Pause playback */
  public pause(): void {
    const audio = this.ensureAudio();
    if (!audio) return;
    audio.pause();
  }

  /** Toggle playback */
  public async toggle(): Promise<void> {
    const audio = this.ensureAudio();
    if (!audio) return;
    if (audio.paused) {
      await this.play();
    } else {
      this.pause();
    }
  }

  /** Seek to target seconds */
  public seek(seconds: number): void {
    const audio = this.ensureAudio();
    if (!audio) return;
    const clamped = Math.max(0, Math.min(seconds, audio.duration || seconds));
    if (Number.isFinite(clamped)) {
      audio.currentTime = clamped;
    }
  }

  /** Set playback volume (0 to 1) */
  public setVolume(volume: number): void {
    const audio = this.ensureAudio();
    if (!audio) return;
    const clamped = Math.max(0, Math.min(1, volume));
    audio.volume = clamped;
  }

  /** Set mute state */
  public setMuted(muted: boolean): void {
    const audio = this.ensureAudio();
    if (!audio) return;
    audio.muted = muted;
  }

  /** Preload the next track in a separate hidden audio element */
  public preload(track: Track): void {
    if (typeof window === "undefined") return;

    // Create preload element if not yet instantiated
    if (!this.preloadAudio) {
      this.preloadAudio = new Audio();
      this.preloadAudio.preload = "auto";
    }

    if (this.preloadAudio.src !== track.audioUrl) {
      this.preloadAudio.src = track.audioUrl;
      this.preloadAudio.load();
    }
  }

  /** Clean up resources and event listeners */
  public destroy(): void {
    this.isDestroyed = true;
    if (this.audio) {
      this.audio.pause();
      this.audio.src = "";
      this.audio.removeEventListener("timeupdate", this.handleTimeUpdate);
      this.audio.removeEventListener(
        "durationchange",
        this.handleDurationChange,
      );
      this.audio.removeEventListener("play", this.handlePlay);
      this.audio.removeEventListener("pause", this.handlePause);
      this.audio.removeEventListener("waiting", this.handleWaiting);
      this.audio.removeEventListener("canplay", this.handleCanPlay);
      this.audio.removeEventListener("ended", this.handleEnded);
      this.audio.removeEventListener("progress", this.handleProgress);
      this.audio.removeEventListener("error", this.handleAudioError);
      this.audio.removeEventListener("stalled", this.handleStalled);
      this.audio = null;
    }

    if (this.preloadAudio) {
      this.preloadAudio.src = "";
      this.preloadAudio = null;
    }

    this.listeners.clear();
    AudioEngine.instance = null;
  }

  // ── Event Emitter ────────────────────────────────────────

  public on<K extends EventKey>(
    event: K,
    listener: EventListener<K>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    const genericListener = listener as (data: unknown) => void;
    set.add(genericListener);

    return () => {
      set.delete(genericListener);
    };
  }

  private emit<K extends EventKey>(event: K, data: AudioEngineEvents[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // Prevent listener exceptions from breaking the engine
      }
    });
  }

  // ── DOM Event Handlers ───────────────────────────────────

  private handleTimeUpdate = (): void => {
    if (!this.audio) return;
    this.emit("timeupdate", {
      currentTime: this.audio.currentTime || 0,
      duration: this.audio.duration || (this.currentTrack?.duration ?? 0),
    });
  };

  private handleDurationChange = (): void => {
    if (!this.audio) return;
    const dur = this.audio.duration;
    if (Number.isFinite(dur) && dur > 0) {
      this.emit("durationchange", { duration: dur });
    }
  };

  private handlePlay = (): void => {
    this.emit("play", undefined as void);
  };

  private handlePause = (): void => {
    this.emit("pause", undefined as void);
  };

  private handleWaiting = (): void => {
    this.emit("waiting", undefined as void);
  };

  private handleCanPlay = (): void => {
    this.emit("canplay", undefined as void);
  };

  private handleEnded = (): void => {
    this.emit("ended", undefined as void);
  };

  private handleProgress = (): void => {
    if (!this.audio) return;
    const timeRanges = this.audio.buffered;
    if (timeRanges.length > 0) {
      // Get the highest buffered time for the current playback position
      let bufferedEnd = 0;
      for (let i = 0; i < timeRanges.length; i++) {
        const start = timeRanges.start(i);
        const end = timeRanges.end(i);
        if (this.audio.currentTime >= start && this.audio.currentTime <= end) {
          bufferedEnd = end;
          break;
        }
        if (end > bufferedEnd) {
          bufferedEnd = end;
        }
      }
      this.emit("bufferedchange", { buffered: bufferedEnd });
    }
  };

  private handleAudioError = (): void => {
    if (!this.audio || !this.currentTrack) return;

    // Attempt 1 automatic retry on error
    if (!this.hasRetried) {
      this.hasRetried = true;
      const savedTime = this.audio.currentTime;
      this.audio.load();
      if (savedTime > 0) {
        this.audio.currentTime = savedTime;
      }
      this.play().catch(() => {
        // Will be caught by play() error handling
      });
      return;
    }

    const code = this.audio.error?.code;
    let message = "Failed to load audio track.";
    if (code === MediaError.MEDIA_ERR_NETWORK) {
      message = "A network error occurred while loading audio.";
    } else if (code === MediaError.MEDIA_ERR_DECODE) {
      message = "An error occurred while decoding audio.";
    } else if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
      message = "Audio format not supported or stream unavailable.";
    }

    this.emit("error", { message });
  };

  private handleStalled = (): void => {
    // If stalled and hasn't started playing, emit waiting
    if (
      this.audio &&
      !this.audio.paused &&
      this.audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
    ) {
      this.emit("waiting", undefined as void);
    }
  };
}

export const getAudioEngine = (): AudioEngine => AudioEngine.getInstance();
