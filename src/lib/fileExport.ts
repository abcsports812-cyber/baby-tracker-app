import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/** All platform-specific file/share/picker handling lives here — this is
 * the only module in the backup feature that imports expo-file-system,
 * expo-sharing, or expo-document-picker, or touches web-only browser APIs.
 * `backup.ts`/`restore.ts` stay platform-agnostic. The three Expo packages
 * are never actually invoked on web (guarded by `Platform.OS` below) — they
 * ship their own no-op web stubs, so importing them at module scope here is
 * safe on every platform. */

function backupFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `baby-tracker-backup-${stamp}.json`;
}

export interface ExportResult {
  success: boolean;
  error?: string;
}

export async function exportBackupFile(json: string): Promise<ExportResult> {
  try {
    if (Platform.OS === 'web') return exportWeb(json);
    return await exportNative(json);
  } catch {
    // Never surface a raw stack trace to the user.
    return { success: false, error: "Couldn't export your backup. Please try again." };
  }
}

async function exportNative(json: string): Promise<ExportResult> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return { success: false, error: 'Sharing isn’t available on this device.' };
  }

  // A fixed filename (overwritten each export) avoids accumulating stray
  // files in the cache directory across repeated exports.
  const file = new File(Paths.cache, backupFilename());
  file.create({ overwrite: true, intermediates: true });
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export Baby Tracker Backup',
    UTI: 'public.json',
  });

  return { success: true };
}

function exportWeb(json: string): ExportResult {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFilename();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return { success: true };
}

export interface ImportResult {
  canceled: boolean;
  content?: string;
  error?: string;
}

export async function importBackupFile(): Promise<ImportResult> {
  try {
    if (Platform.OS === 'web') return importWeb();
    return await importNative();
  } catch {
    return { canceled: false, error: "Couldn't read that file. Please try again." };
  }
}

async function importNative(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return { canceled: true };

  try {
    const file = new File(result.assets[0].uri);
    const content = await file.text();
    return { canceled: false, content };
  } catch {
    return { canceled: false, error: "Couldn't read that file. Please try again." };
  }
}

/** Browsers give no reliable "the user cancelled the file dialog" event.
 * Returning focus to the window is the closest cross-browser signal —
 * we give the `change` event a short head start, since focus can return
 * slightly before it fires when a file *was* picked. */
const WEB_CANCEL_FOCUS_DELAY_MS = 400;

function importWeb(): Promise<ImportResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    let settled = false;
    const cleanup = () => {
      window.removeEventListener('focus', onFocus);
      input.remove();
    };
    const settle = (result: ImportResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const onFocus = () => {
      setTimeout(() => settle({ canceled: true }), WEB_CANCEL_FOCUS_DELAY_MS);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        settle({ canceled: true });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => settle({ canceled: false, content: String(reader.result ?? '') });
      reader.onerror = () => settle({ canceled: false, error: "Couldn't read that file. Please try again." });
      reader.readAsText(file);
    });

    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}
