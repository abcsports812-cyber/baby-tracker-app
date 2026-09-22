import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgeBreakdown } from '../../lib/date';
import type { AgeGroup } from '../../data/guides';
import { categoryColors, fontSize, palette, radius, spacing } from '../../theme';

interface Props {
  babyName: string;
  age: AgeBreakdown;
  ageGroup: AgeGroup;
  onPress: () => void;
}

export function AgeStageCard({ babyName, age, ageGroup, onPress }: Props) {
  const colors = categoryColors.growth;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.bg }, pressed && { opacity: 0.94 }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>Made for {babyName}</Text>
        <Text style={styles.title}>Your baby is {age.label}</Text>
        <Text style={styles.subtitle}>Explore activities and tips for this stage.</Text>
        <View style={[styles.chip, { backgroundColor: palette.white }]}>
          <Text style={[styles.chipLabel, { color: colors.text }]}>{ageGroup.label} stage</Text>
        </View>
      </View>
      <View style={[styles.iconWrap, { backgroundColor: palette.white }]}>
        <Ionicons name="chevron-forward" size={20} color={colors.accent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
    marginTop: 2,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  chipLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
});
