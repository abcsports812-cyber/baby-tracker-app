import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useRecentSearchesStore } from '../../src/store';
import { SEARCH_GROUP_LABEL, useSearchResults, type SearchGroup, type SearchResult } from '../../src/lib/search';
import { formatDate } from '../../src/lib/date';
import { fontSize, palette, radius, spacing } from '../../src/theme';

const RECENT_LIMIT = 8;

const FILTER_OPTIONS: { value: SearchGroup | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'journal', label: 'Journal' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'health', label: 'Health' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'reminders', label: 'Reminders' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'family', label: 'Family' },
  { value: 'guides', label: 'Guides' },
];

const GROUP_ORDER: SearchGroup[] = ['journal', 'tracking', 'health', 'appointments', 'reminders', 'milestones', 'family', 'guides'];

function ResultRow({ result, onPress }: { result: SearchResult; onPress: () => void }) {
  return (
    <RecordRow
      category={result.category}
      icon={result.icon}
      title={result.title}
      subtitle={result.subtitle}
      time={result.date ? formatDate(result.date) : undefined}
      onPress={onPress}
    />
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<SearchGroup | 'all'>('all');
  const recent = useRecentSearchesStore((s) => s.value);
  const setRecent = useRecentSearchesStore((s) => s.set);

  const grouped = useSearchResults(query, group);
  const totalResults = useMemo(() => Object.values(grouped).reduce((sum, list) => sum + list.length, 0), [grouped]);
  const hasQuery = query.trim().length > 0;

  const commitRecent = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const withoutDup = recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase());
    setRecent([trimmed, ...withoutDup].slice(0, RECENT_LIMIT));
  };

  const openResult = (result: SearchResult) => {
    commitRecent(query);
    router.push(result.route as never);
  };

  const runRecent = (value: string) => {
    setQuery(value);
    commitRecent(value);
  };

  const removeRecent = (value: string) => {
    setRecent(recent.filter((r) => r !== value));
  };

  return (
    <Screen scroll={false} edges={['top']}>
      <View style={styles.topSection}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </Pressable>
          <Text style={styles.title}>Search</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={palette.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => commitRecent(query)}
            placeholder="Search everything you've recorded"
            placeholderTextColor={palette.textFaint}
            style={styles.searchInput}
            accessibilityLabel="Search"
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={palette.textFaint} />
            </Pressable>
          )}
        </View>

        <ChipSelect value={group} onChange={setGroup} options={FILTER_OPTIONS} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {!hasQuery ? (
          recent.length > 0 ? (
            <View style={{ marginBottom: spacing.lg }}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <Pressable onPress={() => setRecent([])} hitSlop={8}>
                  <Text style={styles.clearAllLabel}>Clear all</Text>
                </Pressable>
              </View>
              <View style={styles.recentRow}>
                {recent.map((q) => (
                  <View key={q} style={styles.recentChip}>
                    <Pressable onPress={() => runRecent(q)} style={styles.recentChipTouchable}>
                      <Ionicons name="time-outline" size={13} color={palette.textSecondary} />
                      <Text style={styles.recentChipLabel} numberOfLines={1}>
                        {q}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removeRecent(q)} hitSlop={8} accessibilityLabel={`Remove recent search: ${q}`}>
                      <Ionicons name="close" size={13} color={palette.textFaint} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.prompt}>
              <Ionicons name="search-outline" size={28} color={palette.textFaint} />
              <Text style={styles.promptText}>Search everything you&rsquo;ve recorded</Text>
            </View>
          )
        ) : totalResults === 0 ? (
          <EmptyState
            illustration="notes"
            title={`No results for "${query.trim()}"`}
            message="Try a different word, or check another category."
            ctaLabel="Clear search"
            onPressCta={() => setQuery('')}
          />
        ) : (
          GROUP_ORDER.map((g) => {
            const items = grouped[g];
            if (items.length === 0) return null;
            return (
              <View key={g} style={{ marginBottom: spacing.lg }}>
                <Text style={styles.sectionTitle}>{SEARCH_GROUP_LABEL[g]}</Text>
                <Card padded={false}>
                  {items.map((r, i) => (
                    <View key={r.id} style={i < items.length - 1 ? styles.rowBorder : undefined}>
                      <ResultRow result={r} onPress={() => openResult(r)} />
                    </View>
                  ))}
                </Card>
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: palette.text,
  },
  body: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
  prompt: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  promptText: {
    fontSize: fontSize.md,
    color: palette.textFaint,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  clearAllLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.primaryPinkDark,
  },
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: '100%',
  },
  recentChipTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
  },
  recentChipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.text,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
});
