import {
  useActiveBabyIdStore,
  useBabyProfileStore,
  useBabyProfilesStore,
  useLegacyDefaultBabyIdStore,
  useSettingsStore,
} from '../store';

export function useAppReady(): boolean {
  const legacyProfileHydrated = useBabyProfileStore((s) => s.hydrated);
  const profilesHydrated = useBabyProfilesStore((s) => s.hydrated);
  const activeBabyIdHydrated = useActiveBabyIdStore((s) => s.hydrated);
  const legacyDefaultBabyIdHydrated = useLegacyDefaultBabyIdStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  return (
    legacyProfileHydrated &&
    profilesHydrated &&
    activeBabyIdHydrated &&
    legacyDefaultBabyIdHydrated &&
    settingsHydrated
  );
}
