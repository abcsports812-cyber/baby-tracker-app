import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useBabyProfilesStore } from '../../src/store';
import { setActiveBaby, useActiveBabyId, useLegacyDefaultBabyId, useUnmigratedLegacyRecordCount } from '../../src/lib/babyScope';
import { calculateAge } from '../../src/lib/date';
import { showToast } from '../../src/components/ui/Toast';
import { fontSize, palette, radius, spacing } from '../../src/theme';
import type { BabyProfile } from '../../src/types/models';

function BabyRow({
  profile,
  isActive,
  isLast,
  onSwitch,
  onEdit,
  onDelete,
}: {
  profile: BabyProfile;
  isActive: boolean;
  isLast: boolean;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const age = calculateAge(profile.dateOfBirth);
  return (
    <Pressable
      onPress={onSwitch}
      style={[styles.row, !isLast && styles.rowBorder]}
      accessibilityLabel={isActive ? `${profile.name}, active baby` : `Switch to ${profile.name}`}
    >
      {profile.photoUri ? (
        <Image source={{ uri: profile.photoUri }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="happy" size={22} color={palette.primaryPinkDark} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark" size={11} color={palette.white} />
              <Text style={styles.activeBadgeLabel}>Active</Text>
            </View>
          )}
        </View>
        <Text style={styles.age}>{age.label}</Text>
      </View>
      <Pressable onPress={onEdit} hitSlop={10} style={styles.iconBtn} accessibilityLabel={`Edit ${profile.name}`}>
        <Ionicons name="pencil" size={16} color={palette.textFaint} />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.iconBtn} accessibilityLabel={`Delete ${profile.name}`}>
        <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
      </Pressable>
    </Pressable>
  );
}

export default function ManageBabiesScreen() {
  const profiles = useBabyProfilesStore((s) => s.items);
  const removeProfile = useBabyProfilesStore((s) => s.remove);
  const activeBabyId = useActiveBabyId();
  const legacyDefaultBabyId = useLegacyDefaultBabyId();
  const unmigratedCount = useUnmigratedLegacyRecordCount();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (profiles.length === 0) {
    return (
      <Screen>
        <ModuleHeader illustration="babyProfile" title="Manage Babies" />
        <EmptyState
          illustration="babyProfile"
          title="No babies set up yet"
          message="Add your baby's profile to start tracking their journey."
          ctaLabel="Add baby"
          onPressCta={() => router.push('/profile/edit')}
        />
      </Screen>
    );
  }

  const requestDelete = (id: string) => {
    if (id === legacyDefaultBabyId && unmigratedCount > 0) {
      showToast(`Can't delete yet — ${unmigratedCount} existing record${unmigratedCount === 1 ? '' : 's'} still need Phase 3 migration`, 'alert-circle-outline');
      return;
    }
    setDeleteId(id);
  };

  const deleteTarget = profiles.find((p) => p.id === deleteId);

  const confirmDelete = () => {
    if (!deleteId) return;
    removeProfile(deleteId);
    if (deleteId === activeBabyId) {
      const remaining = profiles.filter((p) => p.id !== deleteId);
      setActiveBaby(remaining[0]?.id ?? null);
    }
    showToast('Baby profile deleted', 'trash');
    setDeleteId(null);
  };

  return (
    <Screen>
      <ModuleHeader
        illustration="babyProfile"
        title="Manage Babies"
        subtitle={`${profiles.length} ${profiles.length === 1 ? 'baby' : 'babies'}`}
        rightAction={<Button label="Add" icon="add" size="sm" onPress={() => router.push('/profile/edit?new=1')} />}
      />

      <Card padded={false}>
        {profiles.map((p, i) => (
          <BabyRow
            key={p.id}
            profile={p}
            isActive={p.id === activeBabyId}
            isLast={i === profiles.length - 1}
            onSwitch={() => {
              if (p.id !== activeBabyId) {
                setActiveBaby(p.id);
                showToast(`Switched to ${p.name}`, 'happy');
              }
            }}
            onEdit={() => router.push(`/profile/edit?id=${p.id}`)}
            onDelete={() => requestDelete(p.id)}
          />
        ))}
      </Card>

      <ConfirmDialog
        visible={!!deleteId}
        title={`Delete ${deleteTarget?.name ?? 'this baby'}'s profile?`}
        message="This removes the profile. This can't be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  age: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: palette.primaryPink,
    borderRadius: radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  activeBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.white,
  },
  iconBtn: {
    padding: 4,
  },
});
