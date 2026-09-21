import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { FormSheet } from '../../src/components/ui/FormSheet';
import { FormField } from '../../src/components/ui/FormField';
import { ChipSelect } from '../../src/components/ui/ChipSelect';
import { DateTimeRow } from '../../src/components/ui/DateTimeRow';
import { DateTimeField } from '../../src/components/ui/DateTimeField';
import { RecordRow } from '../../src/components/ui/RecordRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { useHealthRecordStore, useVaccinationStore } from '../../src/store';
import { generateId, nowIso } from '../../src/lib/id';
import { formatDate, formatDateTime } from '../../src/lib/date';
import { healthRecordTypeLabel } from '../../src/lib/labels';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, radius, spacing } from '../../src/theme';
import type { HealthRecord, HealthRecordType, Vaccination } from '../../src/types/models';

const HEALTH_ICON: Record<HealthRecordType, keyof typeof Ionicons.glyphMap> = {
  doctorVisit: 'medical',
  symptom: 'thermometer',
  temperature: 'thermometer',
  medication: 'medkit',
  other: 'document-text',
};

export default function HealthScreen() {
  const vaccinations = useVaccinationStore((s) => s.items);
  const addVax = useVaccinationStore((s) => s.add);
  const updateVax = useVaccinationStore((s) => s.update);
  const removeVax = useVaccinationStore((s) => s.remove);

  const records = useHealthRecordStore((s) => s.items);
  const addRecord = useHealthRecordStore((s) => s.add);
  const updateRecord = useHealthRecordStore((s) => s.update);
  const removeRecord = useHealthRecordStore((s) => s.remove);

  const [vaxSheet, setVaxSheet] = useState(false);
  const [vaxEditId, setVaxEditId] = useState<string | null>(null);
  const [vaxDeleteId, setVaxDeleteId] = useState<string | null>(null);
  const [vaxName, setVaxName] = useState('');
  const [vaxDate, setVaxDate] = useState(new Date());
  const [vaxDose, setVaxDose] = useState('');
  const [vaxNextDue, setVaxNextDue] = useState<Date | null>(null);

  const [recordSheet, setRecordSheet] = useState(false);
  const [recordEditId, setRecordEditId] = useState<string | null>(null);
  const [recordDeleteId, setRecordDeleteId] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<HealthRecordType>('doctorVisit');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDate, setRecordDate] = useState(new Date());
  const [recordTemp, setRecordTemp] = useState('');
  const [recordNotes, setRecordNotes] = useState('');

  const sortedVax = useMemo(() => [...vaccinations].sort((a, b) => b.date.localeCompare(a.date)), [vaccinations]);
  const sortedRecords = useMemo(() => [...records].sort((a, b) => b.date.localeCompare(a.date)), [records]);

  const openAddVax = () => {
    setVaxEditId(null);
    setVaxName('');
    setVaxDate(new Date());
    setVaxDose('');
    setVaxNextDue(null);
    setVaxSheet(true);
  };

  const openEditVax = (v: Vaccination) => {
    setVaxEditId(v.id);
    setVaxName(v.vaccineName);
    setVaxDate(new Date(v.date));
    setVaxDose(v.doseNotes ?? '');
    setVaxNextDue(v.nextDueDate ? new Date(v.nextDueDate) : null);
    setVaxSheet(true);
  };

  const saveVax = () => {
    const now = nowIso();
    const payload = {
      vaccineName: vaxName.trim() || 'Vaccine',
      date: vaxDate.toISOString().slice(0, 10),
      doseNotes: vaxDose.trim() || undefined,
      nextDueDate: vaxNextDue ? vaxNextDue.toISOString().slice(0, 10) : undefined,
    };
    if (vaxEditId) {
      updateVax(vaxEditId, { ...payload, updatedAt: now });
      showToast('Vaccination updated', 'checkmark-circle');
    } else {
      addVax({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Vaccination saved', 'shield-checkmark');
    }
    setVaxSheet(false);
  };

  const openAddRecord = () => {
    setRecordEditId(null);
    setRecordType('doctorVisit');
    setRecordTitle('');
    setRecordDate(new Date());
    setRecordTemp('');
    setRecordNotes('');
    setRecordSheet(true);
  };

  const openEditRecord = (r: HealthRecord) => {
    setRecordEditId(r.id);
    setRecordType(r.type);
    setRecordTitle(r.title);
    setRecordDate(new Date(r.date));
    setRecordTemp(r.temperatureC?.toString() ?? '');
    setRecordNotes(r.notes ?? '');
    setRecordSheet(true);
  };

  const saveRecord = () => {
    const now = nowIso();
    const payload = {
      type: recordType,
      title: recordTitle.trim() || healthRecordTypeLabel[recordType],
      date: recordDate.toISOString(),
      temperatureC: recordType === 'temperature' && recordTemp ? Number(recordTemp) : undefined,
      notes: recordNotes.trim() || undefined,
    };
    if (recordEditId) {
      updateRecord(recordEditId, { ...payload, updatedAt: now });
      showToast('Health record updated', 'checkmark-circle');
    } else {
      addRecord({ id: generateId(), ...payload, createdAt: now, updatedAt: now });
      showToast('Health record saved', 'medkit');
    }
    setRecordSheet(false);
  };

  return (
    <Screen>
      <ModuleHeader illustration="health" title="Health" subtitle="Vaccinations & health records" />

      <View style={styles.disclaimer}>
        <Ionicons name="information-circle" size={16} color={palette.primaryPinkDark} />
        <Text style={styles.disclaimerText}>
          Baby Tracker is for personal record keeping and does not replace professional medical advice.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vaccinations</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAddVax} />
      </View>
      {sortedVax.length === 0 ? (
        <EmptyState illustration="health" title="No vaccinations recorded" message="Add your baby's vaccination history here." />
      ) : (
        <Card style={{ marginBottom: spacing.xl }}>
          {sortedVax.map((v) => (
            <RecordRow
              key={v.id}
              category="health"
              icon="shield-checkmark"
              title={v.vaccineName}
              subtitle={v.nextDueDate ? `Next due ${formatDate(v.nextDueDate)}` : v.doseNotes}
              time={formatDate(v.date)}
              onPress={() => openEditVax(v)}
              onDelete={() => setVaxDeleteId(v.id)}
            />
          ))}
        </Card>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Health records</Text>
        <Button label="Add" icon="add" size="sm" onPress={openAddRecord} />
      </View>
      {sortedRecords.length === 0 ? (
        <EmptyState illustration="health" title="No health records yet" message="Log doctor visits, symptoms or medication here." />
      ) : (
        <Card>
          {sortedRecords.map((r) => (
            <RecordRow
              key={r.id}
              category="health"
              icon={HEALTH_ICON[r.type]}
              title={r.title}
              subtitle={r.temperatureC != null ? `${r.temperatureC}°C · ${r.notes ?? ''}` : r.notes}
              time={formatDateTime(r.date)}
              onPress={() => openEditRecord(r)}
              onDelete={() => setRecordDeleteId(r.id)}
            />
          ))}
        </Card>
      )}

      <FormSheet visible={vaxSheet} title={vaxEditId ? 'Edit vaccination' : 'Add vaccination'} onClose={() => setVaxSheet(false)} onSave={saveVax}>
        <FormField label="Vaccine name" value={vaxName} onChangeText={setVaxName} placeholder="e.g. DTaP" />
        <DateTimeField label="Date given" value={vaxDate} onChange={setVaxDate} mode="date" maximumDate={new Date()} />
        <FormField label="Dose / notes" value={vaxDose} onChangeText={setVaxDose} optional />
        <DateTimeField label="Next due date" value={vaxNextDue ?? new Date()} onChange={setVaxNextDue} mode="date" />
      </FormSheet>

      <FormSheet visible={recordSheet} title={recordEditId ? 'Edit health record' : 'Add health record'} onClose={() => setRecordSheet(false)} onSave={saveRecord}>
        <ChipSelect
          label="Type"
          value={recordType}
          onChange={setRecordType}
          options={(Object.keys(healthRecordTypeLabel) as HealthRecordType[]).map((t) => ({ value: t, label: healthRecordTypeLabel[t] }))}
        />
        <FormField label="Title" value={recordTitle} onChangeText={setRecordTitle} placeholder="e.g. Pediatrician checkup" />
        <DateTimeRow value={recordDate} onChange={setRecordDate} maximumDate={new Date()} />
        {recordType === 'temperature' && (
          <FormField label="Temperature (°C)" value={recordTemp} onChangeText={setRecordTemp} keyboardType="decimal-pad" />
        )}
        <FormField label="Notes" value={recordNotes} onChangeText={setRecordNotes} multiline optional />
      </FormSheet>

      <ConfirmDialog
        visible={!!vaxDeleteId}
        title="Delete this vaccination?"
        onCancel={() => setVaxDeleteId(null)}
        onConfirm={() => {
          if (vaxDeleteId) removeVax(vaxDeleteId);
          setVaxDeleteId(null);
        }}
      />
      <ConfirmDialog
        visible={!!recordDeleteId}
        title="Delete this record?"
        onCancel={() => setRecordDeleteId(null)}
        onConfirm={() => {
          if (recordDeleteId) removeRecord(recordDeleteId);
          setRecordDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: palette.softPink,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: palette.primaryPinkDark,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
});
