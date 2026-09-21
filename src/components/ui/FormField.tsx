import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { fontSize, palette, radius, spacing } from '../../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  optional?: boolean;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  optional = false,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> (optional)</Text>}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.textFaint}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multiline]}
      />
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
  optional: {
    fontWeight: '400',
    color: palette.textFaint,
  },
  input: {
    backgroundColor: palette.white,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    fontSize: fontSize.md,
    color: palette.text,
    borderWidth: 1,
    borderColor: palette.border,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
});
