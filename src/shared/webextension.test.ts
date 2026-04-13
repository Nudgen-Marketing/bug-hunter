import { describe, expect, it } from 'vitest';
import { isProtectedPageUrl } from './webextension';

describe('isProtectedPageUrl', () => {
  it('blocks internal browser pages across supported browsers', () => {
    expect(isProtectedPageUrl('chrome://extensions')).toBe(true);
    expect(isProtectedPageUrl('chrome-extension://abc123/popup.html')).toBe(true);
    expect(isProtectedPageUrl('edge://extensions')).toBe(true);
    expect(isProtectedPageUrl('about:debugging')).toBe(true);
  });

  it('allows normal web pages', () => {
    expect(isProtectedPageUrl('https://example.com')).toBe(false);
    expect(isProtectedPageUrl('http://localhost:3000')).toBe(false);
  });
});
