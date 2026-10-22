import { StyleSheet, View } from 'react-native';
import { mergeDatePart, mergeTimePart } from '../../lib/date';
import { spacing } from '../../theme';
import { DateTimeField } from './DateTimeField';

interface Props {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
}

export function DateTimeRow({ label, value, onChange, maximumDate }: Props) {
  // `label` (e.g. "Start"/"End") used to be accepted but silently ignored,
  // so two DateTimeRows in the same form -- like Sleep's start/end pair --
  // both rendered as plain, identical-looking "Date"/"Time" fields with no
  // way to tell which was which. Folding it into each field's own label
  // keeps every existing single-row caller (none of which pass `label`)
  // unchanged.
  const dateLabel = label ? `${label} Date` : 'Date';
  const timeLabel = label ? `${label} Time` : 'Time';
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <DateTimeField
          label={dateLabel}
          value={value}
          mode="date"
          maximumDate={maximumDate}
          onChange={(d) => onChange(mergeDatePart(value, d))}
        />
      </View>
      <View style={{ flex: 1 }}>
        <DateTimeField label={timeLabel} value={value} mode="time" onChange={(t) => onChange(mergeTimePart(value, t))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
