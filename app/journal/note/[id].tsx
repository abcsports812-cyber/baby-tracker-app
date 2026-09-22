import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../src/components/ui/Screen';
import { ModuleHeader } from '../../../src/components/ui/ModuleHeader';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { FormSheet } from '../../../src/components/ui/FormSheet';
import { FormField } from '../../../src/components/ui/FormField';
import { ChipSelect } from '../../../src/components/ui/ChipSelect';
import { DateTimeField } from '../../../src/components/ui/DateTimeField';
import { ConfirmDialog } from '../../../src/components/ui/ConfirmDialog';
import { useMilestoneStore, useNoteStore } from '../../../src/store';
import { nowIso } from '../../../src/lib/id';
import { formatDate } from '../../../src/lib/date';
import { journalCategoryLabel, noteCategoryLabel } from '../../../src/lib/labels';
import { showToast } from '../../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../../src/theme';
import type { JournalCategory } from '../../../src/types/models';

const NO_MILESTONE = 'none';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useNoteStore((s) => s.items);
  const update = useNoteStore((s) => s.update);
  const remove = useNoteStore((s) => s.remove);
  const milestones = useMilestoneStore((s) => s.items);

  const note = notes.find((n) => n.id === id);
  const relatedMilestone = note?.relatedMilestoneId ? milestones.find((m) => m.id === note.relatedMilestoneId) : undefined;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState<JournalCategory>('everyday');
  const [favorite, setFavorite] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [relatedMilestoneId, setRelatedMilestoneId] = useState(NO_MILESTONE);

  if (!note) {
    return (
      <Screen>
        <ModuleHeader illustration="notes" title="Note" />
        <Text style={styles.notFound}>This note could not be found.</Text>
      </Screen>
    );
  }

  const colors = categoryColors.note;

  const openEdit = () => {
    setTitle(note.title);
    setBody(note.body);
    setDate(new Date(note.date));
    setCategory((note.category in journalCategoryLabel ? note.category : 'everyday') as JournalCategory);
    setFavorite(note.favorite ?? false);
    setPhotoUri(note.photoUri);
    setRelatedMilestoneId(note.relatedMilestoneId ?? NO_MILESTONE);
    setSheetOpen(true);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const toggleFavorite = () => {
    update(note.id, { favorite: !note.favorite, updatedAt: nowIso() });
  };

  const save = () => {
    update(note.id, {
      title: title.trim() || 'Untitled note',
      body: body.trim(),
      date: date.toISOString().slice(0, 10),
      category,
      favorite,
      photoUri,
      relatedMilestoneId: relatedMilestoneId === NO_MILESTONE ? undefined : relatedMilestoneId,
      updatedAt: nowIso(),
    });
    showToast('Note updated', 'checkmark-circle');
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader
        illustration="notes"
        title="Journal Entry"
        rightAction={
          <Pressable onPress={toggleFavorite} hitSlop={10} accessibilityLabel={note.favorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Ionicons name={note.favorite ? 'heart' : 'heart-outline'} size={22} color={note.favorite ? palette.primaryPink : palette.textFaint} />
          </Pressable>
        }
      />

      {note.photoUri && <Image source={{ uri: note.photoUri }} style={styles.photo} contentFit="cover" />}

      <Card>
        <Text style={styles.title}>{note.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.categoryPill, { backgroundColor: colors.bg }]}>
            <Text style={[styles.categoryPillLabel, { color: colors.text }]}>{noteCategoryLabel[note.category]}</Text>
          </View>
          <Text style={styles.date}>{formatDate(note.date)}</Text>
        </View>
        <Text style={styles.body}>{note.body}</Text>

        {relatedMilestone && (
          <Pressable style={styles.milestoneRow} onPress={() => router.push('/milestones')}>
            <Ionicons name="star" size={16} color={categoryColors.milestone.accent} />
            <Text style={styles.milestoneText}>Related milestone: {relatedMilestone.title}</Text>
          </Pressable>
        )}
      </Card>

      <View style={styles.actionRow}>
        <Button label="Edit" icon="pencil" variant="secondary" onPress={openEdit} style={{ flex: 1 }} />
        <Button label="Delete" icon="trash" variant="danger" onPress={() => setDeleteOpen(true)} style={{ flex: 1 }} />
      </View>

      <FormSheet visible={sheetOpen} title="Edit note" onClose={() => setSheetOpen(false)} onSave={save}>
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
              <View style={styles.milestonePickerRow}>
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
        visible={deleteOpen}
        title="Delete this note?"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          remove(note.id);
          setDeleteOpen(false);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryPill: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  categoryPillLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  date: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
  body: {
    fontSize: fontSize.md,
    color: palette.text,
    lineHeight: 22,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  milestoneText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.text,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
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
  milestonePickerRow: {
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
