import type { SoundIllustrationKey } from '../components/sounds/SoundIllustration';

export type SoundAssetKey =
  | 'whiteNoise'
  | 'rain'
  | 'fan'
  | 'heartbeat'
  | 'womb'
  | 'shushing'
  | 'ocean'
  | 'ambient'
  | 'lullaby'
  | 'nature'
  | 'softPad';

// Original, procedurally synthesized ambient loops — see
// scripts referenced in project history. None of this audio is sourced,
// sampled, recorded, or copied from any existing app, artist, or
// recording; every file is generated from basic waveforms (noise,
// filters, envelopes, oscillators). Safe to ship, and structured so real
// licensed recordings can simply replace these files later without any
// other code changes.
export const soundAssetSources: Record<SoundAssetKey, ReturnType<typeof require>> = {
  whiteNoise: require('../../assets/sounds/white-noise.wav'),
  rain: require('../../assets/sounds/rain.wav'),
  fan: require('../../assets/sounds/fan.wav'),
  heartbeat: require('../../assets/sounds/heartbeat.wav'),
  womb: require('../../assets/sounds/womb.wav'),
  shushing: require('../../assets/sounds/shushing.wav'),
  ocean: require('../../assets/sounds/ocean.wav'),
  ambient: require('../../assets/sounds/ambient.wav'),
  lullaby: require('../../assets/sounds/lullaby.wav'),
  nature: require('../../assets/sounds/nature.wav'),
  softPad: require('../../assets/sounds/soft-pad.wav'),
};

export type SoundCategory = 'babyMusic' | 'sleepSounds';

export interface Sound {
  id: string;
  name: string;
  description: string;
  illustration: SoundIllustrationKey;
  assetKey: SoundAssetKey;
  /** Whether this sound can be combined with others in Mix Sounds. */
  mixable: boolean;
  /** Groups the sound under "Baby Music" or "Sleep Sounds" on the Sounds
   * screen. Reflects what each sound actually is today (e.g. the one
   * melodic track is babyMusic, everything else is an ambient/soothing
   * sleepSounds texture) — it does not imply any sound is a real licensed
   * recording. */
  category: SoundCategory;
}

export const SOUNDS: Sound[] = [
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Steady background sound for calm sleep',
    illustration: 'whiteNoise',
    assetKey: 'whiteNoise',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'gentle-rain',
    name: 'Gentle Rain',
    description: 'Soft rainfall for a peaceful atmosphere',
    illustration: 'rain',
    assetKey: 'rain',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'womb',
    name: 'Womb',
    description: 'A gentle rhythmic sound inspired by the womb',
    illustration: 'womb',
    assetKey: 'womb',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'lullaby',
    name: 'Lullaby',
    description: 'Soft melodies for quiet bedtime moments',
    illustration: 'lullaby',
    assetKey: 'lullaby',
    mixable: false,
    category: 'babyMusic',
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    description: 'A gentle rhythmic soothing sound',
    illustration: 'heartbeat',
    assetKey: 'heartbeat',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'shushing',
    name: 'Gentle Shushing',
    description: 'A soft, rhythmic hush to settle little ones',
    illustration: 'shushing',
    assetKey: 'shushing',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'fan',
    name: 'Fan',
    description: 'A steady breeze hum for restful naps',
    illustration: 'fan',
    assetKey: 'fan',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'hair-dryer',
    name: 'Hair Dryer',
    description: 'A familiar warm, steady drone',
    illustration: 'hairDryer',
    assetKey: 'fan',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Slow, rolling waves for deep relaxation',
    illustration: 'ocean',
    assetKey: 'ocean',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Calm outdoor sounds for relaxation',
    illustration: 'nature',
    assetKey: 'nature',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'gentle-ambient',
    name: 'Gentle Ambient',
    description: 'A soft, warm backdrop of quiet sound',
    illustration: 'ambient',
    assetKey: 'ambient',
    mixable: true,
    category: 'sleepSounds',
  },
  {
    id: 'calm-sleep',
    name: 'Calm Sleep',
    description: 'A low, cozy hum to drift off to',
    illustration: 'calmSleep',
    assetKey: 'softPad',
    mixable: true,
    category: 'sleepSounds',
  },
];

export const FEATURED_SOUND_IDS = ['white-noise', 'gentle-rain', 'womb', 'lullaby', 'heartbeat', 'nature'];

export function getSoundById(id: string): Sound | undefined {
  return SOUNDS.find((s) => s.id === id);
}

export function getSoundSource(sound: Sound): ReturnType<typeof require> {
  return soundAssetSources[sound.assetKey];
}
