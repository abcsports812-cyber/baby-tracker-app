import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useMemoryStore, useNoteStore } from '../../src/store';
import { daysBetween, formatDate, isSameDay } from '../../src/lib/date';
import { journalCategoryLabel } from '../../src/lib/labels';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { JournalCategory, JournalNote, Memory } from '../../src/types/models';

type JournalItem = ({ kind: 'note' } & JournalNote) | ({ kind: 'memory' } & Memory);

function itemPreview(item: JournalItem): string | undefined {
  return item.kind === 'note' ? item.body : item.caption;
}

function itemCategory(item: JournalItem): JournalCategory | undefined {
  if (item.kind === 'memory') return item.category;
  // A legacy-only NoteCategory value (pre-dating this Journal system) has no
  // JournalCategory equivalent — treat it as uncategorized in this merged view.
  return (item.category in journalCategoryLabel ? item.category : undefined) as JournalCategory | undefined;
}

function JournalRow({ item, onPress }: { item: JournalItem; onPress: () => void }) {
  const colors = categoryColors[item.kind === 'note' ? 'note' : 'memory'];
  const preview = itemPreview(item);
  const category = itemCategory(item);
  const photoUri = item.kind === 'memory' ? item.photoUri : undefined;

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.rowThumb} contentFit="cover" />
      ) : (
        <View style={[styles.rowIconWrap, { backgroundColor: colors.bg }]}>
          <Ionicons name={item.kind === 'note' ? 'document-text' : 'images'} size={18} color={colors.accent} />
        </View>
      )}
      <View style={styles.rowMiddle}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.favorite && <Ionicons name="heart" size={13} color={palette.primaryPink} />}
        </View>
        {preview ? (
          <Text style={styles.rowPreview} numberOfLines={1}>
            {preview}
          </Text>
        ) : null}
        <View style={styles.rowMetaLine}>
          {category && <Text style={[styles.rowCategory, { color: colors.text }]}>{journalCategoryLabel[category]}</Text>}
          <Text style={styles.rowDate}>{formatDate(item.date)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function GroupSection({ title, items, onPressItem }: { title: string; items: JournalItem[]; onPressItem: (item: JournalItem) => void }) {
  if (items.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.groupTitle}>{title}</Text>
      <Card padded={false}>
        {items.map((item, i) => (
          <View key={`${item.kind}-${item.id}`} style={i < items.length - 1 ? styles.rowBorder : undefined}>
            <JournalRow item={item} onPress={() => onPressItem(item)} />
          </View>
        ))}
      </Card>
    </View>
  );
}

export default function JournalScreen() {
  const notes = useNoteStore((s) => s.items);
  const memories = useMemoryStore((s) => s.items);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<JournalCategory | 'all'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const merged: JournalItem[] = useMemo(
    () => [...notes.map((n) => ({ kind: 'note' as const, ...n })), ...memories.map((m) => ({ kind: 'memory' as const, ...m }))],
    [notes, memories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return merged.filter((item) => {
      if (favoritesOnly && !item.favorite) return false;
      if (categoryFilter !== 'all' && itemCategory(item) !== categoryFilter) return false;
      if (q) {
        const haystack = `${item.title} ${itemPreview(item) ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [merged, search, categoryFilter, favoritesOnly]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)), [filtered]);

  const today = new Date();
  const groups = useMemo(() => {
    const g = { today: [] as JournalItem[], thisWeek: [] as JournalItem[], earlier: [] as JournalItem[] };
    for (const item of sorted) {
      if (isSameDay(item.date, today)) g.today.push(item);
      else if (daysBetween(item.date, today) < 7) g.thisWeek.push(item);
      else g.earlier.push(item);
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted]);

  const openItem = (item: JournalItem) => {
    router.push(item.kind === 'note' ? `/journal/note/${item.id}` : `/journal/memory/${item.id}`);
  };

  const hasAnyData = notes.length > 0 || memories.length > 0;

  return (
    <Screen>
      <ModuleHeader illustration="memories" title="Journal" subtitle="Your baby's story, all in one place" />

      <View style={styles.addRow}>
        <Button label="Write Entry" icon="create-outline" onPress={() => router.push('/notes?add=1')} style={{ flex: 1 }} />
        <Button label="Add Memory" icon="camera-outline" variant="secondary" onPress={() => router.push('/memories?add=1')} style={{ flex: 1 }} />
      </View>

      {hasAnyData && (
        <>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={16} color={palette.textFaint} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your journal"
              placeholderTextColor={palette.textFaint}
              style={styles.searchInput}
              accessibilityLabel="Search journal"
            />
          </View>

          <View style={styles.chipScroll}>
            <View style={styles.chipRow}>
              <Pressable
                onPress={() => setCategoryFilter('all')}
                style={[styles.chip, categoryFilter === 'all' && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, categoryFilter === 'all' && styles.chipLabelActive]}>All</Text>
              </Pressable>
              {(Object.keys(journalCategoryLabel) as JournalCategory[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategoryFilter(c)}
                  style={[styles.chip, categoryFilter === c && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, categoryFilter === c && styles.chipLabelActive]}>{journalCategoryLabel[c]}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => setFavoritesOnly((v) => !v)}
                style={[styles.chip, favoritesOnly && styles.chipActive]}
                accessibilityLabel="Show favorites only"
              >
                <Ionicons name={favoritesOnly ? 'heart' : 'heart-outline'} size={13} color={favoritesOnly ? palette.white : palette.textSecondary} />
                <Text style={[styles.chipLabel, favoritesOnly && styles.chipLabelActive, { marginLeft: 4 }]}>Favorites</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {!hasAnyData ? (
        <EmptyState
          illustration="memories"
          title="Your journal starts here"
          message="Write your first entry or save a memory to begin your baby's story."
          ctaLabel="Write Entry"
          onPressCta={() => router.push('/notes?add=1')}
        />
      ) : sorted.length === 0 ? (
        <Card>
          <Text style={styles.noResults}>No entries match your search or filters.</Text>
        </Card>
      ) : (
        <>
          <GroupSection title="Today" items={groups.today} onPressItem={openItem} />
          <GroupSection title="This Week" items={groups.thisWeek} onPressItem={openItem} />
          <GroupSection title="Earlier" items={groups.earlier} onPressItem={openItem} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.sm,
    color: palette.text,
  },
  chipScroll: {
    marginBottom: spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.primaryPink,
    borderColor: palette.primaryPink,
  },
  chipLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  chipLabelActive: {
    color: palette.white,
  },
  noResults: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  groupTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
  },
  rowMiddle: {
    flex: 1,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
    flexShrink: 1,
  },
  rowPreview: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
  rowMetaLine: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  rowCategory: {
    fontSize: 11,
    fontWeight: '700',
  },
  rowDate: {
    fontSize: 11,
    color: palette.textFaint,
    fontWeight: '600',
  },
});
