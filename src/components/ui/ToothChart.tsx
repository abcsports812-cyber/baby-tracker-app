import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryColors, fontSize, palette, radius, spacing } from '../../theme';
import { toothPositionLabel, toothTypeShortLabel, toothSlotLabel, TOOTH_CHART, type ToothSlot } from '../../lib/teeth';
import { toothStatusLabel } from '../../lib/labels';
import type { ToothRecord, ToothStatus } from '../../types/models';

const UPPER_ROW: ToothSlot['position'][] = ['upperLeft', 'upperRight'];
const LOWER_ROW: ToothSlot['position'][] = ['lowerLeft', 'lowerRight'];

const colors = categoryColors.teeth;

interface StatusVisual {
  toothIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  toothColor: string;
  badge?: { icon: keyof typeof Ionicons.glyphMap; color: string };
}

/** Status is always conveyed through a distinct tooth-shape/badge
 * combination and the accessibility label text — never through fill
 * color alone. A tooth silhouette (MaterialCommunityIcons — already part
 * of the @expo/vector-icons package used for every Ionicons icon in the
 * app, so no new dependency) reads as an actual tooth rather than a
 * generic status dot. */
function statusVisual(status: ToothStatus): StatusVisual {
  switch (status) {
    case 'notErupted':
      return { toothIcon: 'tooth-outline', toothColor: palette.textFaint };
    case 'emerging':
      return { toothIcon: 'tooth-outline', toothColor: colors.accent, badge: { icon: 'time', color: colors.accent } };
    case 'erupted':
      return { toothIcon: 'tooth', toothColor: colors.accent, badge: { icon: 'checkmark', color: colors.accent } };
    case 'lost':
      return { toothIcon: 'tooth-outline', toothColor: palette.textFaint, badge: { icon: 'close', color: palette.textFaint } };
  }
}

interface ToothCellProps {
  slot: ToothSlot;
  record?: ToothRecord;
  dimmed: boolean;
  onPress: () => void;
}

function ToothCell({ slot, record, dimmed, onPress }: ToothCellProps) {
  const status = record?.status ?? 'notErupted';
  const visual = statusVisual(status);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${toothSlotLabel(slot)}, ${toothStatusLabel[status]}`}
      style={[styles.cell, dimmed && styles.cellDimmed]}
    >
      <View style={styles.toothWrap}>
        <MaterialCommunityIcons name={visual.toothIcon} size={26} color={visual.toothColor} />
        {visual.badge && (
          <View style={[styles.statusBadge, { backgroundColor: visual.badge.color }]}>
            <Ionicons name={visual.badge.icon} size={8} color={palette.white} />
          </View>
        )}
      </View>
      <Text style={styles.cellLabel} numberOfLines={1}>
        {toothTypeShortLabel[slot.type]}
      </Text>
    </Pressable>
  );
}

function QuadrantCard({
  position,
  records,
  filter,
  onPressTooth,
}: {
  position: ToothSlot['position'];
  records: Record<string, ToothRecord | undefined>;
  filter: 'all' | ToothStatus;
  onPressTooth: (slotId: string) => void;
}) {
  const slots = TOOTH_CHART.filter((s) => s.position === position);
  return (
    <View style={styles.quadrant}>
      <Text style={styles.quadrantTitle}>{toothPositionLabel[position]}</Text>
      <View style={styles.quadrantRow}>
        {slots.map((slot) => {
          const record = records[slot.id];
          const status = record?.status ?? 'notErupted';
          const dimmed = filter !== 'all' && filter !== status;
          return <ToothCell key={slot.id} slot={slot} record={record} dimmed={dimmed} onPress={() => onPressTooth(slot.id)} />;
        })}
      </View>
    </View>
  );
}

interface ToothChartProps {
  records: Record<string, ToothRecord | undefined>;
  filter: 'all' | ToothStatus;
  onPressTooth: (slotId: string) => void;
}

export function ToothChart({ records, filter, onPressTooth }: ToothChartProps) {
  return (
    <View>
      <View style={styles.archRow}>
        {UPPER_ROW.map((position) => (
          <QuadrantCard key={position} position={position} records={records} filter={filter} onPressTooth={onPressTooth} />
        ))}
      </View>
      <View style={styles.archRow}>
        {LOWER_ROW.map((position) => (
          <QuadrantCard key={position} position={position} records={records} filter={filter} onPressTooth={onPressTooth} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  archRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quadrant: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  quadrantTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  quadrantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    gap: 3,
  },
  cellDimmed: {
    opacity: 0.3,
  },
  toothWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: palette.textSecondary,
  },
});
