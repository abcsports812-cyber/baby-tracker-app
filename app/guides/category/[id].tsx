import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { ModuleHeader } from '../../../src/components/ui/ModuleHeader';
import { ChipSelect } from '../../../src/components/ui/ChipSelect';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { GuideCard } from '../../../src/components/guides/GuideCard';
import {
  AGE_GROUPS,
  getGuideCategoryById,
  getGuidesForCategory,
  resolveAgeGroupId,
  type AgeGroupId,
  type GuideCategoryId,
} from '../../../src/data/guides';
import { useBabyProfileStore, useSavedGuidesStore } from '../../../src/store';
import { calculateAge } from '../../../src/lib/date';
import { spacing } from '../../../src/theme';

const AGE_FILTER_OPTIONS: { value: AgeGroupId | 'all'; label: string }[] = [
  { value: 'all', label: 'All ages' },
  ...AGE_GROUPS.map((g) => ({ value: g.id, label: g.shortLabel })),
];

export default function GuideCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: GuideCategoryId }>();
  const profile = useBabyProfileStore((s) => s.value);
  const savedIds = useSavedGuidesStore((s) => s.value);

  const category = getGuideCategoryById(id);
  const defaultAgeFilter = useMemo<AgeGroupId | 'all'>(() => {
    if (!profile) return 'all';
    return resolveAgeGroupId(calculateAge(profile.dateOfBirth));
  }, [profile]);

  const [ageFilter, setAgeFilter] = useState<AgeGroupId | 'all'>(defaultAgeFilter);

  const guides = useMemo(() => {
    const all = getGuidesForCategory(category.id);
    if (ageFilter === 'all') return all;
    return all.filter((g) => g.ageGroups.includes(ageFilter));
  }, [category.id, ageFilter]);

  return (
    <Screen>
      <ModuleHeader illustration="guides" title={category.label} subtitle={category.description} />

      <ChipSelect label="Filter by age" options={AGE_FILTER_OPTIONS} value={ageFilter} onChange={setAgeFilter} />

      {guides.length === 0 ? (
        <EmptyState
          illustration="guides"
          title="No guides yet for this stage"
          message="Check back soon, or try a different age range."
        />
      ) : (
        <View style={styles.list}>
          {guides.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              isSaved={savedIds.includes(guide.id)}
              onPress={() => router.push(`/guides/${guide.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    marginBottom: spacing.xl,
  },
});
