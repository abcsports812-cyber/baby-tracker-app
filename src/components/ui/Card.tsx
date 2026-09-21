import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { palette, radius, shadow, spacing } from '../../theme';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
  elevated?: boolean;
}

export function Card({ children, onPress, style, padded = true, elevated = true }: Props) {
  const content = (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9, transform: [{ scale: 0.995 }] }}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
  },
  padded: {
    padding: spacing.lg,
  },
});
