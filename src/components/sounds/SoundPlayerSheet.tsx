import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { getSoundById } from '../../data/sounds';
import { useFavoriteSoundsStore } from '../../store';
import { useSoundPlayerStore, type SleepTimerMinutes } from '../../store/soundPlayer';
import { categoryColors, fontSize, palette, radius, spacing } from '../../theme';
import { SleepTimerSheet } from './SleepTimerSheet';

interface Props {
  visible: boolean;
  soundId: string | null;
  contextIds?: string[];
  onNavigate: (id: string) => void;
  onClose: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function PulsingArtwork({ playing, color, icon }: { playing: boolean; color: string; icon: keyof typeof Ionicons.glyphMap }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (playing) {
      pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [playing, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }],
    opacity: 0.35 - pulse.value * 0.2,
  }));

  return (
    <View style={styles.artworkWrap}>
      <Animated.View style={[styles.ring, { backgroundColor: color }, ringStyle]} />
      <View style={[styles.artworkCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={68} color={palette.white} />
      </View>
    </View>
  );
}

/** Ambient sounds loop indefinitely, so a numeric time-based progress bar
 * would be misleading. This shows a gentle flowing bar while playing
 * instead — an honest "this is continuously looping" indicator. */
function LoopProgressBar({ playing, color }: { playing: boolean; color: string }) {
  const x = useSharedValue(-0.35);

  useEffect(() => {
    if (playing) {
      x.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    } else {
      x.value = -0.35;
    }
  }, [playing, x]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: `${x.value * 100}%` }],
    opacity: playing ? 1 : 0,
  }));

  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { backgroundColor: color }, style]} />
    </View>
  );
}

