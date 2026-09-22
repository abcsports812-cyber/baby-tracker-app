import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { GuideIllustration } from '../../../src/components/guides/GuideIllustration';
import { getAgeGroupById, getGuideActivityById } from '../../../src/data/guides';
import { categoryColors, fontSize, palette, radius, spacing } from '../../../src/theme';

export default function GuideActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activity = getGuideActivityById(id);

  if (!activity) {
    return (
      <Screen>
        <Text style={styles.notFound}>This activity could not be found.</Text>
      </Screen>
    );
  }

  const colors = categoryColors.activity;
  const ageLabels = activity.ageGroups.map((agId) => getAgeGroupById(agId).label).join(', ');

  return (
    <Screen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </Pressable>
        </View>

        <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
          <GuideIllustration variant={activity.icon} size={40} />
        </View>

        <View style={[styles.ageBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.ageBadgeLabel, { color: colors.text }]}>{ageLabels}</Text>
        </View>

        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.description}>{activity.shortDescription}</Text>

        <Section title="What you need">
          <BulletList items={activity.whatYouNeed} accent={colors.accent} />
        </Section>

        <Section title="How to do it">
          <NumberedList items={activity.howToDoIt} accent={colors.accent} />
        </Section>

        <Section title="Development areas supported">
          <View style={styles.tagRow}>
            {activity.developmentAreas.map((area) => (
              <View key={area} style={[styles.tag, { backgroundColor: colors.bg }]}>
                <Text style={[styles.tagLabel, { color: colors.text }]}>{area}</Text>
              </View>
            ))}
          </View>
        </Section>

        {activity.safetyNote && (
          <View style={styles.safetyBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.danger} />
            <Text style={styles.safetyText}>{activity.safetyNote}</Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: accent }]} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function NumberedList({ items, accent }: { items: string[]; accent: string }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.numberDot, { backgroundColor: accent }]}>
            <Text style={styles.numberDotLabel}>{i + 1}</Text>
          </View>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  topBar: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  ageBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  ageBadgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    lineHeight: 21,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  numberDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberDotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: palette.white,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.md,
    color: palette.text,
    lineHeight: 21,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  tagLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FDECEC',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  safetyText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: '#8A3A46',
    lineHeight: 19,
  },
  notFound: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    padding: spacing.xl,
  },
});
