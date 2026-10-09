import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

/** Reads a one-shot `?openId=<id>` param (set by Home's tappable timeline,
 * see src/lib/timeline.ts) and calls `openEdit` with the matching item from
 * this screen's own (already baby-scoped) `items` list -- once, and only
 * if a match is found. An id for another baby's record, or a stale/deleted
 * id, simply never matches `items` and nothing opens; this is the only
 * safety check needed since `items` is always baby-scoped before it
 * reaches this hook. */
export function useAutoOpenEdit<T extends { id: string }>(items: T[], openEdit: (item: T) => void) {
  const params = useLocalSearchParams<{ openId?: string }>();
  const pendingId = useRef(params.openId ?? null);

  useEffect(() => {
    if (!pendingId.current) return;
    const match = items.find((i) => i.id === pendingId.current);
    if (match) {
      pendingId.current = null;
      openEdit(match);
    }
  }, [items, openEdit]);
}
