import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { ModuleHeader } from '../../../src/components/ui/ModuleHeader';
import { ChipSelect } from '../../../src/components/ui/ChipSelect';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ActivityCard } from '../../../src/components/guides/ActivityCard';
import { AGE_GROUPS, getActivitiesForAgeGroup, getAgeGroupById, resolveAgeGroupId, type AgeGroupId } from '../../../src/data/guides';
import { useBabyProfileStore } from '../../../src/store';
import { calculateAge } from '../../../src/lib/date';
import { spacing } from '../../../src/theme';

export default function GuideActivitiesScreen() {
  const profile = useBabyProfileStore((s) => s.value);

  const defaultAgeGroup = useMemo<AgeGroupId>(() => {
    if (!profile) return AGE_GROUPS[0].id;
    return resolveAgeGroupId(calculateAge(profile.dateOfBirth));
  }, [profile]);

  const [ageGroupId, setAgeGroupId] = useState<AgeGroupId>(defaultAgeGroup);

  const activities = useMemo(() => getActivitiesForAgeGroup(ageGroupId), [ageGroupId]);
  const ageGroup = getAgeGroupById(ageGroupId);

  return (
    <Screen>
      <ModuleHeader illustration="guides" title="Activities" subtitle="Age-appropriate ways to play, explore, and connect" />

      <ChipSelect
        label="Age range"
        options={AGE_GROUPS.map((g) => ({ value: g.id, label: g.shortLabel }))}
        value={ageGroupId}
        onChange={setAgeGroupId}
      />

      {activities.length === 0 ? (
        <EmptyState
          illustration="guides"
          title="No activities yet for this stage"
          message="Check back soon as we grow the activity library."
        />
      ) : (
        <View style={styles.grid}>
          {activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              ageLabel={ageGroup.shortLabel}
              onPress={() => router.push(`/guides/activity/${activity.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
});