export function SoundPlayerSheet({ visible, soundId, contextIds, onNavigate, onClose }: Props) {
  const [timerSheetOpen, setTimerSheetOpen] = useState(false);
  const sound = soundId ? getSoundById(soundId) : undefined;
  const colors = categoryColors.sound;

  const activeSoundIds = useSoundPlayerStore((s) => s.activeSoundIds);
  const isPlaying = useSoundPlayerStore((s) => s.isPlaying);
  const volumes = useSoundPlayerStore((s) => s.volumes);
  const isMixMode = useSoundPlayerStore((s) => s.isMixMode);
  const timerMinutes = useSoundPlayerStore((s) => s.timerMinutes);
  const remainingSeconds = useSoundPlayerStore((s) => s.remainingSeconds);
  const isFadingOut = useSoundPlayerStore((s) => s.isFadingOut);
  const playSingle = useSoundPlayerStore((s) => s.playSingle);
  const togglePlayPause = useSoundPlayerStore((s) => s.togglePlayPause);
  const setVolume = useSoundPlayerStore((s) => s.setVolume);
  const setSleepTimer = useSoundPlayerStore((s) => s.setSleepTimer);
  const cancelSleepTimer = useSoundPlayerStore((s) => s.cancelSleepTimer);

  const favorites = useFavoriteSoundsStore((s) => s.value);
  const setFavorites = useFavoriteSoundsStore((s) => s.set);

  if (!sound) return null;

  const isThisActive = activeSoundIds.includes(sound.id);
  const isThisPlaying = isThisActive && isPlaying;
  const volume = volumes[sound.id] ?? 0.85;
  const isFavorite = favorites.includes(sound.id);

  const handlePlayPause = () => {
    if (isThisActive) {
      togglePlayPause();
    } else {
      playSingle(sound.id);
    }
  };

  const handleToggleFavorite = () => {
    setFavorites(isFavorite ? favorites.filter((id) => id !== sound.id) : [...favorites, sound.id]);
  };

  const navigate = (direction: 1 | -1) => {
    if (!contextIds || contextIds.length < 2) return;
    const idx = contextIds.indexOf(sound.id);
    const nextIdx = (idx + direction + contextIds.length) % contextIds.length;
    const nextId = contextIds[nextIdx];
    onNavigate(nextId);
    playSingle(nextId);
  };

  const hasContext = !!contextIds && contextIds.length > 1;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Minimize player">
            <Ionicons name="chevron-down" size={22} color={palette.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>{isMixMode ? 'Now mixing' : 'Now playing'}</Text>
          <Pressable onPress={handleToggleFavorite} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Favorite">
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? palette.primaryPink : palette.text} />
          </Pressable>
        </View>

        <PulsingArtwork playing={isThisPlaying} color={colors.accent} icon={sound.icon} />

        <Text style={styles.title}>{sound.name}</Text>
        <Text style={styles.description}>{sound.description}</Text>

        {isMixMode && <Text style={styles.mixNote}>Mixed with {activeSoundIds.length - 1} other sound{activeSoundIds.length - 1 === 1 ? '' : 's'}</Text>}

        <View style={styles.progressRow}>
          <LoopProgressBar playing={isThisPlaying} color={colors.accent} />
        </View>

        <View style={styles.transportRow}>
          <Pressable
            onPress={() => navigate(-1)}
            disabled={!hasContext}
            hitSlop={10}
            style={[styles.transportBtn, !hasContext && styles.transportBtnDisabled]}
            accessibilityLabel="Previous sound"
          >
            <Ionicons name="play-skip-back" size={22} color={hasContext ? palette.text : palette.textFaint} />
          </Pressable>

          <Pressable
            onPress={handlePlayPause}
            style={[styles.playBtn, { backgroundColor: colors.accent }]}
            accessibilityLabel={isThisPlaying ? 'Pause' : 'Play'}
          >
            <Ionicons name={isThisPlaying ? 'pause' : 'play'} size={34} color={palette.white} />
          </Pressable>

          <Pressable
            onPress={() => navigate(1)}
            disabled={!hasContext}
            hitSlop={10}
            style={[styles.transportBtn, !hasContext && styles.transportBtnDisabled]}
            accessibilityLabel="Next sound"
          >
            <Ionicons name="play-skip-forward" size={22} color={hasContext ? palette.text : palette.textFaint} />
          </Pressable>
        </View>

        <View style={styles.volumeRow}>
          <Ionicons name="volume-low-outline" size={18} color={palette.textSecondary} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={(v: number) => setVolume(sound.id, v)}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={palette.border}
            thumbTintColor={colors.accent}
            accessibilityLabel="Volume"
          />
          <Ionicons name="volume-high-outline" size={18} color={palette.textSecondary} />
        </View>

        <Pressable style={styles.timerRow} onPress={() => setTimerSheetOpen(true)} accessibilityLabel="Sleep timer">
          <View style={[styles.timerIconWrap, { backgroundColor: colors.bg }]}>
            <Ionicons name="moon-outline" size={18} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.timerLabel}>Sleep Timer</Text>
            <Text style={styles.timerValue}>
              {timerMinutes !== null && remainingSeconds != null
                ? `${isFadingOut ? 'Fading out · ' : ''}${formatClock(remainingSeconds)} remaining`
                : 'Off'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={palette.textFaint} />
        </Pressable>
      </View>

      <SleepTimerSheet
        visible={timerSheetOpen}
        activeMinutes={timerMinutes}
        hasActiveTimer={remainingSeconds != null}
        onSelect={(minutes: SleepTimerMinutes) => {
          setSleepTimer(minutes);
          setTimerSheetOpen(false);
        }}
        onCancelTimer={() => {
          cancelSleepTimer();
          setTimerSheetOpen(false);
        }}
        onClose={() => setTimerSheetOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.cream,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  topBarTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkWrap: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    width: 220,
    height: 220,
  },
  ring: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  artworkCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  mixNote: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: categoryColors.sound.accent,
    marginTop: spacing.sm,
  },
  progressRow: {
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    width: '35%',
    height: '100%',
    borderRadius: 2,
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxl,
    marginTop: spacing.xl,
  },
  transportBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportBtnDisabled: {
    opacity: 0.4,
  },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    marginTop: spacing.xxl,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  timerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  timerValue: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
});
