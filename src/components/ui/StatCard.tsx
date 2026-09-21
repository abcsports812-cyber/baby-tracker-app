import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CategoryKey } from '../../theme';
import { categoryColors, fontSize, palette, radius, shadow, spacing } from '../../theme';

interface Props {
  category: CategoryKey;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  subtitle?: string;
  onPress?: () => void;
  onPressAdd?: () => void;
}

export function StatCard({ category, icon, title, value, subtitle, onPress, onPressAdd }: Props) {
  const colors = categoryColors[category];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, shadow.soft, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.bg }]}>
          <Ionicons name={icon} size={18} color={colors.accent} />
        </View>
        {onPressAdd && (
          <Pressable
            onPress={onPressAdd}
            hitSlop={8}
            style={[styles.addBtn, { backgroundColor: colors.bg }]}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
          </Pressable>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexBasis: '47%',
    flexGrow: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  value: {
    fontSize: fontSize.xl,
    color: palette.text,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: 2,
  },
});
