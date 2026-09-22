import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';
import type { SleepTimerMinutes } from '../../store/soundPlayer';

const PRESETS: { label: string; minutes: SleepTimerMinutes }[] = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
  { label: '90 min', minutes: 90 },
  { label: 'Continuous', minutes: null },
];

interface Props {
  visible: boolean;
  activeMinutes: SleepTimerMinutes;
  hasActiveTimer: boolean;
  onSelect: (minutes: SleepTimerMinutes) => void;
  onCancelTimer: () => void;
  onClose: () => void;
}

export function SleepTimerSheet({ visible, activeMinutes, hasActiveTimer, onSelect, onCancelTimer, onClose }: Props) {
  const colors = categoryColors.sound;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, shadow.card]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Sleep Timer</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={palette.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Gently fade out and stop after the sound plays for a while.</Text>

          <View style={styles.grid}>
            {PRESETS.map((preset) => {
              const isSelected = hasActiveTimer && activeMinutes === preset.minutes;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => onSelect(preset.minutes)}
                  style={[
                    styles.chip,
                    isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  <Text style={[styles.chipLabel, isSelected && { color: palette.white }]}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {hasActiveTimer && (
            <Pressable onPress={onCancelTimer} style={styles.cancelRow}>
              <Ionicons name="close-circle-outline" size={18} color={palette.danger} />
              <Text style={styles.cancelLabel}>Cancel timer</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(91,82,96,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
  },
  cancelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  cancelLabel: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.danger,
  },
});
