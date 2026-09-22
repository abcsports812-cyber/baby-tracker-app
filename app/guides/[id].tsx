import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { GuideIllustration } from '../../src/components/guides/GuideIllustration';
import { GuideChip } from '../../src/components/guides/GuideChip';
import { ActivityCard } from '../../src/components/guides/ActivityCard';
import { showToast } from '../../src/components/ui/Toast';
import {
  getActivitiesByIds,
  getAgeGroupById,
  getGuideById,
  getGuideCategoryById,
  getGuidesByIds,
  resolveAgeGroupId,
} from '../../src/data/guides';
import { useBabyProfileStore, useRecentGuidesStore, useSavedGuidesStore } from '../../src/store';
import { calculateAge } from '../../src/lib/date';
import { nowIso } from '../../src/lib/id';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';

const RECENT_LIMIT = 12;

export default function GuideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = getGuideById(id);

  const profile = useBabyProfileStore((s) => s.value);
  const savedIds = useSavedGuidesStore((s) => s.value);
  const setSaved = useSavedGuidesStore((s) => s.set);
  const recordRecent = useRecentGuidesStore((s) => s.set);
  const recent = useRecentGuidesStore((s) => s.value);

  useEffect(() => {
    if (!guide) return;
    const withoutThis = recent.filter((r) => r.guideId !== guide.id);
    recordRecent([...withoutThis, { guideId: guide.id, viewedAt: nowIso() }].slice(-RECENT_LIMIT));
    // Only record a view once per guide visit — intentionally omits `recent`/`recordRecent`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide?.id]);

  if (!guide) {
    return (
      <Screen>
        <Text style={styles.notFound}>This guide could not be found.</Text>
      </Screen>
    );
  }

  const category = getGuideCategoryById(guide.category);
  const colors = categoryColors[category.colorKey];
  const isSaved = savedIds.includes(guide.id);
  const relatedGuides = getGuidesByIds(guide.relatedGuideIds ?? []);
  const relatedActivities = getActivitiesByIds(guide.relatedActivityIds ?? []);
  const currentAgeGroupId = profile ? resolveAgeGroupId(calculateAge(profile.dateOfBirth)) : null;

  const toggleSaved = () => {
    setSaved(isSaved ? savedIds.filter((sid) => sid !== guide.id) : [...savedIds, guide.id]);
    showToast(isSaved ? 'Removed from saved' : 'Saved', isSaved ? 'heart-outline' : 'heart');
  };

  return (
    <Screen scroll={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </Pressable>
          <Pressable onPress={toggleSaved} hitSlop={10} style={styles.iconBtn} accessibilityLabel="Save guide">
            <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? palette.primaryPink : palette.text} />
          </Pressable>
        </View>

        <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
          <GuideIllustration variant={guide.icon} size={40} />
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeLabel, { color: colors.text }]}>{category.label}</Text>
          </View>
          {guide.ageGroups.map((agId) => (
            <View key={agId} style={styles.ageBadge}>
              <Text style={styles.ageBadgeLabel}>{getAgeGroupById(agId).label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>{guide.title}</Text>
        <Text style={styles.intro}>{guide.intro}</Text>

        <Section title="Why it matters">
          <Text style={styles.paragraph}>{guide.whyItMatters}</Text>
        </Section>

        <Section title="What to do">
          <BulletList items={guide.whatToDo} colors={colors} />
        </Section>

        {guide.tips && guide.tips.length > 0 && (
          <Section title="Tips">
            <BulletList items={guide.tips} colors={colors} />
          </Section>
        )}

        {guide.safetyNote && (
          <View style={styles.safetyBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={palette.danger} />
            <Text style={styles.safetyText}>{guide.safetyNote}</Text>
          </View>
        )}

        {relatedActivities.length > 0 && (
          <Section title="Related activities">
            <View style={styles.activityGrid}>
              {relatedActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  ageLabel={currentAgeGroupId ? getAgeGroupById(currentAgeGroupId).shortLabel : activity.ageGroups[0]}
                  onPress={() => router.push(`/guides/activity/${activity.id}`)}
                />
              ))}
            </View>
          </Section>
        )}

        {relatedGuides.length > 0 && (
          <Section title="Related guides">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {relatedGuides.map((g) => (
                  <GuideChip key={g.id} guide={g} onPress={() => router.push(`/guides/${g.id}`)} />
                ))}
              </View>
            </ScrollView>
          </Section>
        )}

        {guide.medicalDisclaimer && (
          <Text style={styles.disclaimer}>
            This guide offers general information, not medical advice or a diagnosis. Every baby develops differently — talk
            with your pediatrician or a qualified healthcare professional about your baby&apos;s individual needs.
          </Text>
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

function BulletList({ items, colors }: { items: string[]; colors: { accent: string } }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
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
    justifyContent: 'space-between',
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
  },
  badgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  ageBadge: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ageBadgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  intro: {
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
  paragraph: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    lineHeight: 21,
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
  bulletText: {
    flex: 1,
    fontSize: fontSize.md,
    color: palette.text,
    lineHeight: 21,
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
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  disclaimer: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    lineHeight: 17,
    marginTop: spacing.xxl,
    fontStyle: 'italic',
  },
  notFound: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    padding: spacing.xl,
  },
});
