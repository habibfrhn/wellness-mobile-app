import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

type PlaybackPhase = "idle" | "preparing" | "ready" | "playing" | "paused" | "error" | "completed";

type PlaybackState = {
  phase: PlaybackPhase;
  currentTime: number;
  duration: number;
  source: string | null;
  error: string | null;
};

type PlaybackAction =
  | { type: "PREPARE"; source: string }
  | { type: "READY" }
  | { type: "PLAYING" }
  | { type: "PAUSED" }
  | { type: "TIME"; currentTime: number }
  | { type: "DURATION"; duration: number }
  | { type: "COMPLETED" }
  | { type: "STOP" }
  | { type: "ERROR"; message: string };

const initialState: PlaybackState = {
  phase: "idle",
  currentTime: 0,
  duration: 0,
  source: null,
  error: null,
};

function reducer(state: PlaybackState, action: PlaybackAction): PlaybackState {
  switch (action.type) {
    case "PREPARE":
      return { phase: "preparing", currentTime: 0, duration: 0, source: action.source, error: null };
    case "READY":
      return { ...state, phase: state.phase === "playing" ? "playing" : "ready", error: null };
    case "PLAYING":
      return { ...state, phase: "playing", error: null };
    case "PAUSED":
      return { ...state, phase: state.phase === "completed" ? "completed" : "paused" };
    case "TIME":
      return { ...state, currentTime: action.currentTime };
    case "DURATION":
      return { ...state, duration: action.duration };
    case "COMPLETED":
      return { ...state, phase: "completed", currentTime: state.duration || state.currentTime };
    case "STOP":
      return { ...state, phase: "idle", currentTime: 0, error: null };
    case "ERROR":
      return { ...state, phase: "error", error: action.message };
    default:
      return state;
  }
}

async function waitForCanPlay(element: HTMLAudioElement) {
  if (element.readyState >= 2) return;

  await new Promise<void>((resolve, reject) => {
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio source failed to load."));
    };
    const cleanup = () => {
      element.removeEventListener("canplay", onCanPlay);
      element.removeEventListener("error", onError);
    };

    element.addEventListener("canplay", onCanPlay);
    element.addEventListener("error", onError);
  });
}

export function useBrowserAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  if (!audioRef.current && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";
  }

  const audio = audioRef.current;

  useEffect(() => {
    if (!audio) return;

    const onLoadedMetadata = () => {
      dispatch({ type: "DURATION", duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
      dispatch({ type: "READY" });
    };
    const onTimeUpdate = () => {
      dispatch({ type: "TIME", currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0 });
    };
    const onPlay = () => dispatch({ type: "PLAYING" });
    const onPause = () => dispatch({ type: "PAUSED" });
    const onEnded = () => dispatch({ type: "COMPLETED" });
    const onError = () => dispatch({ type: "ERROR", message: "Audio playback failed." });

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [audio]);

  const load = useCallback(
    async (source: string) => {
      if (!audio) return;

      dispatch({ type: "PREPARE", source });
      if (audio.src !== source) {
        audio.src = source;
      }
      audio.load();
      await waitForCanPlay(audio);
      dispatch({ type: "READY" });
    },
    [audio],
  );

  const start = useCallback(
    async ({ source, seekTo = 0, loop = false }: { source: string; seekTo?: number; loop?: boolean }) => {
      if (!audio) return false;

      try {
        await load(source);
        audio.loop = loop;
        audio.currentTime = seekTo;
        await audio.play();
        return true;
      } catch (error) {
        dispatch({ type: "ERROR", message: error instanceof Error ? error.message : "Playback could not start." });
        return false;
      }
    },
    [audio, load],
  );

  const pause = useCallback(() => {
    if (!audio) return;
    audio.pause();
  }, [audio]);

  const resume = useCallback(async () => {
    if (!audio) return false;

    try {
      await audio.play();
      return true;
    } catch (error) {
      dispatch({ type: "ERROR", message: error instanceof Error ? error.message : "Playback could not resume." });
      return false;
    }
  }, [audio]);

  const stop = useCallback(() => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
    dispatch({ type: "STOP" });
  }, [audio]);

  const seek = useCallback(
    (seconds: number) => {
      if (!audio) return;
      const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const clamped = Math.min(Math.max(seconds, 0), safeDuration || Math.max(seconds, 0));
      audio.currentTime = clamped;
      dispatch({ type: "TIME", currentTime: clamped });
    },
    [audio],
  );

  const setLoop = useCallback(
    (value: boolean) => {
      if (!audio) return;
      audio.loop = value;
    },
    [audio],
  );

  useEffect(() => {
    return () => {
      if (!audioRef.current) return;
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    };
  }, []);

  return useMemo(() => ({ state, start, load, pause, resume, stop, seek, setLoop }), [load, pause, resume, seek, setLoop, start, state, stop]);
}

export type BrowserAudioEngine = ReturnType<typeof useBrowserAudioEngine>;
export type { PlaybackPhase, PlaybackState };
