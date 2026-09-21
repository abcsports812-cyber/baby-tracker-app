import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryKey } from '../../theme';
import { categoryColors, fontSize, palette, radius, spacing } from '../../theme';

interface Props {
  category: CategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  time?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export function RecordRow({ category, icon, title, subtitle, time, onPress, onDelete }: Props) {
  const colors = categoryColors[category];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && onPress && { opacity: 0.85 }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {time && <Text style={styles.time}>{time}</Text>}
      {onDelete && (
        <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={palette.textFaint} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 1,
  },
  time: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
  deleteBtn: {
    marginLeft: spacing.xs,
    padding: 4,
  },
});
