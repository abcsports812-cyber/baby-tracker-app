import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { GuideActivity } from '../../data/guides';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import { GuideIllustration } from './GuideIllustration';

interface Props {
  activity: GuideActivity;
  ageLabel: string;
  onPress: () => void;
}

export function ActivityCard({ activity, ageLabel, onPress }: Props) {
  const colors = categoryColors.activity;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, shadow.soft, pressed && { opacity: 0.94 }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <GuideIllustration variant={activity.icon} size={26} />
      </View>
      <Text style={styles.ageBadge}>{ageLabel}</Text>
      <Text style={styles.title} numberOfLines={2}>
        {activity.title}
      </Text>
      <Text style={styles.description} numberOfLines={3}>
        {activity.shortDescription}
      </Text>
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
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: categoryColors.activity.text,
    marginTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: palette.text,
    marginTop: 2,
  },
  description: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
