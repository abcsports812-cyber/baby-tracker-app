import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Guide } from '../../data/guides';
import { getGuideCategoryById } from '../../data/guides';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import { GuideIllustration } from './GuideIllustration';

interface Props {
  guide: Guide;
  onPress: () => void;
}

export function GuideChip({ guide, onPress }: Props) {
  const category = getGuideCategoryById(guide.category);
  const colors = categoryColors[category.colorKey];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, shadow.soft, pressed && { opacity: 0.9 }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <GuideIllustration variant={guide.icon} size={22} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {guide.title}
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
    width: 100,
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
