import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useBabyProfileStore, useSettingsStore } from '../../src/store';
import { calculateAge, formatDate } from '../../src/lib/date';
import { formatHeight, formatWeight } from '../../src/lib/units';
import { fontSize, palette, radius, spacing } from '../../src/theme';

const GENDER_LABEL: Record<string, string> = {
  girl: 'Girl',
  boy: 'Boy',
  other: 'Other',
  unspecified: 'Not specified',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const profile = useBabyProfileStore((s) => s.value);
  const weightUnit = useSettingsStore((s) => s.value.weightUnit);
  const heightUnit = useSettingsStore((s) => s.value.heightUnit);

  if (!profile) {
    return (
      <Screen>
        <ModuleHeader illustration="babyProfile" title="Baby Profile" />
        <Button label="Set up profile" icon="add" onPress={() => router.push('/profile/edit')} />
      </Screen>
    );
  }

  const age = calculateAge(profile.dateOfBirth);

  return (
    <Screen>
      <ModuleHeader
        illustration="babyProfile"
        title={profile.name}
        subtitle={age.label}
        rightAction={
          <Button label="Edit" variant="secondary" size="sm" icon="pencil" onPress={() => router.push('/profile/edit')} />
        }
      />

      {profile.photoUri && (
        <View style={styles.photoWrap}>
          <Image source={{ uri: profile.photoUri }} style={styles.photo} contentFit="cover" />
        </View>
      )}

      <Card>
        <Row label="Date of birth" value={formatDate(profile.dateOfBirth)} />
        {profile.birthTime && <Row label="Birth time" value={profile.birthTime} />}
        <Row label="Gender" value={GENDER_LABEL[profile.gender] ?? 'Not specified'} />
        <Row label="Age" value={`${age.days} days (${age.months} months)`} />
        {profile.birthWeightKg != null && <Row label="Birth weight" value={formatWeight(profile.birthWeightKg, weightUnit)} />}
        {profile.birthHeightCm != null && <Row label="Birth height" value={formatHeight(profile.birthHeightCm, heightUnit)} />}
        {profile.bloodType && <Row label="Blood type" value={profile.bloodType} />}
      </Card>

      {profile.notes ? (
        <Card style={{ marginTop: spacing.lg }}>
          <View style={styles.notesHeader}>
            <Ionicons name="document-text-outline" size={16} color={palette.textSecondary} />
            <Text style={styles.notesTitle}>Notes</Text>
          </View>
          <Text style={styles.notesBody}>{profile.notes}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photo: {
    width: 140,
    height: 140,
    borderRadius: radius.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  rowLabel: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
  },
  rowValue: {
    fontSize: fontSize.md,
    color: palette.text,
    fontWeight: '700',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  notesTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
  },
  notesBody: {
    fontSize: fontSize.md,
    color: palette.text,
    lineHeight: 21,
  },
});
