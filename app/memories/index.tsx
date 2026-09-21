import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useMemoryStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, radius, shadow, spacing } from '../../src/theme';
import type { Memory } from '../../src/types/models';

const TILE_SIZE = (Dimensions.get('window').width - spacing.xl * 2 - spacing.md) / 2;

export default function MemoriesScreen() {
  const items = useMemoryStore((s) => s.items);
  const add = useMemoryStore((s) => s.add);
  const update = useMemoryStore((s) => s.update);
  const remove = useMemoryStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

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
    setDate(new Date());
    setCaption('');
    setPhotoUri(undefined);
    setSheetOpen(true);
  };

  const openEdit = (m: Memory) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDate(new Date(m.date));
    setCaption(m.caption ?? '');
    setPhotoUri(m.photoUri);
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = {
      title: title.trim() || 'Memory',
      date: date.toISOString().slice(0, 10),
      caption: caption.trim() || undefined,
      photoUri,
    };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Memory updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Memory saved', 'heart');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader
        illustration="memories"
        title="Memories"
        subtitle={`${items.length} moment${items.length === 1 ? '' : 's'} saved`}
        rightAction={<Button label="Add" icon="add" size="sm" onPress={openAdd} />}
      />

      {sorted.length === 0 ? (
        <EmptyState
          illustration="memories"
          title="Your baby's first memories start here 💕"
          message="Capture a little moment you'll want to remember."
          ctaLabel="Add memory"
          onPressCta={openAdd}
        />
      ) : (
        <View style={styles.grid}>
          {sorted.map((m) => (
            <Pressable key={m.id} style={[styles.tile, shadow.soft]} onPress={() => openEdit(m)}>
              {m.photoUri ? (
                <Image source={{ uri: m.photoUri }} style={styles.tileImage} contentFit="cover" />
              ) : (
                <View style={styles.tilePlaceholder}>
                  <Ionicons name="images" size={28} color={palette.primaryPinkDark} />
                </View>
              )}
              <View style={styles.tileFooter}>
                <Text style={styles.tileTitle} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={styles.tileDate}>{formatDate(m.date)}</Text>
              </View>
              <Pressable onPress={() => setDeleteId(m.id)} hitSlop={8} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={14} color={palette.white} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit memory' : 'Add memory'} onClose={() => setSheetOpen(false)} onSave={save}>
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
        <FormField label="Caption" value={caption} onChangeText={setCaption} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this memory?"
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: TILE_SIZE,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: TILE_SIZE * 0.85,
  },
  tilePlaceholder: {
    width: '100%',
    height: TILE_SIZE * 0.85,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileFooter: {
    padding: spacing.sm,
  },
  tileTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  tileDate: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: 1,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(91,82,96,0.45)',
    borderRadius: 12,
    padding: 5,
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
});
