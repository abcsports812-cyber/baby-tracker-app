import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, spacing } from '../../theme';
import { IllustrationBadge } from './IllustrationBadge';
import type { IllustrationKey } from '../../theme/illustrations';

interface Props {
  illustration: IllustrationKey;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ModuleHeader({ illustration, title, subtitle, showBack = true, rightAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        {rightAction}
      </View>
      <View style={styles.contentRow}>
        <IllustrationBadge name={illustration} size={68} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
  },
});
