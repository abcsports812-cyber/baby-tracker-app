import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, radius, shadow, spacing } from '../../theme';
import type { ZikrPhrase } from '../../data/zikr';

interface Props {
  phrase: ZikrPhrase;
}

/** A Kids' Zikr phrase card. Shows the phrase only — no working play
 * control — until a real, legally cleared recording is available. */
export function ZikrCard({ phrase }: Props) {
  return (
    <View style={[styles.card, shadow.soft]}>
      <View style={styles.badge}>
        <Ionicons name="time-outline" size={12} color={palette.primaryPinkDark} />
        <Text style={styles.badgeText}>Audio coming soon</Text>
      </View>

      <Text style={styles.arabic}>{phrase.arabic}</Text>
      <Text style={styles.transliteration}>{phrase.transliteration}</Text>
      <Text style={styles.meaning}>{phrase.meaning}</Text>

      <View style={styles.playRow}>
        <View style={styles.playBtnDisabled}>
          <Ionicons name="play" size={16} color={palette.textFaint} />
        </View>
        <Text style={styles.playHint}>Narration not available yet</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: palette.softPink,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.primaryPinkDark,
  },
  arabic: {
    fontSize: 34,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
  },
  transliteration: {
    fontSize: fontSize.md,
    fontWeight: '800',
    color: palette.primaryPinkDark,
    textAlign: 'center',
  },
  meaning: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  playBtnDisabled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playHint: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
});
