const db = require('../../db/database');
const { searchUnits } = require('../../utils/search');

describe('search integration', () => {
  test('search returns empty array for empty query', () => {
    expect(searchUnits('')).toEqual([]);
  });

  test('search returns results for common terms', () => {
    const results = searchUnits('meter');
    expect(Array.isArray(results)).toBe(true);
  });
});


