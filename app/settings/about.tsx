import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
import { fontSize, palette, spacing } from '../../src/theme';

export default function AboutScreen() {
  return (
    <Screen>
      <ModuleHeader illustration="settings" title="About" />

      <View style={styles.brand}>
        <IllustrationBadge name="home" size={72} />
        <Text style={styles.appName}>Baby Tracker</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <Card>
        <Text style={styles.body}>
          Baby Tracker is a calm, beautifully organized place to log feeding, sleep, diapers, growth, milestones, health and
          the everyday moments of your baby’s first years. Everything you record stays private on your device.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: palette.text,
    marginTop: spacing.sm,
  },
  version: {
    fontSize: fontSize.sm,
    color: palette.textFaint,
  },
  body: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    lineHeight: 21,
  },
});
