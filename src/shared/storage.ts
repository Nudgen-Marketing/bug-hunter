import type { ProgressionData } from './progression';
import { normalizeProgression } from './progression';
import {
  hasExtensionApi,
  storageGet,
  storageSet,
} from './webextension';

const STORAGE_KEY = 'bug_hunter_progression_v1';

let memoryProgression: ProgressionData | null = null;

export async function readProgression(): Promise<ProgressionData> {
  if (memoryProgression) return memoryProgression;

  const raw = hasExtensionApi()
    ? await storageGet<Partial<ProgressionData>>(STORAGE_KEY)
    : undefined;
  memoryProgression = normalizeProgression(raw);
  return memoryProgression;
}

export async function writeProgression(next: ProgressionData): Promise<void> {
  memoryProgression = normalizeProgression(next);
  if (hasExtensionApi()) {
    await storageSet(STORAGE_KEY, memoryProgression);
  }
}

export async function refreshProgressionFromStorage(): Promise<ProgressionData> {
  memoryProgression = null;
  return readProgression();
}
