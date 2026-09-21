import { StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, radius, spacing } from '../../theme';

export interface BarPoint {
  label: string;
  value: number;
}

interface Props {
  data: BarPoint[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = palette.mintDark, height = 140 }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={[styles.row, { height }]}>
      {data.map((d, i) => (
        <View key={i} style={styles.col}>
          <Text style={styles.value}>{d.value > 0 ? d.value : ''}</Text>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.bar,
                {
                  height: Math.max((d.value / max) * (height - 44), d.value > 0 ? 6 : 2),
                  backgroundColor: d.value > 0 ? color : palette.border,
                },
              ]}
            />
          </View>
          <Text style={styles.label}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 16,
    borderRadius: radius.sm,
  },
  value: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
});
