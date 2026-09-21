import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { fontSize, palette } from '../../src/theme';

export default function TermsScreen() {
  return (
    <Screen>
      <ModuleHeader illustration="settings" title="Terms of Use" />
      <Card>
        <Text style={styles.body}>
          Baby Tracker is provided for personal, non-commercial record keeping of your own baby’s care and development.{'\n\n'}
          The app is offered “as is” without warranty of any kind. Information you enter — including feeding, sleep, growth,
          health and appointment records — is your responsibility to keep accurate and up to date.{'\n\n'}
          Baby Tracker does not provide medical advice, diagnosis or treatment. Always consult a qualified healthcare
          professional for questions about your baby’s health.{'\n\n'}
          By using this app, you agree to use it responsibly and understand that all data is stored locally on your device.
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
