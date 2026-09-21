import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useNoteStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate } from '../../src/lib/date';
import { noteCategoryLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, radius, shadow, spacing } from '../../src/theme';
import type { JournalNote, NoteCategory } from '../../src/types/models';

export default function NotesScreen() {
  const items = useNoteStore((s) => s.items);
  const add = useNoteStore((s) => s.add);
  const update = useNoteStore((s) => s.update);
  const remove = useNoteStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState<NoteCategory>('general');

  const sorted = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date)), [items]);

  const openAdd = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setDate(new Date());
    setCategory('general');
    setSheetOpen(true);
  };

  const openEdit = (n: JournalNote) => {
    setEditingId(n.id);
    setTitle(n.title);
    setBody(n.body);
    setDate(new Date(n.date));
    setCategory(n.category);
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      title: title.trim() || 'Untitled note',
      body: body.trim(),
      date: date.toISOString().slice(0, 10),
      category,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Note updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
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
              <Pressable onPress={() => setDeleteId(n.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={15} color={palette.textFaint} />
              </Pressable>
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
        <DateTimeField label="Date" value={date} onChange={setDate} mode="date" />
        <ChipSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={(Object.keys(noteCategoryLabel) as NoteCategory[]).map((c) => ({ value: c, label: noteCategoryLabel[c] }))}
        />
        <FormField label="Note" value={body} onChangeText={setBody} multiline placeholder="Write anything..." />
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
});
