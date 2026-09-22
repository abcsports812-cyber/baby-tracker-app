import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ConfirmDialog } from '../../src/components/ui/ConfirmDialog';
import { SOUNDS, getSoundById } from '../../src/data/sounds';
import { SoundIllustration } from '../../src/components/sounds/SoundIllustration';
import { useSoundMixStore } from '../../src/store';
import { useSoundPlayerStore } from '../../src/store/soundPlayer';
import { generateId, nowIso } from '../../src/lib/id';
import { showToast } from '../../src/components/ui/Toast';
import { categoryColors, fontSize, palette, spacing } from '../../src/theme';
import type { SoundMix } from '../../src/types/models';

const MIXABLE_SOUNDS = SOUNDS.filter((s) => s.mixable);

export default function MixSoundsScreen() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeSoundIds = useSoundPlayerStore((s) => s.activeSoundIds);
  const volumes = useSoundPlayerStore((s) => s.volumes);
  const isMixMode = useSoundPlayerStore((s) => s.isMixMode);
  const toggleMixSound = useSoundPlayerStore((s) => s.toggleMixSound);
  const setVolume = useSoundPlayerStore((s) => s.setVolume);
  const stop = useSoundPlayerStore((s) => s.stop);

  const savedMixes = useSoundMixStore((s) => s.items);
  const addMix = useSoundMixStore((s) => s.add);
  const removeMix = useSoundMixStore((s) => s.remove);

  const selectedCount = activeSoundIds.length;
  const canSave = selectedCount >= 2;

  const colors = categoryColors.sound;

  const mixName = useMemo(() => {
    return activeSoundIds
      .map((id) => getSoundById(id)?.name)
      .filter(Boolean)
      .join(' + ');
  }, [activeSoundIds]);

  const applyMix = (mix: SoundMix) => {
    stop();
    mix.soundIds.forEach((id) => {
      toggleMixSound(id);
      const vol = mix.volumes[id];
      if (vol != null) setVolume(id, vol);
    });
  };

  const saveMix = () => {
    if (!canSave) return;
    const now = nowIso();
    const mixVolumes: Record<string, number> = {};
    activeSoundIds.forEach((id) => {
      mixVolumes[id] = volumes[id] ?? 0.85;
    });
    addMix({
      id: generateId(),
      name: mixName,
      soundIds: [...activeSoundIds],
      volumes: mixVolumes,
      createdAt: now,
      updatedAt: now,
    });
    showToast('Mix saved', 'options-outline');
  };

  return (
    <Screen>
      <ModuleHeader illustration="sounds" title="Mix Sounds" subtitle="Combine ambient sounds into your own blend" />

      <Text style={styles.sectionTitle}>Your Mixes</Text>
      {savedMixes.length === 0 ? (
        <EmptyState
          illustration="sounds"
          title="No saved mixes yet"
          message="Select two or more sounds below, then save your blend to replay it anytime."
        />
      ) : (
        <Card padded={false} style={{ marginBottom: spacing.xl }}>
          {savedMixes.map((mix, i) => (
            <View key={mix.id} style={[styles.mixRow, i < savedMixes.length - 1 && styles.mixRowBorder]}>
              <Pressable style={styles.mixRowMain} onPress={() => applyMix(mix)}>
                <View style={[styles.mixIconWrap, { backgroundColor: colors.bg }]}>
                  <Ionicons name="options-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mixName} numberOfLines={1}>
                    {mix.name}
                  </Text>
                  <Text style={styles.mixMeta}>{mix.soundIds.length} sounds · tap to play</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => setDeleteId(mix.id)} hitSlop={10}>
                <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
              </Pressable>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Choose sounds to combine</Text>
        {selectedCount > 0 && <Text style={styles.selectedCount}>{selectedCount} selected</Text>}
      </View>

      <Card padded={false} style={{ marginBottom: spacing.xl }}>
        {MIXABLE_SOUNDS.map((sound, i) => {
          const isSelected = activeSoundIds.includes(sound.id);
          return (
            <View key={sound.id} style={i < MIXABLE_SOUNDS.length - 1 && styles.mixRowBorder}>
              <Pressable style={styles.selectRow} onPress={() => toggleMixSound(sound.id)}>
                <View style={[styles.checkbox, isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  {isSelected && <Ionicons name="checkmark" size={14} color={palette.white} />}
                </View>
                <View style={[styles.mixIconWrap, { backgroundColor: colors.bg }]}>
                  <SoundIllustration variant={sound.illustration} size={20} />
                </View>
                <Text style={styles.selectLabel}>{sound.name}</Text>
              </Pressable>
              {isSelected && (
                <View style={styles.volumeRow}>
                  <Ionicons name="volume-medium-outline" size={16} color={palette.textFaint} />
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={1}
                    value={volumes[sound.id] ?? 0.85}
                    onValueChange={(v: number) => setVolume(sound.id, v)}
                    minimumTrackTintColor={colors.accent}
                    maximumTrackTintColor={palette.border}
                    thumbTintColor={colors.accent}
                    accessibilityLabel={`${sound.name} volume`}
                  />
                </View>
              )}
            </View>
          );
        })}
      </Card>

      <View style={styles.actionRow}>
        <Button label="Stop mix" variant="secondary" onPress={stop} disabled={selectedCount === 0} style={{ flex: 1 }} />
        <Button label="Save as Mix" icon="heart" onPress={saveMix} disabled={!canSave} style={{ flex: 1 }} />
      </View>
      {isMixMode && <Text style={styles.playingHint}>Playing: {mixName}</Text>}

      <ConfirmDialog
        visible={!!deleteId}
        title="Delete this mix?"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) removeMix(deleteId);
          setDeleteId(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
    marginBottom: spacing.md,
  },
  selectedCount: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: categoryColors.sound.accent,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  mixRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mixRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  mixIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mixName: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  mixMeta: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 1,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
    flex: 1,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  playingHint: {
    fontSize: fontSize.sm,
    color: categoryColors.sound.accent,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
