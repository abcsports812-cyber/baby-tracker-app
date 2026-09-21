import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SingletonState<T> {
  value: T;
  hydrated: boolean;
  set: (value: T) => void;
  patch: (partial: Partial<T>) => void;
}

export type SingletonStore<T> = UseBoundStore<StoreApi<SingletonState<T>>>;

export function createSingletonStore<T>(name: string, initial: T): SingletonStore<T> {
  const useStore = create<SingletonState<T>>()(
    persist(
      (set, get) => ({
        value: initial,
        hydrated: false,
        set: (value) => set({ value }),
        patch: (partial) => set({ value: { ...get().value, ...partial } }),
      }),
      {
        name: `babytracker:${name}`,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (s) => ({ value: s.value } as SingletonState<T>),
      }
    )
  );

  useStore.persist.onFinishHydration(() => useStore.setState({ hydrated: true }));
  if (useStore.persist.hasHydrated()) {
    useStore.setState({ hydrated: true });
  }

  return useStore;
}
