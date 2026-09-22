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
import { useMemoryStore, useMilestoneStore } from '../../../src/store';
import { nowIso } from '../../../src/lib/id';
import { formatDate } from '../../../src/lib/date';
import { journalCategoryLabel } from '../../../src/lib/labels';
import { showToast } from '../../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../../src/theme';
import type { JournalCategory } from '../../../src/types/models';

const NO_MILESTONE = 'none';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memories = useMemoryStore((s) => s.items);
  const update = useMemoryStore((s) => s.update);
  const remove = useMemoryStore((s) => s.remove);
  const milestones = useMilestoneStore((s) => s.items);

  const memory = memories.find((m) => m.id === id);
  const relatedMilestone = memory?.relatedMilestoneId ? milestones.find((m) => m.id === memory.relatedMilestoneId) : undefined;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [category, setCategory] = useState<JournalCategory>('everyday');
  const [favorite, setFavorite] = useState(false);
  const [relatedMilestoneId, setRelatedMilestoneId] = useState(NO_MILESTONE);

  if (!memory) {
    return (
      <Screen>
        <ModuleHeader illustration="memories" title="Memory" />
        <Text style={styles.notFound}>This memory could not be found.</Text>
      </Screen>
    );
  }

  const colors = categoryColors.memory;

  const openEdit = () => {
    setTitle(memory.title);
    setDate(new Date(memory.date));
    setCaption(memory.caption ?? '');
    setPhotoUri(memory.photoUri);
    setCategory(memory.category ?? 'everyday');
    setFavorite(memory.favorite ?? false);
    setRelatedMilestoneId(memory.relatedMilestoneId ?? NO_MILESTONE);
    setSheetOpen(true);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const toggleFavorite = () => {
    update(memory.id, { favorite: !memory.favorite, updatedAt: nowIso() });
  };

  const save = () => {
    update(memory.id, {
      title: title.trim() || 'Memory',
      date: date.toISOString().slice(0, 10),
      caption: caption.trim() || undefined,
      photoUri,
      category,
      favorite,
      relatedMilestoneId: relatedMilestoneId === NO_MILESTONE ? undefined : relatedMilestoneId,
      updatedAt: nowIso(),
    });
    showToast('Memory updated', 'checkmark-circle');
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader
        illustration="memories"
        title="Memory"
        rightAction={
          <Pressable onPress={toggleFavorite} hitSlop={10} accessibilityLabel={memory.favorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Ionicons name={memory.favorite ? 'heart' : 'heart-outline'} size={22} color={memory.favorite ? palette.primaryPink : palette.textFaint} />
          </Pressable>
        }
      />

      {memory.photoUri && <Image source={{ uri: memory.photoUri }} style={styles.photo} contentFit="cover" />}

      <Card>
        <Text style={styles.title}>{memory.title}</Text>
        <View style={styles.metaRow}>
          {memory.category && (
            <View style={[styles.categoryPill, { backgroundColor: colors.bg }]}>
              <Text style={[styles.categoryPillLabel, { color: colors.text }]}>{journalCategoryLabel[memory.category]}</Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(memory.date)}</Text>
        </View>
        {memory.caption ? <Text style={styles.body}>{memory.caption}</Text> : null}

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

      <FormSheet visible={sheetOpen} title="Edit memory" onClose={() => setSheetOpen(false)} onSave={save}>
        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={24} color={palette.primaryPinkDark} />
              <Text style={styles.photoLabel}>Add photo</Text>
            </View>
          )}
        </Pressable>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. First trip to the park" />
        <DateTimeField label="Date" value={date} onChange={setDate} mode="date" maximumDate={new Date()} />
        <ChipSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={(Object.keys(journalCategoryLabel) as JournalCategory[]).map((c) => ({ value: c, label: journalCategoryLabel[c] }))}
        />
        <FormField label="Caption" value={caption} onChangeText={setCaption} multiline optional />

        <Pressable style={styles.favoriteToggle} onPress={() => setFavorite((v) => !v)}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={palette.primaryPinkDark} />
          <Text style={styles.favoriteLabel}>Favorite</Text>
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
        title="Delete this memory?"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          remove(memory.id);
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
    height: 160,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    height: 120,
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
