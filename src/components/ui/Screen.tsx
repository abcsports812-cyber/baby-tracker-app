import { useMemo } from 'react';
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
  // keyboard. On Android specifically, KeyboardAvoidingView's own
  // behavior="height" is no longer used at all (see below) -- it isn't
  // just unnecessary alongside useKeyboardAwareScrollRefs, it actively
  // conflicts with it: both independently listen for the same Activity-level
  // keyboardDidShow/keyboardDidHide events and both then animate overlapping
  // geometry (KeyboardAvoidingView resizes this ScrollView's own parent via
  // LayoutAnimation; useKeyboardAwareScrollRefs separately animates the
  // ScrollView's content), which is what produced the reported shaking.
  const {
    scrollRef,
    innerViewRef,
    scrollInputIntoView,
    clearFocusScroll,
    onScroll,
    onLayout,
    onContentSizeChange,
    extraBottomPadding,
  } = useKeyboardAwareScrollRefs();
  const keyboardAwareApi = useMemo(
    () => ({ scrollIntoView: scrollInputIntoView, clearFocusScroll }),
    [scrollInputIntoView, clearFocusScroll],
  );
  // Reserved extra scroll space (see useKeyboardAwareScrollRefs) must be
  // *added* to whatever bottom padding this screen already has, not
  // override it -- a caller's own `style` prop can set its own
  // paddingBottom, so that takes precedence over the default here.
  const basePaddingBottom = (style?.paddingBottom as number | undefined) ?? styles.content.paddingBottom;

  const scrollContent = (
    <ScrollView
      ref={scrollRef}
      innerViewRef={innerViewRef as unknown as React.RefObject<View>}
      style={styles.flex}
      contentContainerStyle={[styles.content, style, { paddingBottom: basePaddingBottom + extraBottomPadding }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      // Android's native ScrollView auto-scrolls a focused child into view on
      // its own (RN's ReactScrollView, mScrollsChildToFocus defaults to true --
      // see requestChildFocus/requestChildRectangleOnScreen in
      // ReactScrollView.java) independently of useKeyboardAwareScrollRefs,
      // which does the same thing from JS. Both reacting to the same focus/
      // keyboard-resize signal is what produced the reported shaking --
      // disabling the native path leaves useKeyboardAwareScrollRefs as the
      // only system in control, as this prop's own doc comment intends
      // ("useful when you want to control the scroll position
      // programmatically").
      scrollsChildToFocus={Platform.OS === 'android' ? false : undefined}
      onScroll={onScroll}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      scrollEventThrottle={32}
    >
      <KeyboardAwareScrollProvider value={keyboardAwareApi}>{children}</KeyboardAwareScrollProvider>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        Platform.OS === 'ios' ? (
          // iOS keyboard notifications aren't window-scoped (no Modal-reach
          // problem the way Android's are), and 'padding' behavior doesn't
          // run a second, independently-animated resize of this View the
          // way Android's 'height' behavior did -- kept exactly as before.
          <KeyboardAvoidingView style={styles.flex} behavior="padding">
            {scrollContent}
          </KeyboardAvoidingView>
        ) : (
          // Android: no KeyboardAvoidingView at all. useKeyboardAwareScrollRefs
          // (scrollInputIntoView/clearFocusScroll via onFocus/onBlur/
          // onContentSizeChange, wired above) is the only system that reacts
          // to the keyboard here -- see the doc comment on this component.
          <View style={styles.flex}>{scrollContent}</View>
        )
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
