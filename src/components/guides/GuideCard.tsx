import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Guide } from '../../data/guides';
import { getGuideCategoryById } from '../../data/guides';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import { GuideIllustration } from './GuideIllustration';

interface Props {
  guide: Guide;
  ageLabel?: string;
  isSaved?: boolean;
  onPress: () => void;
}

export function GuideCard({ guide, ageLabel, isSaved, onPress }: Props) {
  const category = getGuideCategoryById(guide.category);
  const colors = categoryColors[category.colorKey];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow.soft, pressed && { opacity: 0.94 }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <GuideIllustration variant={guide.icon} size={26} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.badgeRow}>
          <Text style={[styles.categoryLabel, { color: colors.text }]}>{category.label}</Text>
          {ageLabel && <Text style={styles.ageLabel}>· {ageLabel}</Text>}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {guide.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {guide.summary}
        </Text>
      </View>
      {isSaved && <Ionicons name="heart" size={16} color={palette.primaryPink} style={styles.savedIcon} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ageLabel: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: palette.text,
    marginTop: 3,
  },
  summary: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  savedIcon: {
    marginTop: 2,
  },
});
