import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { fontSize, palette } from '../../src/theme';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ModuleHeader illustration="settings" title="Privacy Policy" />
      <Card>
        <Text style={styles.body}>
          Baby Tracker stores all information you enter — your baby’s profile, feeding, diaper, sleep, growth, milestone,
          health, appointment, reminder, memory, note and caregiver records — locally on this device only.{'\n\n'}
          No account is required, and no data is transmitted to any server or third party by this app. Photos you attach to
          memories, milestones or profiles are also kept on-device.{'\n\n'}
          Notifications for reminders and appointments are scheduled locally using your device’s operating system and are
          never sent through an external service.{'\n\n'}
          If you delete the app or clear its data, all information stored by Baby Tracker is permanently removed.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    lineHeight: 21,
  },
});
