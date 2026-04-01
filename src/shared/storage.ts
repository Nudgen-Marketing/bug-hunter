import type { ProgressionData } from './progression';
import { normalizeProgression } from './progression';

const STORAGE_KEY = 'bug_hunter_progression_v1';

let memoryProgression: ProgressionData | null = null;

function hasChromeStorage(): boolean {
  return typeof chrome !== 'undefined'
    && !!chrome.storage
    && !!chrome.storage.local
    && typeof chrome.storage.local.get === 'function';
}

function storageGet<T>(key: string): Promise<T | undefined> {
  if (!hasChromeStorage()) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] as T | undefined);
    });
  });
}

function storageSet<T>(key: string, value: T): Promise<void> {
  if (!hasChromeStorage()) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

export async function readProgression(): Promise<ProgressionData> {
  if (memoryProgression) return memoryProgression;

  const raw = await storageGet<Partial<ProgressionData>>(STORAGE_KEY);
  memoryProgression = normalizeProgression(raw);
  return memoryProgression;
}

export async function writeProgression(next: ProgressionData): Promise<void> {
  memoryProgression = normalizeProgression(next);
  await storageSet(STORAGE_KEY, memoryProgression);
}

export async function refreshProgressionFromStorage(): Promise<ProgressionData> {
  memoryProgression = null;
  return readProgression();
}
