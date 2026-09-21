import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Card } from '../../src/components/ui/Card';
import { fontSize, palette, spacing } from '../../src/theme';

const FAQS = [
  {
    q: 'How do I log a feeding, diaper or sleep entry?',
    a: 'Use the Quick actions on Home, or open Track and tap into any tracker. Diaper changes support one-tap logging for speed.',
  },
  {
    q: 'Can I edit or delete something I logged?',
    a: 'Yes — tap any entry in a history list to edit it, or tap the trash icon to delete it (you\'ll be asked to confirm).',
  },
  {
    q: 'Where is my data stored?',
    a: 'Everything is saved privately on this device only. There is no cloud account or sync in this version.',
  },
  {
    q: 'How do reminders work?',
    a: 'Reminders and appointments schedule a local notification on this device if notifications are enabled in Settings.',
  },
  {
    q: 'Can I change units?',
    a: 'Yes, go to More → Units to switch weight between kg/lb and height between cm/in.',
  },
];

export default function HelpScreen() {
  return (
    <Screen>
      <ModuleHeader illustration="settings" title="Help" subtitle="Quick answers to common questions" />

      {FAQS.map((item, i) => (
        <Card key={i} style={{ marginBottom: spacing.md }}>
          <Text style={styles.question}>{item.q}</Text>
          <Text style={styles.answer}>{item.a}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  question: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: palette.text,
    marginBottom: spacing.xs,
  },
  answer: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    lineHeight: 20,
  },
});
