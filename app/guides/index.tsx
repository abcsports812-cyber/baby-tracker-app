import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { AgeStageCard } from '../../src/components/guides/AgeStageCard';
import { GuideChip } from '../../src/components/guides/GuideChip';
import { ActivityCard } from '../../src/components/guides/ActivityCard';
import { GuideIllustration } from '../../src/components/guides/GuideIllustration';
import {
  GUIDE_CATEGORIES,
  getActivitiesForAgeGroup,
  getAgeGroupById,
  getGuidesByIds,
  resolveAgeGroupId,
} from '../../src/data/guides';
import { useBabyProfileStore, useRecentGuidesStore, useSavedGuidesStore } from '../../src/store';
import { calculateAge } from '../../src/lib/date';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';

export default function GuidesScreen() {
  const profile = useBabyProfileStore((s) => s.value);
  const savedIds = useSavedGuidesStore((s) => s.value);
  const recent = useRecentGuidesStore((s) => s.value);

  const age = useMemo(() => (profile ? calculateAge(profile.dateOfBirth) : null), [profile]);
  const ageGroupId = useMemo(() => (age ? resolveAgeGroupId(age) : null), [age]);
  const ageGroup = ageGroupId ? getAgeGroupById(ageGroupId) : null;

  const stageActivities = useMemo(() => (ageGroupId ? getActivitiesForAgeGroup(ageGroupId).slice(0, 4) : []), [ageGroupId]);
  const savedGuides = useMemo(() => getGuidesByIds(savedIds), [savedIds]);
  const recentGuides = useMemo(() => getGuidesByIds([...recent].reverse().map((r) => r.guideId)).slice(0, 8), [recent]);

  if (!profile) {
    return (
      <Screen>
        <ModuleHeader illustration="guides" title="Guides" subtitle="Helpful ideas for every stage of your baby's journey" />
        <EmptyState
          illustration="babyProfile"
          title="Add your baby's profile first"
          message="Guides are personalized to your baby's age — set up their profile to get started."
          ctaLabel="Set up profile"
          onPressCta={() => router.push('/profile/edit')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ModuleHeader illustration="guides" title="Guides" subtitle="Helpful ideas for every stage of your baby's journey" />

      {age && ageGroup && (
        <AgeStageCard
          babyName={profile.name}
          age={age}
          ageGroup={ageGroup}
          onPress={() => router.push('/guides/activities')}
        />
      )}

      {savedGuides.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Saved</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {savedGuides.map((g) => (
                <GuideChip key={g.id} guide={g} onPress={() => router.push(`/guides/${g.id}`)} />
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {recentGuides.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recently Viewed</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            <View style={styles.chipRow}>
              {recentGuides.map((g) => (
                <GuideChip key={g.id} guide={g} onPress={() => router.push(`/guides/${g.id}`)} />
              ))}
            </View>
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>Explore by category</Text>
      <View style={styles.categoryGrid}>
        {GUIDE_CATEGORIES.map((category) => {
          const colors = categoryColors[category.colorKey];
          return (
            <Pressable
              key={category.id}
              accessibilityLabel={category.label}
              style={({ pressed }) => [styles.categoryCard, { backgroundColor: colors.bg }, pressed && { opacity: 0.94 }]}
              onPress={() => router.push(`/guides/category/${category.id}`)}
            >
              <View style={[styles.categoryIconWrap, { backgroundColor: palette.white }]}>
                <GuideIllustration variant={category.id} size={24} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.text }]}>{category.label}</Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {ageGroup && stageActivities.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Activities for this stage</Text>
          </View>
          <View style={styles.activityGrid}>
            {stageActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                ageLabel={ageGroup.shortLabel}
                onPress={() => router.push(`/guides/activity/${activity.id}`)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionHeaderRow: {
    marginTop: spacing.sm,
  },
  chipScroll: {
    marginBottom: spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  categoryCard: {
    borderRadius: radius.lg,
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.lg,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: fontSize.md,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  categoryDescription: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
