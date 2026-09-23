import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
import { SettingsRow } from '../../src/components/ui/SettingsRow';
import { useBabyProfileStore } from '../../src/store';
import { fontSize, palette, spacing } from '../../src/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.xl }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Card padded={false}>{children}</Card>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

export default function MoreScreen() {
  const profile = useBabyProfileStore((s) => s.value);

  return (
    <Screen>
      <View style={styles.header}>
        <IllustrationBadge name="settings" size={56} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>{profile?.name ?? 'Your baby'}’s Baby Tracker</Text>
        </View>
      </View>

      <Section title="Baby">
        <SettingsRow icon="happy" label="Baby profile" onPress={() => router.push('/profile')} />
        <Divider />
        <SettingsRow icon="people" label="Family & caregivers" onPress={() => router.push('/family')} />
      </Section>

      <Section title="Keep track">
        <SettingsRow icon="search" label="Search" onPress={() => router.push('/search')} />
        <Divider />
        <SettingsRow icon="images" label="Journal" onPress={() => router.push('/journal')} />
        <Divider />
        <SettingsRow icon="alarm" label="Reminders" onPress={() => router.push('/reminders')} />
        <Divider />
        <SettingsRow icon="happy" label="Teeth" onPress={() => router.push('/teeth')} />
      </Section>

      <Section title="Preferences">
        <SettingsRow icon="notifications" label="Notifications" onPress={() => router.push('/settings/notifications')} />
        <Divider />
        <SettingsRow icon="options" label="Units" onPress={() => router.push('/settings/units')} />
        <Divider />
        <SettingsRow icon="color-palette" label="Appearance" value="Light" showChevron={false} />
        <Divider />
        <SettingsRow icon="language" label="Language" value="English" showChevron={false} />
      </Section>

      <Section title="App">
        <SettingsRow icon="server" label="Data" onPress={() => router.push('/settings/data')} />
        <Divider />
        <SettingsRow icon="help-circle" label="Help" onPress={() => router.push('/settings/help')} />
        <Divider />
        <SettingsRow icon="information-circle" label="About" onPress={() => router.push('/settings/about')} />
        <Divider />
        <SettingsRow icon="document" label="Terms of use" onPress={() => router.push('/settings/terms')} />
        <Divider />
        <SettingsRow icon="shield-checkmark" label="Privacy policy" onPress={() => router.push('/settings/privacy')} />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: palette.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: palette.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: palette.textSecondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginLeft: spacing.lg + 32 + spacing.md,
  },
});
