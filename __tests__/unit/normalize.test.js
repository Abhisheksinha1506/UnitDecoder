const { normalizeString, generatePhoneticKey, isValidUrl } = require('../../utils/normalize');

describe('normalize utilities', () => {
  test('normalizeString removes diacritics and lowercases', () => {
    expect(normalizeString('Tōlā')).toBe('tola');
  });

  test('generatePhoneticKey returns a metaphone code (string or array)', () => {
    const key = generatePhoneticKey('tola');
    if (Array.isArray(key)) {
      expect(key.length).toBeGreaterThan(0);
      expect(typeof key[0]).toBe('string');
    } else {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
    }
  });

  test('isValidUrl validates URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});


