import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { fontSize, palette, spacing } from '../../theme';

export interface LinePoint {
  label: string;
  value: number;
}

interface Props {
  data: LinePoint[];
  color?: string;
  unit?: string;
  height?: number;
}

export function LineChart({ data, color = palette.primaryPink, unit = '', height = 160 }: Props) {
  if (data.length === 0) return null;

  const width = 300;
  const paddingX = 28;
  const paddingY = 24;
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = data.length === 1 ? width / 2 : paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((d.value - min) / range) * (height - paddingY * 2);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={palette.border} strokeWidth={1} />
        <Path d={pathD} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={palette.white} stroke={color} strokeWidth={2} />
        ))}
        {points.map((p, i) => (
          <SvgText key={`label-${i}`} x={p.x} y={height - 6} fontSize={9} fill={palette.textFaint} textAnchor="middle">
            {p.label}
          </SvgText>
        ))}
      </Svg>
      <View style={styles.rangeRow}>
        <Text style={styles.rangeText}>
          Low {min}{unit}
        </Text>
        <Text style={styles.rangeText}>
          High {max}{unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rangeText: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    fontWeight: '600',
  },
});
