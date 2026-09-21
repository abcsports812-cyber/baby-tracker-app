import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

export function useAutoOpenAdd(): [boolean, (v: boolean) => void] {
  const params = useLocalSearchParams<{ add?: string }>();
  const [open, setOpen] = useState(() => params.add === '1');

  return [open, setOpen];
}
