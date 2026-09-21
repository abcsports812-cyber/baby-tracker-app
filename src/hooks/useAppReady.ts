import { useBabyProfileStore, useSettingsStore } from '../store';

export function useAppReady(): boolean {
  const profileHydrated = useBabyProfileStore((s) => s.hydrated);
  const settingsHydrated = useSettingsStore((s) => s.hydrated);
  return profileHydrated && settingsHydrated;
}
