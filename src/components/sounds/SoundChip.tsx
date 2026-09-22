import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Sound } from '../../data/sounds';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import { SoundIllustration } from './SoundIllustration';

interface Props {
  sound: Sound;
  isActive: boolean;
  isPlaying: boolean;
  onPress: () => void;
}

export function SoundChip({ sound, isActive, isPlaying, onPress }: Props) {
  const colors = categoryColors.sound;
  const showPlaying = isActive && isPlaying;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, shadow.soft, pressed && { opacity: 0.9 }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        {showPlaying ? (
          <Ionicons name="pause" size={18} color={colors.accent} />
        ) : (
          <SoundIllustration variant={sound.illustration} size={22} />
        )}
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {sound.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    width: 84,
    gap: spacing.xs,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
});
