import type { Ionicons } from '@expo/vector-icons';

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

export interface Sound {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  assetKey: SoundAssetKey;
  /** Whether this sound can be combined with others in Mix Sounds. */
  mixable: boolean;
}

export const SOUNDS: Sound[] = [
  {
    id: 'white-noise',
    name: 'White Noise',
    description: 'Steady background sound for calm sleep',
    icon: 'radio-outline',
    assetKey: 'whiteNoise',
    mixable: true,
  },
  {
    id: 'gentle-rain',
    name: 'Gentle Rain',
    description: 'Soft rainfall for a peaceful atmosphere',
    icon: 'rainy-outline',
    assetKey: 'rain',
    mixable: true,
  },
  {
    id: 'womb',
    name: 'Womb',
    description: 'A gentle rhythmic sound inspired by the womb',
    icon: 'heart-circle-outline',
    assetKey: 'womb',
    mixable: true,
  },
  {
    id: 'lullaby',
    name: 'Lullaby',
    description: 'Soft melodies for quiet bedtime moments',
    icon: 'musical-notes-outline',
    assetKey: 'lullaby',
    mixable: false,
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    description: 'A gentle rhythmic soothing sound',
    icon: 'pulse-outline',
    assetKey: 'heartbeat',
    mixable: true,
  },
  {
    id: 'shushing',
    name: 'Gentle Shushing',
    description: 'A soft, rhythmic hush to settle little ones',
    icon: 'ear-outline',
    assetKey: 'shushing',
    mixable: true,
  },
  {
    id: 'fan',
    name: 'Fan',
    description: 'A steady breeze hum for restful naps',
    icon: 'sync-outline',
    assetKey: 'fan',
    mixable: true,
  },
  {
    id: 'hair-dryer',
    name: 'Hair Dryer',
    description: 'A familiar warm, steady drone',
    icon: 'aperture-outline',
    assetKey: 'fan',
    mixable: true,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Slow, rolling waves for deep relaxation',
    icon: 'water-outline',
    assetKey: 'ocean',
    mixable: true,
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Calm outdoor sounds for relaxation',
    icon: 'leaf-outline',
    assetKey: 'nature',
    mixable: true,
  },
  {
    id: 'gentle-ambient',
    name: 'Gentle Ambient',
    description: 'A soft, warm backdrop of quiet sound',
    icon: 'cloud-outline',
    assetKey: 'ambient',
    mixable: true,
  },
  {
    id: 'calm-sleep',
    name: 'Calm Sleep',
    description: 'A low, cozy hum to drift off to',
    icon: 'moon-outline',
    assetKey: 'softPad',
    mixable: true,
  },
];

export const FEATURED_SOUND_IDS = ['white-noise', 'gentle-rain', 'womb', 'lullaby', 'heartbeat', 'nature'];

export function getSoundById(id: string): Sound | undefined {
  return SOUNDS.find((s) => s.id === id);
}

export function getSoundSource(sound: Sound): ReturnType<typeof require> {
  return soundAssetSources[sound.assetKey];
}
