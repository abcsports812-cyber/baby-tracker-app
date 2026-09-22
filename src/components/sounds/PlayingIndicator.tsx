import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { fontSize, spacing } from '../../theme';

interface Props {
  color: string;
  label?: string;
}

function Bar({ color, delay }: { color: string; delay: number }) {
  const scale = useSharedValue(0.35);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />;
}

/** Small animated "sound wave" indicator shown whenever a sound is actively
 * playing, so playing state is never communicated by color alone. */
export function PlayingIndicator({ color, label = 'Playing' }: Props) {
  return (
    <View style={styles.row} accessibilityLabel={label}>
      <View style={styles.bars}>
        <Bar color={color} delay={0} />
        <Bar color={color} delay={120} />
        <Bar color={color} delay={240} />
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 14,
  },
  bar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
