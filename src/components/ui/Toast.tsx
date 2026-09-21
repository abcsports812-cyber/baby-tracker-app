import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { create } from 'zustand';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, radius, shadow, spacing, fontSize } from '../../theme';

interface ToastState {
  visible: boolean;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  show: (message: string, icon?: keyof typeof Ionicons.glyphMap) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  icon: 'checkmark-circle',
  show: (message, icon = 'checkmark-circle') => set({ visible: true, message, icon }),
  hide: () => set({ visible: false }),
}));

export function showToast(message: string, icon?: keyof typeof Ionicons.glyphMap) {
  useToastStore.getState().show(message, icon);
}

export function ToastHost() {
  const { visible, message, icon, hide } = useToastStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(hide, 2200);
    return () => clearTimeout(timer);
  }, [visible, hide]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp}
      style={[styles.toast, shadow.card, { top: insets.top + spacing.sm }]}
    >
      <Ionicons name={icon} size={18} color={palette.primaryPinkDark} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
});
