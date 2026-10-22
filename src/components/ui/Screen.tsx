import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette, spacing } from '../../theme';
import { KeyboardAwareScrollProvider, useKeyboardAwareScrollRefs } from './KeyboardAwareScroll';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({ children, scroll = true, style, edges = ['top'] }: Props) {
  // Every screen built on Screen (e.g. profile/baby details) that isn't a
  // FormSheet modal goes through here -- see KeyboardAwareScroll.tsx for
  // why a focused field needs this rather than relying on
  // ScrollView/KeyboardAvoidingView alone to stay clear of the Android
  // keyboard.
  const { scrollRef, innerViewRef, scrollInputIntoView, onScroll } = useKeyboardAwareScrollRefs();

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            ref={scrollRef}
            innerViewRef={innerViewRef as unknown as React.RefObject<View>}
            style={styles.flex}
            contentContainerStyle={[styles.content, style]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScroll={onScroll}
            scrollEventThrottle={32}
          >
            <KeyboardAwareScrollProvider value={scrollInputIntoView}>{children}</KeyboardAwareScrollProvider>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.flex, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl * 2,
  },
});
