import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { IllustrationBadge } from '../../src/components/ui/IllustrationBadge';
import type { IllustrationKey } from '../../src/theme/illustrations';
import { fontSize, palette, radius, shadow, spacing } from '../../src/theme';

interface ModuleTile {
  key: IllustrationKey;
  label: string;
  route: string;
}

const CORE_TRACKERS: ModuleTile[] = [
  { key: 'feeding', label: 'Feeding', route: '/feeding' },
  { key: 'diaper', label: 'Diaper', route: '/diaper' },
  { key: 'sleep', label: 'Sleep', route: '/sleep' },
  { key: 'sounds', label: 'Sounds', route: '/sounds' },
  { key: 'growth', label: 'Growth', route: '/growth' },
  { key: 'guides', label: 'Guides', route: '/guides' },
];

const MORE_TRACKERS: ModuleTile[] = [
  { key: 'pumping', label: 'Pumping', route: '/pumping' },
  { key: 'milestones', label: 'Milestones', route: '/milestones' },
  { key: 'health', label: 'Health', route: '/health' },
  { key: 'doctor', label: 'Appointments', route: '/appointments' },
  { key: 'babyCare', label: 'Baby Care', route: '/babycare' },
  { key: 'activities', label: 'Activities', route: '/activities' },
  { key: 'memories', label: 'Journal', route: '/journal' },
  { key: 'reminders', label: 'Reminders', route: '/reminders' },
  { key: 'teeth', label: 'Teeth', route: '/teeth' },
];

function Tile({ tile }: { tile: ModuleTile }) {
  return (
    <Pressable
      onPress={() => router.push(tile.route as never)}
      style={({ pressed }) => [styles.tile, shadow.soft, pressed && { opacity: 0.9 }]}
    >
      <IllustrationBadge name={tile.key} size={52} />
      <Text style={styles.tileLabel}>{tile.label}</Text>
    </Pressable>
  );
}

export default function TrackScreen() {
  return (
    <Screen>
      <Text style={styles.header}>Track</Text>
      <Text style={styles.subheader}>Everything you log about your baby, in one place.</Text>

      <SectionHeader title="Daily essentials" />
      <View style={styles.grid}>
        {CORE_TRACKERS.map((t) => (
          <Tile key={t.route} tile={t} />
        ))}
      </View>

      <SectionHeader title="More tracking" />
      <View style={styles.grid}>
        {MORE_TRACKERS.map((t) => (
          <Tile key={t.route} tile={t} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: fontSize.xxxl,
    fontWeight: '800',
    color: palette.text,
  },
  subheader: {
    fontSize: fontSize.md,
    color: palette.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  tile: {
    backgroundColor: palette.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    flexBasis: '30%',
    flexGrow: 1,
  },
  tileLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
  },
});
