import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useMilestoneStore, useNoteStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { stampActiveBaby, useBabyScoped } from '../../src/lib/babyScope';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate } from '../../src/lib/date';
import { journalCategoryLabel, noteCategoryLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, radius, shadow, spacing } from '../../src/theme';
import type { JournalCategory, JournalNote } from '../../src/types/models';

const NO_MILESTONE = 'none';

export default function NotesScreen() {
  const rawItems = useNoteStore((s) => s.items);
  const items = useBabyScoped(rawItems);
  const add = useNoteStore((s) => s.add);
  const update = useNoteStore((s) => s.update);
  const remove = useNoteStore((s) => s.remove);
  // Related-milestone picker: scoped so a note can only ever link to the
  // active baby's own milestones, never another baby's (Milestones' own
  // screen/seeding is untouched here — Phase 3D).
  const rawMilestones = useMilestoneStore((s) => s.items);
  const milestones = useBabyScoped(rawMilestones);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState<JournalCategory>('everyday');
  const [favorite, setFavorite] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [relatedMilestoneId, setRelatedMilestoneId] = useState(NO_MILESTONE);

  const sorted = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date)), [items]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setDate(new Date());
    setCategory('everyday');
    setFavorite(false);
    setPhotoUri(undefined);
    setRelatedMilestoneId(NO_MILESTONE);
    setSheetOpen(true);
  };

  const openEdit = (n: JournalNote) => {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setDate(new Date(n.date));
    // Legacy notes may carry a pre-Journal category value not offered as a
    // chip anymore — fall back to 'everyday' in the form without altering
    // the stored value unless the user actually changes it and saves.
    setCategory((n.category in journalCategoryLabel ? n.category : 'everyday') as JournalCategory);
    setFavorite(n.favorite ?? false);
    setPhotoUri(n.photoUri);
    setRelatedMilestoneId(n.relatedMilestoneId ?? NO_MILESTONE);
    setSheetOpen(true);
  };

  const toggleFavorite = (n: JournalNote) => {
    update(n.id, { favorite: !n.favorite, updatedAt: nowIso() });
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      title: title.trim() || 'Untitled note',
      body: body.trim(),
      date: date.toISOString().slice(0, 10),
      category,
      favorite,
      photoUri,
      relatedMilestoneId: relatedMilestoneId === NO_MILESTONE ? undefined : relatedMilestoneId,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Note updated', 'checkmark-circle');
    } else {
      add(stampActiveBaby({ id: generateId(), ...payload, createdAt: now, updatedAt: now }));
      showToast('Note saved', 'document-text');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="notes" title="Notes & Journal" subtitle="A private space for your thoughts" />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>{items.length} note{items.length === 1 ? '' : 's'}</Text>
        <Button label="New note" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="notes" title="No notes yet" message="Jot down thoughts, questions or sweet moments." ctaLabel="Write a note" onPressCta={openAdd} />
      ) : (
        sorted.map((n) => (
          <Pressable key={n.id} onPress={() => openEdit(n)} style={[styles.noteCard, shadow.soft]}>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {n.title}
              </Text>
              <View style={styles.noteHeaderActions}>
                <Pressable onPress={() => toggleFavorite(n)} hitSlop={10} accessibilityLabel={n.favorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <Ionicons name={n.favorite ? 'heart' : 'heart-outline'} size={16} color={n.favorite ? palette.primaryPink : palette.textFaint} />
                </Pressable>
                <Pressable onPress={() => setDeleteId(n.id)} hitSlop={10} accessibilityLabel="Delete note">
                  <Ionicons name="trash-outline" size={15} color={palette.textFaint} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.noteBody} numberOfLines={3}>
              {n.body}
            </Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteMeta}>{noteCategoryLabel[n.category]}</Text>
              <Text style={styles.noteMeta}>{formatDate(n.date)}</Text>
            </View>
          </Pressable>
        ))
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit note' : 'New note'} onClose={() => setSheetOpen(false)} onSave={save}>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Things to ask the doctor" />
        <DateTimeField label="Date" value={date} onChange={setDate} mode="date" maximumDate={new Date()} />
        <ChipSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={(Object.keys(journalCategoryLabel) as JournalCategory[]).map((c) => ({ value: c, label: journalCategoryLabel[c] }))}
        />
        <FormField label="Note" value={body} onChangeText={setBody} multiline placeholder="Write anything..." />

        <Pressable style={styles.favoriteToggle} onPress={() => setFavorite((v) => !v)}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={palette.primaryPinkDark} />
          <Text style={styles.favoriteLabel}>Favorite</Text>
        </Pressable>

        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={20} color={palette.primaryPinkDark} />
              <Text style={styles.photoLabel}>Add photo (optional)</Text>
            </View>
          )}
        </Pressable>

        {milestones.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={styles.milestoneLabel}>Related milestone (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.milestoneRow}>
                <Pressable
                  onPress={() => setRelatedMilestoneId(NO_MILESTONE)}
                  style={[styles.milestoneChip, relatedMilestoneId === NO_MILESTONE && styles.milestoneChipActive]}
                >
                  <Text style={[styles.milestoneChipLabel, relatedMilestoneId === NO_MILESTONE && styles.milestoneChipLabelActive]}>None</Text>
                </Pressable>
                {milestones.map((m) => (
                  <Pressable
                    key={m.id}
                    onPress={() => setRelatedMilestoneId(m.id)}
                    style={[styles.milestoneChip, relatedMilestoneId === m.id && styles.milestoneChipActive]}
                  >
                    <Text style={[styles.milestoneChipLabel, relatedMilestoneId === m.id && styles.milestoneChipLabelActive]} numberOfLines={1}>
                      {m.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this note?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) remove(deleteId);
          setDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
  noteCard: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  noteHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  noteTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  noteBody: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    lineHeight: 19,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  noteMeta: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.lg,
  },
  favoriteLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.text,
  },
  photoPicker: {
    marginBottom: spacing.lg,
  },
  photoPreview: {
    width: '100%',
    height: 140,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoLabel: {
    fontSize: fontSize.sm,
    color: palette.primaryPinkDark,
    fontWeight: '600',
  },
  milestoneLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  milestoneChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    maxWidth: 160,
  },
  milestoneChipActive: {
    backgroundColor: palette.primaryPink,
    borderColor: palette.primaryPink,
  },
  milestoneChipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  milestoneChipLabelActive: {
    color: palette.white,
  },
});
