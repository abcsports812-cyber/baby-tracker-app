import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';
import { create } from 'zustand';
import { getSoundById, getSoundSource, type Sound } from '../data/sounds';
import { generateId, nowIso } from '../lib/id';
import { useRecentSoundsStore } from './index';

export type SleepTimerMinutes = 5 | 10 | 15 | 30 | 45 | 60 | 90 | null;

const RECENT_LIMIT = 8;
const DEFAULT_VOLUME = 0.85;
const FADE_DURATION_SECONDS = 8;

interface PlayerEntry {
  player: AudioPlayer;
}

const players = new Map<string, PlayerEntry>();
let tickHandle: ReturnType<typeof setInterval> | null = null;

interface SoundPlayerState {
  /** Sound ids currently loaded & (playing or paused-in-place). */
  activeSoundIds: string[];
  /** Per-sound target volume, 0..1, keyed by sound id. */
  volumes: Record<string, number>;
  isPlaying: boolean;
  isMixMode: boolean;
  timerMinutes: SleepTimerMinutes;
  timerEndsAt: number | null;
  remainingSeconds: number | null;
  isFadingOut: boolean;

  playSingle: (soundId: string) => void;
  togglePlayPause: () => void;
  stop: () => void;
  toggleMixSound: (soundId: string) => void;
  isSoundActive: (soundId: string) => boolean;
  setVolume: (soundId: string, volume: number) => void;
  setSleepTimer: (minutes: SleepTimerMinutes) => void;
  cancelSleepTimer: () => void;
}

function recordRecentlyPlayed(soundId: string) {
  const { value, set } = useRecentSoundsStore.getState();
  const withoutThis = value.filter((e) => e.soundId !== soundId);
  const next = [{ soundId, playedAt: nowIso() }, ...withoutThis].slice(0, RECENT_LIMIT);
  set(next);
}

function ensurePlayer(sound: Sound, volume: number): AudioPlayer {
  const existing = players.get(sound.id);
  if (existing) return existing.player;

  const player = createAudioPlayer(getSoundSource(sound) as AudioSource, { updateInterval: 1000 });
  player.loop = true;
  player.volume = volume;
  players.set(sound.id, { player });
  return player;
}

function removePlayer(soundId: string) {
  const entry = players.get(soundId);
  if (!entry) return;
  try {
    entry.player.pause();
    entry.player.clearLockScreenControls();
    entry.player.remove();
  } catch {
    // player may already be released; safe to ignore
  }
  players.delete(soundId);
}

function removeAllPlayers() {
  for (const id of Array.from(players.keys())) removePlayer(id);
}

function clearTimerInterval() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

