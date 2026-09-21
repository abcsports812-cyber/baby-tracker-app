import AsyncStorage from '@react-native-async-storage/async-storage';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BaseRecord {
  id: string;
}

interface CollectionState<T extends BaseRecord> {
  items: T[];
  hydrated: boolean;
  add: (item: T) => void;
  update: (id: string, patch: Partial<T>) => void;
  remove: (id: string) => void;
  setAll: (items: T[]) => void;
}

export type CollectionStore<T extends BaseRecord> = UseBoundStore<StoreApi<CollectionState<T>>>;

export function createCollectionStore<T extends BaseRecord>(name: string): CollectionStore<T> {
  const useStore = create<CollectionState<T>>()(
    persist(
      (set) => ({
        items: [],
        hydrated: false,
        add: (item) => set((s) => ({ items: [...s.items, item] })),
        update: (id, patch) =>
          set((s) => ({
            items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
          })),
        remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
        setAll: (items) => set({ items }),
      }),
      {
        name: `babytracker:${name}`,
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (s) => ({ items: s.items } as CollectionState<T>),
      }
    )
  );

  useStore.persist.onFinishHydration(() => useStore.setState({ hydrated: true }));
  if (useStore.persist.hasHydrated()) {
    useStore.setState({ hydrated: true });
  }

  return useStore;
}
