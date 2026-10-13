import { Ionicons } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { computeFocusScrollOffset } from '../../lib/keyboardScroll';
import { fontSize, palette, radius, shadow, spacing } from '../../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  children: React.ReactNode;
}

type MeasurableInput = {
  measureLayout: (
    relativeToNativeComponentRef: any,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail: () => void,
  ) => void;
} | null;

const FormSheetScrollContext = createContext<((input: MeasurableInput) => void) | null>(null);

/** Used by FormField (and any other input rendered inside a FormSheet) to
 * scroll itself into view on focus. See the note above `scrollInputIntoView`
 * for why this exists instead of relying on KeyboardAvoidingView/ScrollView's
 * own built-in keyboard handling. */
export function useFormSheetFocusScroll(): ((input: MeasurableInput) => void) | null {
  return useContext(FormSheetScrollContext);
}

export function FormSheet({ visible, title, onClose, onSave, saveLabel = 'Save', saveDisabled, children }: Props) {
  // react-native's Modal renders edge-to-edge, outside any parent
  // SafeAreaView's view-tree adjustment, so the sheet's own bottom padding
  // never otherwise accounts for the Android system nav bar / gesture
  // area -- its Save button can end up sitting under it. Only Android
  // needs the extra reservation added here; iOS already gets safe
  // bottom spacing from the existing `spacing.xl` constant.
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const innerViewRef = useRef<View>(null);
  const scrollOffsetRef = useRef(0);

  // Content inside react-native's Android `Modal` lives in its own native
  // Dialog window, separate from the Activity. The `Keyboard` module's
  // `keyboardDidShow`/`keyboardDidHide` events -- which `KeyboardAvoidingView`
  // and `ScrollView`'s own auto-scroll both depend on -- are only emitted
  // from the Activity's root view (confirmed in react-native's
  // ReactRootView.java: the listener is registered on the Activity's own
  // root view, and Modal's content is a separate DialogRootViewGroup with
  // no equivalent listener of its own). That's why switching
  // `KeyboardAvoidingView`'s `behavior` prop had no effect: the event it
  // reacts to doesn't reliably reach a sheet rendered inside this Modal on
  // Android. So each focused field scrolls itself into view directly,
  // using a measured layout instead of waiting on that event.
  //
  // That measured layout must be taken relative to an actual component
  // *ref*, not a numeric node handle: this app runs on the New Architecture
  // (Fabric -- `newArchEnabled=true`), where every host ref is a
  // `ReactNativeElement`. Its `measureLayout` (see react-native's
  // ReactNativeElement.js) does `if (!(relativeToNativeNode instanceof
  // ReactNativeElement)) return;` *before* calling either callback --
  // silently, since the dev-only warning for that branch is stripped from
  // a release build. `ScrollView.getInnerViewNode()` returns a legacy
  // `findNodeHandle()` number, which fails that check every time, so the
  // first version of this fix never actually scrolled anything: the
  // success callback below was never reached. `innerViewRef` (passed to
  // the ScrollView below) gives the real element instead.
  const scrollInputIntoView = useCallback((input: MeasurableInput) => {
    if (!input || Platform.OS !== 'android') {
      return;
    }
    const scrollView = scrollRef.current;
    const innerView = innerViewRef.current;
    if (!scrollView || !innerView) {
      return;
    }
    input.measureLayout(
      innerView,
      (_x, y) => {
        const target = computeFocusScrollOffset({
          inputTop: y,
          currentScrollOffset: scrollOffsetRef.current,
        });
        if (target != null) {
          scrollView.scrollTo({ y: target, animated: true });
        }
      },
      () => {},
    );
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          // 'padding' on iOS reliably shrinks the sheet to the visible
          // space, since iOS keyboard notifications aren't window-scoped.
          // 'height' on Android is kept as a harmless best-effort fallback
          // for whatever devices it does work on, but it isn't what
          // actually fixes the keyboard covering a field here -- see
          // `scrollInputIntoView` above for the real fix and why this
          // alone can't be trusted on Android.
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheetWrap}
        >
          <View style={[styles.sheet, shadow.card, Platform.OS === 'android' && { paddingBottom: spacing.lg + insets.bottom }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={palette.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              ref={scrollRef}
              innerViewRef={innerViewRef as unknown as React.RefObject<View>}
              style={styles.body}
              contentContainerStyle={{ paddingBottom: spacing.xl }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={32}
            >
              <FormSheetScrollContext.Provider value={scrollInputIntoView}>{children}</FormSheetScrollContext.Provider>
            </ScrollView>
            <View style={styles.footer}>
              <Button label={saveLabel} onPress={onSave} disabled={saveDisabled} fullWidth size="lg" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(91,82,96,0.35)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: palette.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    // Bounds the sheet to its already-90%-capped wrapper and actually
    // clips/contains overflow instead of letting it grow past that bound
    // on web — combined with the ScrollView's `flexShrink`/`minHeight: 0`
    // below, a form taller than the available space scrolls internally
    // instead of pushing the footer's Save button off-screen.
    maxHeight: '100%',
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
