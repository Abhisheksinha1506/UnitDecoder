const unidecode = require('unidecode');
const natural = require('natural');

/**
 * Normalize a string for search comparison
 * - Convert to lowercase
 * - Remove diacritics (accents)
 * - Trim whitespace
 */
function normalizeString(text) {
  if (!text || typeof text !== 'string') return '';
  
  return unidecode(text.toLowerCase().trim());
}

/**
 * Generate phonetic key for fuzzy matching
 * Uses Double Metaphone algorithm to handle "sounds-like" matching
 */
function generatePhoneticKey(text) {
  if (!text || typeof text !== 'string') return '';
  
  const normalized = normalizeString(text);
  const key = natural.DoubleMetaphone.process(normalized);
  // Ensure we always store a single string in DB
  if (Array.isArray(key)) {
    return key[0] || '';
  }
  return key || '';
}

/**
 * Parse comma-separated aliases string into array
 * Handles various separators and cleans up the results
 */
function parseAliases(aliasString) {
  if (!aliasString || typeof aliasString !== 'string') return [];
  
  return aliasString
    .split(/[,;|]/) // Split on comma, semicolon, or pipe
    .map(alias => alias.trim())
    .filter(alias => alias.length > 0);
}

/**
 * Sanitize user input to prevent XSS
 * Remove HTML tags and trim whitespace
 */
function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate category against allowed list
 */
function isValidCategory(category, allowedCategories) {
  return allowedCategories.includes(category);
}

/**
 * Basic validation for unit data
 */
function validateUnitData(data, allowedCategories) {
  const errors = [];
  
  // Required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Unit name is required');
  }
  
  if (!data.category || !isValidCategory(data.category, allowedCategories)) {
    errors.push('Valid category is required');
  }
  
  if (!data.base_unit || data.base_unit.trim().length === 0) {
    errors.push('Base unit is required');
  }
  
  if (!data.conversion_factor || isNaN(data.conversion_factor)) {
    errors.push('Valid conversion factor is required');
  }
  
  if (!data.source_url || !isValidUrl(data.source_url)) {
    errors.push('Valid source URL is required');
  }
  
  if (!data.description || data.description.trim().length < 10) {
    errors.push('Description must be at least 10 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  normalizeString,
  generatePhoneticKey,
  parseAliases,
  sanitizeString,
  isValidUrl,
  isValidCategory,
  validateUnitData
};
