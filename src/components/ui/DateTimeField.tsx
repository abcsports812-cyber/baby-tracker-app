import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { fontSize, palette, radius, spacing } from '../../theme';
import { formatDate, formatTime } from '../../lib/date';

interface Props {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  maximumDate?: Date;
}

export function DateTimeField({ label, value, onChange, mode = 'date', maximumDate }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={palette.primaryPinkDark} />
        <Text style={styles.value}>{mode === 'date' ? formatDate(value) : formatTime(value)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={maximumDate}
          onChange={(event, selected) => {
            setOpen(Platform.OS === 'ios');
            if (event.type === 'dismissed') {
              setOpen(false);
              return;
            }
            if (selected) onChange(selected);
            if (Platform.OS === 'android') setOpen(false);
          }}
        />
      )}
      {open && Platform.OS === 'ios' && (
        <Pressable style={styles.doneBtn} onPress={() => setOpen(false)}>
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: palette.border,
  },
  value: {
    fontSize: fontSize.md,
    color: palette.text,
    fontWeight: '600',
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  doneLabel: {
    color: palette.primaryPinkDark,
    fontWeight: '700',
  },
});