export const useSoundPlayerStore = create<SoundPlayerState>((set, get) => ({
  activeSoundIds: [],
  volumes: {},
  isPlaying: false,
  isMixMode: false,
  timerMinutes: null,
  timerEndsAt: null,
  remainingSeconds: null,
  isFadingOut: false,

  isSoundActive: (soundId) => get().activeSoundIds.includes(soundId),

  playSingle: (soundId) => {
    const sound = getSoundById(soundId);
    if (!sound) return;

    removeAllPlayers();
    const volume = get().volumes[soundId] ?? DEFAULT_VOLUME;
    const player = ensurePlayer(sound, volume);
    player.play();
    try {
      player.setActiveForLockScreen(true, { title: sound.name, artist: 'Baby Tracker Sounds' });
    } catch {
      // lock screen integration is best-effort and platform-dependent
    }

    set((s) => ({
      activeSoundIds: [soundId],
      volumes: { ...s.volumes, [soundId]: volume },
      isPlaying: true,
      isMixMode: false,
      isFadingOut: false,
    }));

    recordRecentlyPlayed(soundId);
  },

  togglePlayPause: () => {
    const { isPlaying, activeSoundIds } = get();
    if (activeSoundIds.length === 0) return;

    if (isPlaying) {
      activeSoundIds.forEach((id) => players.get(id)?.player.pause());
      set({ isPlaying: false });
    } else {
      activeSoundIds.forEach((id) => players.get(id)?.player.play());
      set({ isPlaying: true });
    }
  },

  stop: () => {
    removeAllPlayers();
    clearTimerInterval();
    set({
      activeSoundIds: [],
      isPlaying: false,
      isMixMode: false,
      timerMinutes: null,
      timerEndsAt: null,
      remainingSeconds: null,
      isFadingOut: false,
    });
  },

  toggleMixSound: (soundId) => {
    const sound = getSoundById(soundId);
    if (!sound || !sound.mixable) return;

    const { activeSoundIds, volumes } = get();
    const isActive = activeSoundIds.includes(soundId);

    if (isActive) {
      removePlayer(soundId);
      const remaining = activeSoundIds.filter((id) => id !== soundId);
      if (remaining.length === 0) {
        get().stop();
        return;
      }
      set({ activeSoundIds: remaining, isMixMode: remaining.length > 1 });
      return;
    }

    // Switching from a single non-mixable sound (or nothing) into mix mode.
    const volume = volumes[soundId] ?? DEFAULT_VOLUME;
    const player = ensurePlayer(sound, volume);
    player.play();

    const nextActive = [...activeSoundIds, soundId];
    // Only one player can own the lock screen; clear it once we have more than one sound.
    if (nextActive.length > 1) {
      players.forEach((entry) => {
        try {
          entry.player.clearLockScreenControls();
        } catch {
          // ignore
        }
      });
    } else {
      try {
        player.setActiveForLockScreen(true, { title: sound.name, artist: 'Baby Tracker Sounds' });
      } catch {
        // ignore
      }
    }

    set((s) => ({
      activeSoundIds: nextActive,
      volumes: { ...s.volumes, [soundId]: volume },
      isPlaying: true,
      isMixMode: nextActive.length > 1,
      isFadingOut: false,
    }));

    recordRecentlyPlayed(soundId);
  },

  setVolume: (soundId, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const entry = players.get(soundId);
    if (entry) entry.player.volume = clamped;
    set((s) => ({ volumes: { ...s.volumes, [soundId]: clamped } }));
  },

  setSleepTimer: (minutes) => {
    clearTimerInterval();

    if (minutes === null) {
      set({ timerMinutes: null, timerEndsAt: null, remainingSeconds: null, isFadingOut: false });
      return;
    }

    const endsAt = Date.now() + minutes * 60_000;
    set({ timerMinutes: minutes, timerEndsAt: endsAt, remainingSeconds: minutes * 60, isFadingOut: false });

    tickHandle = setInterval(() => {
      const { timerEndsAt, volumes, activeSoundIds } = get();
      if (!timerEndsAt) return;

      const msLeft = timerEndsAt - Date.now();
      const secondsLeft = Math.max(0, Math.round(msLeft / 1000));

      if (secondsLeft <= 0) {
        clearTimerInterval();
        get().stop();
        return;
      }

      const fading = secondsLeft <= FADE_DURATION_SECONDS;
      if (fading) {
        const fadeFactor = secondsLeft / FADE_DURATION_SECONDS;
        activeSoundIds.forEach((id) => {
          const entry = players.get(id);
          const base = volumes[id] ?? DEFAULT_VOLUME;
          if (entry) entry.player.volume = base * fadeFactor;
        });
      }

      set({ remainingSeconds: secondsLeft, isFadingOut: fading });
    }, 1000);
  },

  cancelSleepTimer: () => {
    clearTimerInterval();
    const { activeSoundIds, volumes } = get();
    // restore full target volume in case a fade-out was in progress
    activeSoundIds.forEach((id) => {
      const entry = players.get(id);
      if (entry) entry.player.volume = volumes[id] ?? DEFAULT_VOLUME;
    });
    set({ timerMinutes: null, timerEndsAt: null, remainingSeconds: null, isFadingOut: false });
  },
}));

/** Exposes the live AudioPlayer instance for a sound, if one is loaded, so UI
 * components can subscribe to it directly with `useAudioPlayerStatus` for
 * real-time progress. Returns undefined when nothing is loaded for this id. */
export function getPlayerFor(soundId: string): AudioPlayer | undefined {
  return players.get(soundId)?.player;
}

export function getActiveSoundNames(): string {
  const ids = useSoundPlayerStore.getState().activeSoundIds;
  return ids
    .map((id) => getSoundById(id)?.name)
    .filter(Boolean)
    .join(' + ');
}

// Keep this exported so a future "save current mix" action can reuse the id helper.
export function newMixId(): string {
  return generateId();
}

interface SoundSheetState {
  openSoundId: string | null;
  contextIds: string[];
  open: (soundId: string, contextIds?: string[]) => void;
  navigateTo: (soundId: string) => void;
  close: () => void;
}

/** Controls visibility of the full-screen SoundPlayerSheet. Kept separate
 * from playback state so the mini-player (mounted at the tab layout level)
 * can reopen the full player for the currently playing sound from any
 * screen in the app, not just from the Sounds module itself. */
export const useSoundSheetStore = create<SoundSheetState>((set) => ({
  openSoundId: null,
  contextIds: [],
  open: (soundId, contextIds = []) => set({ openSoundId: soundId, contextIds }),
  navigateTo: (soundId) => set({ openSoundId: soundId }),
  close: () => set({ openSoundId: null }),
}));
