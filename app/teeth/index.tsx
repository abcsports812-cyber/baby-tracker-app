import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { ToothChart } from '../../src/components/ui/ToothChart';
import { useMilestoneStore, useToothStore } from '../../src/store';
import { nowIso } from '../../src/lib/id';
import { TOOTH_CHART, toothSlotLabel } from '../../src/lib/teeth';
import { teethingSymptomLabel, toothStatusLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';
import type { TeethingSymptom, ToothRecord, ToothStatus } from '../../src/types/models';

const NO_MILESTONE = 'none';
const TOTAL_TEETH = TOOTH_CHART.length;

const FILTER_OPTIONS: { value: 'all' | ToothStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'erupted', label: 'Erupted' },
  { value: 'emerging', label: 'Emerging' },
  { value: 'notErupted', label: 'Not erupted' },
  { value: 'lost', label: 'Lost' },
];

const SYMPTOM_OPTIONS = Object.keys(teethingSymptomLabel) as TeethingSymptom[];

export default function TeethScreen() {
  const items = useToothStore((s) => s.items);
  const add = useToothStore((s) => s.add);
  const update = useToothStore((s) => s.update);
  const remove = useToothStore((s) => s.remove);
  const milestones = useMilestoneStore((s) => s.items);

  const [filter, setFilter] = useState<'all' | ToothStatus>('all');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [showFirstToothBanner, setShowFirstToothBanner] = useState(false);

  const [status, setStatus] = useState<ToothStatus>('notErupted');
  const [eruptionDate, setEruptionDate] = useState<Date | null>(null);
  const [lossDate, setLossDate] = useState<Date | null>(null);
  const [symptoms, setSymptoms] = useState<TeethingSymptom[]>([]);
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [relatedMilestoneId, setRelatedMilestoneId] = useState(NO_MILESTONE);

  const records = useMemo(() => {
    const map: Record<string, ToothRecord | undefined> = {};
    for (const r of items) map[r.id] = r;
    return map;
  }, [items]);

  const eruptedCount = items.filter((i) => i.status === 'erupted').length;
  const editingSlot = editingSlotId ? TOOTH_CHART.find((s) => s.id === editingSlotId) : undefined;
  const editingRecord = editingSlotId ? records[editingSlotId] : undefined;

  const openEdit = (slotId: string) => {
    const record = records[slotId];
    setEditingSlotId(slotId);
    setStatus(record?.status ?? 'notErupted');
    setEruptionDate(record?.eruptionDate ? new Date(record.eruptionDate) : null);
    setLossDate(record?.lossDate ? new Date(record.lossDate) : null);
    setSymptoms(record?.symptoms ?? []);
    setNotes(record?.notes ?? '');
    setPhotoUri(record?.photoUri);
    setRelatedMilestoneId(record?.relatedMilestoneId ?? NO_MILESTONE);
  };

  const toggleSymptom = (symptom: TeethingSymptom) => {
    setSymptoms((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const save = () => {
    if (!editingSlotId || !editingSlot) return;
    const now = nowIso();

    const hadEmergedBefore = editingRecord?.status === 'emerging' || editingRecord?.status === 'erupted';
    const nowHasEmerged = status === 'emerging' || status === 'erupted';
    const anyOtherToothHasEmerged = items.some(
      (i) => i.id !== editingSlotId && (i.status === 'emerging' || i.status === 'erupted')
    );

    const payload = {
      position: editingSlot.position,
      type: editingSlot.type,
      status,
      eruptionDate: status === 'emerging' || status === 'erupted' ? (eruptionDate ?? new Date()).toISOString().slice(0, 10) : undefined,
      lossDate: status === 'lost' ? (lossDate ?? new Date()).toISOString().slice(0, 10) : undefined,
      symptoms: symptoms.length > 0 ? symptoms : undefined,
      notes: notes.trim() || undefined,
      photoUri,
      relatedMilestoneId: relatedMilestoneId === NO_MILESTONE ? undefined : relatedMilestoneId,
    };

    if (editingRecord) {
      update(editingSlotId, { ...payload, updatedAt: now });
    } else {
      add({ id: editingSlotId, ...payload, createdAt: now, updatedAt: now });
    }

    // A one-time, dismissible suggestion shown only the moment the very
    // first tooth across the whole chart reaches emerging/erupted — it
    // never writes to Milestones itself, only offers to navigate there.
    if (nowHasEmerged && !hadEmergedBefore && !anyOtherToothHasEmerged) {
      setShowFirstToothBanner(true);
    }

    showToast('Tooth updated', 'happy-outline');
    setEditingSlotId(null);
  };

  return (
    <Screen>
      <ModuleHeader illustration="teeth" title="Teeth" subtitle={`${eruptedCount} of ${TOTAL_TEETH} teeth erupted`} />

      {showFirstToothBanner && (
        <Card style={[styles.banner, { backgroundColor: categoryColors.milestone.bg }]}>
          <View style={styles.bannerRow}>
            <Ionicons name="star" size={20} color={categoryColors.milestone.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>First tooth logged!</Text>
              <Text style={styles.bannerText}>Want to mark &ldquo;First tooth&rdquo; as achieved in Milestones?</Text>
              <View style={styles.bannerButtons}>
                <Button
                  label="View Milestones"
                  size="sm"
                  onPress={() => {
                    setShowFirstToothBanner(false);
                    router.push('/milestones');
                  }}
                />
                <Button label="Dismiss" size="sm" variant="ghost" onPress={() => setShowFirstToothBanner(false)} />
              </View>
            </View>
          </View>
        </Card>
      )}

      <ChipSelect label="Filter" value={filter} onChange={setFilter} options={FILTER_OPTIONS} />

      <ToothChart records={records} filter={filter} onPressTooth={openEdit} />

      <FormSheet
        visible={!!editingSlotId}
        title={editingSlot ? toothSlotLabel(editingSlot) : 'Tooth'}
        onClose={() => setEditingSlotId(null)}
        onSave={save}
      >
        <ChipSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={(Object.keys(toothStatusLabel) as ToothStatus[]).map((s) => ({ value: s, label: toothStatusLabel[s] }))}
        />

        {(status === 'emerging' || status === 'erupted') && (
          <DateTimeField label="Eruption date" value={eruptionDate ?? new Date()} onChange={setEruptionDate} mode="date" maximumDate={new Date()} />
        )}
        {status === 'lost' && (
          <DateTimeField label="Loss date" value={lossDate ?? new Date()} onChange={setLossDate} mode="date" maximumDate={new Date()} />
        )}

        <Text style={styles.symptomsLabel}>Teething symptoms (optional)</Text>
        <View style={styles.symptomsRow}>
          {SYMPTOM_OPTIONS.map((symptom) => {
            const active = symptoms.includes(symptom);
            return (
              <Pressable key={symptom} onPress={() => toggleSymptom(symptom)} style={[styles.symptomChip, active && styles.symptomChipActive]}>
                <Text style={[styles.symptomChipLabel, active && styles.symptomChipLabelActive]}>{teethingSymptomLabel[symptom]}</Text>
              </Pressable>
            );
          })}
        </View>

        <FormField label="Notes" value={notes} onChangeText={setNotes} multiline optional />

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

        <Button
          label="Log this in Journal"
          icon="images"
          variant="ghost"
          onPress={() => router.push('/memories?add=1')}
          style={{ marginBottom: spacing.lg }}
        />

        {editingRecord && (
          <Pressable style={styles.resetRow} onPress={() => setResetOpen(true)}>
            <Ionicons name="refresh" size={16} color={palette.textFaint} />
            <Text style={styles.resetLabel}>Reset this tooth to default</Text>
          </Pressable>
        )}
      </FormSheet>

      <ConfirmDialog
        visible={resetOpen}
        title="Reset this tooth's status?"
        message="This clears its status, dates, symptoms, notes and photo back to default — it isn't removed from the chart."
        confirmLabel="Reset"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          if (editingSlotId) remove(editingSlotId);
          setResetOpen(false);
          setEditingSlotId(null);
          showToast('Tooth reset', 'refresh');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.lg,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bannerTitle: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: palette.text,
  },
  bannerText: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  symptomsLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  symptomChip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  symptomChipActive: {
    backgroundColor: palette.primaryPink,
    borderColor: palette.primaryPink,
  },
  symptomChipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  symptomChipLabelActive: {
    color: palette.white,
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
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  resetLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: palette.textFaint,
  },
});
