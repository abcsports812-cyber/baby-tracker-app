import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../src/components/ui/Screen';
import { ModuleHeader } from '../../src/components/ui/ModuleHeader';
import { Button } from '../../src/components/ui/Button';
import { SoundCard } from '../../src/components/sounds/SoundCard';
import { SoundChip } from '../../src/components/sounds/SoundChip';
import { FEATURED_SOUND_IDS, SOUNDS, getSoundById } from '../../src/data/sounds';
import { useFavoriteSoundsStore, useRecentSoundsStore } from '../../src/store';
import { useSoundPlayerStore, useSoundSheetStore } from '../../src/store/soundPlayer';
import { categoryColors, fontSize, palette, radius, spacing } from '../../src/theme';

export default function SoundsScreen() {
  const activeSoundIds = useSoundPlayerStore((s) => s.activeSoundIds);
  const isPlaying = useSoundPlayerStore((s) => s.isPlaying);
  const playSingle = useSoundPlayerStore((s) => s.playSingle);
  const togglePlayPause = useSoundPlayerStore((s) => s.togglePlayPause);

  const favorites = useFavoriteSoundsStore((s) => s.value);
  const setFavorites = useFavoriteSoundsStore((s) => s.set);
  const recent = useRecentSoundsStore((s) => s.value);

  const openSheet = useSoundSheetStore((s) => s.open);

  const featured = useMemo(() => FEATURED_SOUND_IDS.map((id) => getSoundById(id)!).filter(Boolean), []);
  const allIds = useMemo(() => SOUNDS.map((s) => s.id), []);
  const favoriteSounds = useMemo(() => favorites.map((id) => getSoundById(id)).filter(Boolean) as typeof SOUNDS, [favorites]);
  const recentSounds = useMemo(
    () => recent.map((e) => getSoundById(e.soundId)).filter(Boolean) as typeof SOUNDS,
    [recent]
  );

  const isFavorite = (id: string) => favorites.includes(id);
  const toggleFavorite = (id: string) => {
    setFavorites(isFavorite(id) ? favorites.filter((f) => f !== id) : [...favorites, id]);
  };

  const handleCardPress = (id: string) => {
    openSheet(id, allIds);
  };

  const handleCardTogglePlay = (id: string) => {
    if (activeSoundIds.includes(id)) {
      togglePlayPause();
    } else {
      playSingle(id);
    }
  };

  const handleChipPress = (id: string) => {
    if (!activeSoundIds.includes(id)) playSingle(id);
    openSheet(id, allIds);
  };

  return (
    <Screen>
      <ModuleHeader
        illustration="sounds"
        title="Sounds"
        subtitle="Gentle sounds to help your little one relax and sleep"
        rightAction={<Button label="Mix" icon="options-outline" size="sm" variant="secondary" onPress={() => router.push('/sounds/mix')} />}
      />

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Favorites</Text>
      </View>
      {favoriteSounds.length === 0 ? (
        <Text style={styles.emptyHint}>No favorites yet. Tap the heart on a sound to save it here.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {favoriteSounds.map((sound) => (
              <SoundChip
                key={sound.id}
                sound={sound}
                isActive={activeSoundIds.includes(sound.id)}
                isPlaying={isPlaying}
                onPress={() => handleChipPress(sound.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
      </View>
      {recentSounds.length === 0 ? (
        <Text style={styles.emptyHint}>No recently played sounds yet.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {recentSounds.map((sound) => (
              <SoundChip
                key={sound.id}
                sound={sound}
                isActive={activeSoundIds.includes(sound.id)}
                isPlaying={isPlaying}
                onPress={() => handleChipPress(sound.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Sleep & Soothe</Text>
      </View>
      <View style={styles.grid}>
        {featured.map((sound) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            isActive={activeSoundIds.includes(sound.id)}
            isPlaying={isPlaying}
            isFavorite={isFavorite(sound.id)}
            onPress={() => handleCardPress(sound.id)}
            onTogglePlay={() => handleCardTogglePlay(sound.id)}
            onToggleFavorite={() => toggleFavorite(sound.id)}
          />
        ))}
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>All Sounds</Text>
      </View>
      <View style={styles.grid}>
        {SOUNDS.map((sound) => (
          <SoundCard
            key={sound.id}
            sound={sound}
            isActive={activeSoundIds.includes(sound.id)}
            isPlaying={isPlaying}
            isFavorite={isFavorite(sound.id)}
            onPress={() => handleCardPress(sound.id)}
            onTogglePlay={() => handleCardTogglePlay(sound.id)}
            onToggleFavorite={() => toggleFavorite(sound.id)}
          />
        ))}
      </View>

      <View style={[styles.mixBanner, { backgroundColor: categoryColors.sound.bg }]}>
        <Text style={styles.mixBannerTitle}>Mix Sounds</Text>
        <Text style={styles.mixBannerBody}>Combine ambient sounds like Rain + Shushing or Heartbeat + Womb, and save your favorite blend.</Text>
        <Button label="Create a mix" icon="options-outline" size="sm" onPress={() => router.push('/sounds/mix')} style={{ alignSelf: 'flex-start', marginTop: spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: palette.text,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: palette.textFaint,
    marginBottom: spacing.xl,
  },
  chipScroll: {
    marginBottom: spacing.xl,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  mixBanner: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  mixBannerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: categoryColors.sound.text,
  },
  mixBannerBody: {
    fontSize: fontSize.sm,
    color: categoryColors.sound.text,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
});
