import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useMilestoneStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate } from '../../src/lib/date';
import { milestoneCategoryLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { Milestone, MilestoneCategory } from '../../src/types/models';

const CATEGORIES: MilestoneCategory[] = ['motor', 'communication', 'social', 'cognitive', 'feeding', 'sleep', 'other'];

export default function MilestonesScreen() {
  const items = useMilestoneStore((s) => s.items);
  const add = useMilestoneStore((s) => s.add);
  const update = useMilestoneStore((s) => s.update);
  const remove = useMilestoneStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MilestoneCategory>('motor');
  const [completed, setCompleted] = useState(false);
  const [dateAchieved, setDateAchieved] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const completedCount = items.filter((m) => m.completed).length;

  const grouped = useMemo(() => {
    const map = new Map<MilestoneCategory, Milestone[]>();
    for (const cat of CATEGORIES) map.set(cat, []);
    for (const m of items) map.get(m.category)?.push(m);
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [items]);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setCategory('motor');
    setCompleted(false);
    setDateAchieved(new Date());
    setNotes('');
    setPhotoUri(undefined);
    setSheetOpen(true);
  };

  const openEdit = (m: Milestone) => {
    setEditingId(m.id);
    setTitle(m.title);
    setCategory(m.category);
    setCompleted(m.completed);
    setDateAchieved(m.dateAchieved ? new Date(m.dateAchieved) : new Date());
    setNotes(m.notes ?? '');
    setPhotoUri(m.photoUri);
    setSheetOpen(true);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      title: title.trim() || 'Milestone',
      category,
      completed,
      dateAchieved: completed ? dateAchieved.toISOString().slice(0, 10) : undefined,
      notes: notes.trim() || undefined,
      photoUri,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast(completed ? 'Milestone achieved!' : 'Milestone updated', completed ? 'star' : 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, isCustom: true, createdAt: now, updatedAt: now });
      showToast('Milestone added', 'star');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="milestones" title="Milestones" subtitle={`${completedCount} of ${items.length} achieved`} />

      <View style={styles.listHeader}>
        <Text style={styles.hint}>Every baby grows at their own pace — these are just fun moments to remember.</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {items.length === 0 ? (
        <EmptyState illustration="milestones" title="No milestones recorded yet" message="Add a milestone to celebrate your baby's progress." />
      ) : (
        CATEGORIES.map((cat) => {
          const list = grouped.get(cat) ?? [];
          if (list.length === 0) return null;
          return (
            <View key={cat} style={{ marginBottom: spacing.xl }}>
              <Text style={styles.categoryTitle}>{milestoneCategoryLabel[cat]}</Text>
              <Card padded={false}>
                {list.map((m, i) => (
                  <Pressable
                    key={m.id}
                    onPress={() => openEdit(m)}
                    style={[styles.row, i < list.length - 1 && styles.rowBorder]}
                  >
                    <View style={[styles.checkbox, m.completed && styles.checkboxDone]}>
                      {m.completed && <Ionicons name="checkmark" size={14} color={palette.white} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.milestoneTitle, m.completed && styles.milestoneTitleDone]}>{m.title}</Text>
                      {m.completed && m.dateAchieved && <Text style={styles.milestoneDate}>{formatDate(m.dateAchieved)}</Text>}
                    </View>
                    <Pressable onPress={() => setDeleteId(m.id)} hitSlop={10}>
                      <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
                    </Pressable>
                  </Pressable>
                ))}
              </Card>
            </View>
          );
        })
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit milestone' : 'Add milestone'} onClose={() => setSheetOpen(false)} onSave={save}>
        <FormField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. First giggle" />
        <ChipSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({ value: c, label: milestoneCategoryLabel[c] }))}
        />
        <Pressable style={styles.completeToggle} onPress={() => setCompleted((v) => !v)}>
          <View style={[styles.checkbox, completed && styles.checkboxDone]}>
            {completed && <Ionicons name="checkmark" size={14} color={palette.white} />}
          </View>
          <Text style={styles.completeLabel}>Mark as achieved</Text>
        </Pressable>
        {completed && <DateTimeField label="Date achieved" value={dateAchieved} onChange={setDateAchieved} mode="date" maximumDate={new Date()} />}
        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />
        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={20} color={palette.primaryPinkDark} />
              <Text style={styles.photoLabel}>Add photo (optional)</Text>
            </View>
          )}
        </Pressable>
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this milestone?"
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
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  hint: {
    flex: 1,
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    lineHeight: 16,
  },
  categoryTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: categoryColors.milestone.text,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: categoryColors.milestone.accent,
    borderColor: categoryColors.milestone.accent,
  },
  milestoneTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  milestoneTitleDone: {
    color: palette.textSecondary,
  },
  milestoneDate: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: 2,
  },
  completeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  completeLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  photoPicker: {
    marginTop: spacing.xs,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    height: 60,
    borderRadius: radius.md,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoLabel: {
    fontSize: fontSize.sm,
    color: palette.primaryPinkDark,
    fontWeight: '600',
  },
});
