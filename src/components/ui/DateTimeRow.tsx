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

export function DateTimeRow({ value, onChange, maximumDate }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <DateTimeField
          label="Date"
          value={value}
          mode="date"
          maximumDate={maximumDate}
          onChange={(d) => onChange(mergeDatePart(value, d))}
        />
      </View>
      <View style={{ flex: 1 }}>
        <DateTimeField label="Time" value={value} mode="time" onChange={(t) => onChange(mergeTimePart(value, t))} />
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
