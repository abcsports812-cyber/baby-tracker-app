import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { getSoundById } from '../../data/sounds';
import { useSoundPlayerStore } from '../../store/soundPlayer';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import { PlayingIndicator } from './PlayingIndicator';

interface Props {
  onPress: () => void;
}

const TAB_ROOT_PATHS = new Set(['/', '/track', '/calendar', '/reports', '/more']);

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MiniPlayer({ onPress }: Props) {
  const activeSoundIds = useSoundPlayerStore((s) => s.activeSoundIds);
  const isPlaying = useSoundPlayerStore((s) => s.isPlaying);
  const remainingSeconds = useSoundPlayerStore((s) => s.remainingSeconds);
  const togglePlayPause = useSoundPlayerStore((s) => s.togglePlayPause);
  const stop = useSoundPlayerStore((s) => s.stop);
  const pathname = usePathname();

  // Hidden on the Sounds screens themselves — full playback controls are
  // already front and center there, so a floating bar would be redundant.
  if (pathname?.startsWith('/sounds')) return null;
  if (activeSoundIds.length === 0) return null;

  const bottomOffset = TAB_ROOT_PATHS.has(pathname ?? '/') ? 76 : 20;

  const primarySound = getSoundById(activeSoundIds[0]);
  if (!primarySound) return null;

  const title =
    activeSoundIds.length > 1
      ? `${primarySound.name} + ${activeSoundIds.length - 1} more`
      : primarySound.name;

  const colors = categoryColors.sound;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown}
      style={[styles.wrap, shadow.card, { bottom: bottomOffset }]}
    >
      <Pressable style={styles.content} onPress={onPress} accessibilityLabel={`Reopen ${title} player`}>
        <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
          <Ionicons name={primarySound.icon} size={18} color={colors.accent} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {isPlaying ? (
            <PlayingIndicator color={colors.accent} label={remainingSeconds != null ? `Timer ${formatClock(remainingSeconds)}` : 'Playing'} />
          ) : (
            <Text style={styles.subtitle}>Paused</Text>
          )}
        </View>
        <Pressable onPress={togglePlayPause} hitSlop={10} style={styles.controlBtn} accessibilityLabel={isPlaying ? 'Pause' : 'Play'}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={palette.text} />
        </Pressable>
        <Pressable onPress={stop} hitSlop={10} style={styles.controlBtn} accessibilityLabel="Stop">
          <Ionicons name="close" size={18} color={palette.textFaint} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    zIndex: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: 1,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
  },
});
