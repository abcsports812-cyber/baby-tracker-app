/** Kids' Zikr content — Arabic text, transliteration and meaning only.
 * No audio is attached to these phrases yet; see THIRD_PARTY_AUDIO_LICENSES.md
 * for the status of audio sourcing. Wording must never be altered or
 * invented — these are the standard four tasbih phrases. */
export interface ZikrPhrase {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
}

export const KIDS_ZIKR_PHRASES: ZikrPhrase[] = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliteration: 'SubhanAllah',
    meaning: 'Glory be to Allah',
  },
  {
    id: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliteration: 'Alhamdulillah',
    meaning: 'All praise is due to Allah',
  },
  {
    id: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliteration: 'Allahu Akbar',
    meaning: 'Allah is the Greatest',
  },
  {
    id: 'la-ilaha-illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliteration: 'La ilaha illallah',
    meaning: 'There is no god but Allah',
  },
];
