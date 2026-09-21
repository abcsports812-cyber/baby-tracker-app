import { StyleSheet, Text, View } from 'react-native';
import { palette, fontSize, spacing } from '../../theme';
import { IllustrationBadge } from './IllustrationBadge';
import { Button } from './Button';
import type { IllustrationKey } from '../../theme/illustrations';

interface Props {
  illustration: IllustrationKey;
  title: string;
  message: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}

export function EmptyState({ illustration, title, message, ctaLabel, onPressCta }: Props) {
  return (
    <View style={styles.wrap}>
      <IllustrationBadge name={illustration} size={104} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {ctaLabel && onPressCta && (
        <Button label={ctaLabel} onPress={onPressCta} icon="add" style={{ marginTop: spacing.lg }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: palette.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
});
