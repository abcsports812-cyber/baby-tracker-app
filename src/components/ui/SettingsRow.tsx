import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, radius, spacing } from '../../theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  showChevron?: boolean;
}

export function SettingsRow({ icon, label, value, onPress, danger, showChevron = true }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={[styles.iconWrap, danger && { backgroundColor: '#FDE4E8' }]}>
        <Ionicons name={icon} size={17} color={danger ? palette.danger : palette.primaryPinkDark} />
      </View>
      <Text style={[styles.label, danger && { color: palette.danger }]}>{label}</Text>
      {value && <Text style={styles.value}>{value}</Text>}
      {onPress && showChevron && <Ionicons name="chevron-forward" size={16} color={palette.textFaint} />}
    </Pressable>
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: palette.softPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: palette.text,
  },
  value: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
  },
});
