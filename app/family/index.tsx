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
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useCaregiverStore } from '../../src/store';
import { useAutoOpenAdd } from '../../src/hooks/useAutoOpenAdd';
import { generateId, nowIso } from '../../src/lib/id';
import { caregiverRelationshipLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, spacing } from '../../src/theme';
import type { Caregiver, CaregiverRelationship } from '../../src/types/models';

export default function FamilyScreen() {
  const items = useCaregiverStore((s) => s.items);
  const add = useCaregiverStore((s) => s.add);
  const update = useCaregiverStore((s) => s.update);
  const remove = useCaregiverStore((s) => s.remove);

  const [sheetOpen, setSheetOpen] = useAutoOpenAdd();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<CaregiverRelationship>('mother');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const sorted = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setRelationship('mother');
    setPhotoUri(undefined);
    setSheetOpen(true);
  };

  const openEdit = (c: Caregiver) => {
    setEditingId(c.id);
    setName(c.name);
    setRelationship(c.relationship);
    setPhotoUri(c.photoUri);
    setSheetOpen(true);
  };

  const save = () => {
    const now = nowIso();
    const payload = { name: name.trim() || 'Family member', relationship, photoUri };
    if (editingId) {
      update(editingId, { ...payload, updatedAt: now });
      showToast('Caregiver updated', 'checkmark-circle');
    } else {
      add({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Caregiver added', 'people');
    }
    setSheetOpen(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="family" title="Family & Caregivers" subtitle="Everyone who looks after your baby" />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>People</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAdd} />
      </View>

      {sorted.length === 0 ? (
        <EmptyState illustration="family" title="No family members added" message="Add parents, grandparents or caregivers here." ctaLabel="Add person" onPressCta={openAdd} />
      ) : (
        <Card padded={false}>
          {sorted.map((c, i) => (
            <Pressable key={c.id} onPress={() => openEdit(c)} style={[styles.row, i < sorted.length - 1 && styles.rowBorder]}>
              {c.photoUri ? (
                <Image source={{ uri: c.photoUri }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={20} color={palette.primaryPinkDark} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{c.name}</Text>
                <Text style={styles.relationship}>{caregiverRelationshipLabel[c.relationship]}</Text>
              </View>
              <Pressable onPress={() => setDeleteId(c.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
              </Pressable>
            </Pressable>
          ))}
        </Card>
      )}

      <FormSheet visible={sheetOpen} title={editingId ? 'Edit caregiver' : 'Add caregiver'} onClose={() => setSheetOpen(false)} onSave={save}>
        <Pressable style={styles.photoPicker} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={22} color={palette.primaryPinkDark} />
            </View>
          )}
        </Pressable>
        <FormField label="Name" value={name} onChangeText={setName} placeholder="e.g. Grandma Rose" />
        <ChipSelect
          label="Relationship"
          value={relationship}
          onChange={setRelationship}
          options={(Object.keys(caregiverRelationshipLabel) as CaregiverRelationship[]).map((r) => ({
            value: r,
            label: caregiverRelationshipLabel[r],
          }))}
        />
      </FormSheet>

      <ConfirmDialog
        visible={!!deleteId}
        title="Remove this person?"
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  relationship: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
  photoPicker: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
