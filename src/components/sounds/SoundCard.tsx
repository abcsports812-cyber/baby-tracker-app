import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import type { Sound } from '../../data/sounds';
import { PlayingIndicator } from './PlayingIndicator';
import { SoundIllustration } from './SoundIllustration';

interface Props {
  sound: Sound;
  isActive: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onPress: () => void;
  onTogglePlay: () => void;
  onToggleFavorite: () => void;
}

export function SoundCard({ sound, isActive, isPlaying, isFavorite, onPress, onTogglePlay, onToggleFavorite }: Props) {
  const colors = categoryColors.sound;
  const showPlaying = isActive && isPlaying;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.soft, showPlaying && styles.cardActive, pressed && { opacity: 0.94 }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
          <SoundIllustration variant={sound.illustration} size={26} />
        </View>
        <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.heartBtn}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={18} color={isFavorite ? palette.primaryPink : palette.textFaint} />
        </Pressable>
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {sound.name}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {sound.description}
      </Text>

      <View style={styles.bottomRow}>
        {showPlaying ? (
          <PlayingIndicator color={colors.accent} />
        ) : (
          <Text style={styles.hint} numberOfLines={1}>
            {isActive ? 'Paused' : 'Tap to play'}
          </Text>
        )}
        <Pressable
          onPress={onTogglePlay}
          hitSlop={8}
          style={[styles.playBtn, { backgroundColor: showPlaying ? colors.accent : colors.bg }]}
        >
          <Ionicons name={showPlaying ? 'pause' : 'play'} size={16} color={showPlaying ? palette.white : colors.accent} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardActive: {
    borderColor: categoryColors.sound.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    padding: 2,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.md,
  },
  description: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 16,
    minHeight: 32,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  hint: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
    flex: 1,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
