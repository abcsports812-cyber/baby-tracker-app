import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { useSettingsStore } from '../../src/store';
import { fontSize, palette, spacing } from '../../src/theme';

export default function NotificationsSettingsScreen() {
  const enabled = useSettingsStore((s) => s.value.notificationsEnabled);
  const patch = useSettingsStore((s) => s.patch);

  return (
    <Screen>
      <ModuleHeader illustration="reminders" title="Notifications" />

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Allow notifications</Text>
            <Text style={styles.desc}>Reminders and appointment alerts will be scheduled on this device.</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={(v) => patch({ notificationsEnabled: v })}
            trackColor={{ true: palette.primaryPink, false: palette.border }}
          />
        </View>
      </Card>

      <Text style={styles.hint}>
        Turning this off will stop new reminders and appointments from scheduling notifications. You can manage individual
        reminders from the Reminders screen.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
  },
  desc: {
    fontSize: fontSize.xs,
    color: palette.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  hint: {
    fontSize: fontSize.xs,
    color: palette.textFaint,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    lineHeight: 16,
  },
});
