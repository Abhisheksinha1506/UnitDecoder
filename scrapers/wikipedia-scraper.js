const axios = require('axios');
const cheerio = require('cheerio');
const { normalizeString, generatePhoneticKey } = require('../utils/normalize');

/**
 * Wikipedia scraper for unit data extraction
 */
class WikipediaScraper {
  constructor() {
    this.baseUrl = 'https://en.wikipedia.org';
    this.delay = 500; // Reduced delay for better performance
    this.maxConcurrent = 3; // Process 3 pages concurrently
    this.cache = new Map(); // Simple in-memory cache
  }
  
  /**
   * Fetch and parse a Wikipedia page with caching
   */
  async fetchPage(url) {
    // Check cache first
    if (this.cache.has(url)) {
      console.log(`💾 Using cached: ${url}`);
      return this.cache.get(url);
    }

    try {
      console.log(`📥 Fetching: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Unit Decoder Bot (https://github.com/unit-decoder)'
        },
        timeout: 10000 // 10 second timeout
      });
      
      const $ = cheerio.load(response.data);
      
      // Cache the result
      this.cache.set(url, $);
      
      return $;
    } catch (error) {
      if (error.response?.status === 404) {
        console.warn(`⚠️  Page not found: ${url}`);
      } else if (error.code === 'ECONNABORTED') {
        console.warn(`⏰ Timeout fetching: ${url}`);
      } else {
        console.error(`❌ Error fetching ${url}:`, error.message);
      }
      return null;
    }
  }
  
  /**
   * Extract units from Wikipedia tables
   */
  extractUnitsFromTable($, tableSelector, category, region = '') {
    const units = [];
    const $parsed = cheerio.load($.html());
    
    $parsed(tableSelector).each((_, table) => {
      const $table = $parsed(table);
      const rows = $table.find('tr');
      
      rows.each((_, row) => {
        const $row = $parsed(row);
        const cells = $row.find('td, th');
        
        if (cells.length >= 2) {
          const unitName = $parsed(cells[0]).text().trim();
          const conversionText = $parsed(cells[1]).text().trim();
          
          if (unitName && conversionText && unitName !== 'Unit' && unitName !== 'Name') {
            const unit = this.parseUnitData(unitName, conversionText, category, region);
            if (unit) {
              units.push(unit);
            }
          }
        }
      });
    });
    
    return units;
  }

  /**
   * Extract units from various Wikipedia page structures
   */
  extractUnitsFromPage($, category, region = '') {
    const units = [];
    
    // Try different table selectors for different page structures
    const tableSelectors = [
      'table.wikitable',
      'table.sortable',
      'table.infobox',
      'table.standard',
      'table'
    ];
    
    for (const selector of tableSelectors) {
      const tableUnits = this.extractUnitsFromTable($, selector, category, region);
      units.push(...tableUnits);
    }
    
    // Also try to extract from definition lists
    $('dl').each((_, dl) => {
      const $dl = $(dl);
      const $dt = $dl.find('dt');
      const $dd = $dl.find('dd');
      
      if ($dt.length > 0 && $dd.length > 0) {
        $dt.each((i, dt) => {
          const unitName = $(dt).text().trim();
          const description = $dd.eq(i).text().trim();
          
          if (unitName && description && unitName.length < 50) {
            const unit = this.parseUnitFromDescription(unitName, description, category, region);
            if (unit) {
              units.push(unit);
            }
          }
        });
      }
    });
    
    return units;
  }

  /**
   * Parse unit from description text
   */
  parseUnitFromDescription(name, description, category, region) {
    // Look for conversion patterns in description
    const conversionMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:grams?|kg|kilograms?|meters?|feet?|inches?|liters?|gallons?|units?)/i);
    
    if (!conversionMatch) return null;
    
    const factor = parseFloat(conversionMatch[1]);
    if (isNaN(factor) || factor <= 0) return null;
    
    // Determine base unit and adjust factor
    let baseUnit = 'Unit';
    let adjustedFactor = factor;
    
    if (category === 'Mass') {
      if (description.toLowerCase().includes('kg') || description.toLowerCase().includes('kilogram')) {
        baseUnit = 'Kilogram';
      } else {
        baseUnit = 'Gram';
      }
    } else if (category === 'Length') {
      if (description.toLowerCase().includes('meter')) {
        baseUnit = 'Meter';
      } else if (description.toLowerCase().includes('foot') || description.toLowerCase().includes('feet')) {
        baseUnit = 'Foot';
        adjustedFactor = factor * 0.3048; // Convert to meters
      } else {
        baseUnit = 'Meter';
      }
    } else if (category === 'Volume') {
      if (description.toLowerCase().includes('liter')) {
        baseUnit = 'Liter';
      } else if (description.toLowerCase().includes('gallon')) {
        baseUnit = 'Gallon';
        adjustedFactor = factor * 3.78541; // Convert to liters
      } else {
        baseUnit = 'Liter';
      }
    }
    
    return {
      name: name.replace(/[\[\]]/g, '').trim(),
      category,
      base_unit: baseUnit,
      conversion_factor: adjustedFactor,
      description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
      region: region || 'Unknown',
      era: 'Traditional',
      source_url: '', // Will be set by caller
      aliases: this.generateAliases(name)
    };
  }
  
  /**
   * Parse unit data from text
   */
  parseUnitData(name, conversionText, category, region) {
    // Clean up unit name
    const cleanName = name.replace(/[\[\]]/g, '').trim();
    if (!cleanName || cleanName.length < 2) return null;
    
    // Extract conversion factor
    const conversionMatch = conversionText.match(/(\d+(?:\.\d+)?)\s*(?:grams?|kg|kilograms?|meters?|feet?|inches?|liters?|gallons?)/i);
    if (!conversionMatch) return null;
    
    const factor = parseFloat(conversionMatch[1]);
    if (isNaN(factor) || factor <= 0) return null;
    
    // Determine base unit and adjust factor
    let baseUnit = 'Unit';
    let adjustedFactor = factor;
    
    if (category === 'Mass') {
      if (conversionText.toLowerCase().includes('kg') || conversionText.toLowerCase().includes('kilogram')) {
        baseUnit = 'Kilogram';
      } else {
        baseUnit = 'Gram';
        adjustedFactor = factor; // Assume grams if not specified
      }
    } else if (category === 'Length') {
      if (conversionText.toLowerCase().includes('meter')) {
        baseUnit = 'Meter';
      } else if (conversionText.toLowerCase().includes('foot') || conversionText.toLowerCase().includes('feet')) {
        baseUnit = 'Foot';
        adjustedFactor = factor * 0.3048; // Convert to meters
      } else {
        baseUnit = 'Meter';
      }
    } else if (category === 'Volume') {
      if (conversionText.toLowerCase().includes('liter')) {
        baseUnit = 'Liter';
      } else if (conversionText.toLowerCase().includes('gallon')) {
        baseUnit = 'Gallon';
        adjustedFactor = factor * 3.78541; // Convert to liters
      } else {
        baseUnit = 'Liter';
      }
    }
    
    return {
      name: cleanName,
      category,
      base_unit: baseUnit,
      conversion_factor: adjustedFactor,
      description: `Traditional ${region ? region + ' ' : ''}unit of ${category.toLowerCase()}`,
      region: region || 'Unknown',
      era: 'Historical',
      source_url: '', // Will be set by caller
      aliases: this.generateAliases(cleanName)
    };
  }
  
  /**
   * Generate aliases for a unit name
   */
  generateAliases(name) {
    const aliases = [name];
    
    // Add common variations
    if (name.includes(' ')) {
      aliases.push(name.replace(/\s+/g, ''));
    }
    
    // Add plural/singular forms
    if (name.endsWith('s')) {
      aliases.push(name.slice(0, -1));
    } else {
      aliases.push(name + 's');
    }
    
    return [...new Set(aliases)]; // Remove duplicates
  }
  
  /**
   * Scrape specific Wikipedia pages
   */
  async scrapeAllPages() {
    const pages = [
      // Original pages
      {
        url: '/wiki/List_of_unusual_units_of_measurement',
        category: 'Other',
        region: 'Various'
      },
      {
        url: '/wiki/List_of_obsolete_units_of_measurement',
        category: 'Other',
        region: 'Historical'
      },
      {
        url: '/wiki/List_of_customary_units_of_measurement_in_India',
        category: 'Mass',
        region: 'India'
      },
      {
        url: '/wiki/Japanese_units_of_measurement',
        category: 'Length',
        region: 'Japan'
      },
      {
        url: '/wiki/Chinese_units_of_measurement',
        category: 'Length',
        region: 'China'
      },
      {
        url: '/wiki/Imperial_units',
        category: 'Length',
        region: 'United Kingdom'
      },
      {
        url: '/wiki/United_States_customary_units',
        category: 'Length',
        region: 'United States'
      },
      
      // Africa: Traditional African units
      {
        url: '/wiki/African_units_of_measurement',
        category: 'Mass',
        region: 'Africa'
      },
      {
        url: '/wiki/Ethiopian_units_of_measurement',
        category: 'Length',
        region: 'Ethiopia'
      },
      
      // South America: Indigenous and colonial units
      {
        url: '/wiki/Spanish_units_of_measurement',
        category: 'Length',
        region: 'Colonial South America'
      },
      {
        url: '/wiki/Portuguese_units_of_measurement',
        category: 'Mass',
        region: 'Brazil'
      },
      {
        url: '/wiki/Inca_units_of_measurement',
        category: 'Length',
        region: 'Inca Empire'
      },
      
      // Southeast Asia: Thai, Vietnamese, Indonesian units
      {
        url: '/wiki/Thai_units_of_measurement',
        category: 'Length',
        region: 'Thailand'
      },
      {
        url: '/wiki/Vietnamese_units_of_measurement',
        category: 'Length',
        region: 'Vietnam'
      },
      {
        url: '/wiki/Indonesian_units_of_measurement',
        category: 'Mass',
        region: 'Indonesia'
      },
      {
        url: '/wiki/Malaysian_units_of_measurement',
        category: 'Length',
        region: 'Malaysia'
      },
      
      // Middle East: Arabic/Persian units
      {
        url: '/wiki/Arabic_units_of_measurement',
        category: 'Length',
        region: 'Middle East'
      },
      {
        url: '/wiki/Persian_units_of_measurement',
        category: 'Mass',
        region: 'Persia'
      },
      {
        url: '/wiki/Ottoman_units_of_measurement',
        category: 'Length',
        region: 'Ottoman Empire'
      },
      
      // Eastern Europe: Slavic units
      {
        url: '/wiki/Russian_units_of_measurement',
        category: 'Length',
        region: 'Russia'
      },
      {
        url: '/wiki/Polish_units_of_measurement',
        category: 'Mass',
        region: 'Poland'
      },
      {
        url: '/wiki/Czech_units_of_measurement',
        category: 'Length',
        region: 'Czech Republic'
      },
      
      // Nordic countries: Traditional Scandinavian units
      {
        url: '/wiki/Swedish_units_of_measurement',
        category: 'Length',
        region: 'Sweden'
      },
      {
        url: '/wiki/Norwegian_units_of_measurement',
        category: 'Mass',
        region: 'Norway'
      },
      {
        url: '/wiki/Danish_units_of_measurement',
        category: 'Length',
        region: 'Denmark'
      },
      {
        url: '/wiki/Finnish_units_of_measurement',
        category: 'Length',
        region: 'Finland'
      },
      
      // Pacific Islands: Traditional measurements
      {
        url: '/wiki/Polynesian_units_of_measurement',
        category: 'Length',
        region: 'Pacific Islands'
      },
      {
        url: '/wiki/Hawaiian_units_of_measurement',
        category: 'Length',
        region: 'Hawaii'
      },
      {
        url: '/wiki/Maori_units_of_measurement',
        category: 'Length',
        region: 'New Zealand'
      }
    ];
    
    const allUnits = [];
    
    // Process pages in batches for better performance
    const batches = this.chunkArray(pages, this.maxConcurrent);
    
    for (const batch of batches) {
      console.log(`🔄 Processing batch of ${batch.length} pages...`);
      
      // Process batch concurrently
      const batchPromises = batch.map(async (page) => {
        const $ = await this.fetchPage(this.baseUrl + page.url);
        if (!$) return [];
        
        // Extract from various page structures
        const units = this.extractUnitsFromPage($, page.category, page.region);
        
        // Add source URL to each unit
        units.forEach(unit => {
          unit.source_url = this.baseUrl + page.url;
        });
        
        console.log(`✅ Extracted ${units.length} units from ${page.url}`);
        return units;
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Flatten and add to all units
      batchResults.forEach(units => {
        allUnits.push(...units);
      });
      
      // Small delay between batches to be respectful
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }
    
    return allUnits;
  }
  
  /**
   * Split array into chunks for batch processing
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Add manual counting units
   */
  getCountingUnits() {
    return [
      {
        name: 'Dozen',
        category: 'Counting',
        base_unit: 'Unit',
        conversion_factor: 12,
        description: 'A group of twelve items',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Dozen',
        aliases: ['dozen', 'dz']
      },
      {
        name: 'Baker\'s Dozen',
        category: 'Counting',
        base_unit: 'Unit',
        conversion_factor: 13,
        description: 'A group of thirteen items, traditionally used by bakers',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Baker%27s_dozen',
        aliases: ['bakers dozen', 'baker\'s dozen']
      },
      {
        name: 'Gross',
        category: 'Counting',
        base_unit: 'Unit',
        conversion_factor: 144,
        description: 'A group of 144 items (12 dozen)',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Gross_(unit)',
        aliases: ['gross']
      },
      {
        name: 'Score',
        category: 'Counting',
        base_unit: 'Unit',
        conversion_factor: 20,
        description: 'A group of twenty items',
        region: 'International',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Score_(unit)',
        aliases: ['score']
      }
    ];
  }

  /**
   * Add additional regional units that might not be on Wikipedia
   */
  getAdditionalRegionalUnits() {
    return [
      // Indian subcontinent units (high-demand baseline)
      {
        name: 'Tola',
        category: 'Mass',
        base_unit: 'Gram',
        conversion_factor: 11.6638,
        description: 'Traditional South Asian unit of mass, widely used for gold and precious metals',
        region: 'Indian subcontinent',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Tola',
        aliases: ['tola', 'tole', 'tolā']
      },
      {
        name: 'Seer',
        category: 'Mass',
        base_unit: 'Gram',
        conversion_factor: 933.10,
        description: 'Traditional South Asian unit of mass; values varied regionally',
        region: 'Indian subcontinent',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Seer_(unit)',
        aliases: ['seer', 'ser']
      },
      {
        name: 'Maund',
        category: 'Mass',
        base_unit: 'Kilogram',
        conversion_factor: 37.3242,
        description: 'Traditional South Asian unit of mass; standardized in British India to ~37.3242 kg',
        region: 'Indian subcontinent',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Maund',
        aliases: ['maund', 'man']
      },
      // African units
      {
        name: 'Kantar',
        category: 'Mass',
        base_unit: 'Kilogram',
        conversion_factor: 44.928,
        description: 'Traditional Egyptian unit of weight',
        region: 'Egypt',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Kantar',
        aliases: ['kantar', 'qantar']
      },
      {
        name: 'Dirham',
        category: 'Mass',
        base_unit: 'Gram',
        conversion_factor: 3.2,
        description: 'Traditional Arabic unit of weight',
        region: 'Middle East',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Dirham',
        aliases: ['dirham', 'درهم']
      },
      
      // Southeast Asian units
      {
        name: 'Tical',
        category: 'Mass',
        base_unit: 'Gram',
        conversion_factor: 15.244,
        description: 'Traditional Thai unit of weight',
        region: 'Thailand',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Tical',
        aliases: ['tical', 'baht']
      },
      {
        name: 'Tael',
        category: 'Mass',
        base_unit: 'Gram',
        conversion_factor: 37.5,
        description: 'Traditional Chinese unit of weight',
        region: 'China',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Tael',
        aliases: ['tael', 'liang']
      },
      
      // South American units
      {
        name: 'Arroba',
        category: 'Mass',
        base_unit: 'Kilogram',
        conversion_factor: 11.5,
        description: 'Traditional Spanish unit of weight, used in Brazil',
        region: 'Brazil',
        era: 'Colonial',
        source_url: 'https://en.wikipedia.org/wiki/Arroba',
        aliases: ['arroba']
      },
      {
        name: 'Vara',
        category: 'Length',
        base_unit: 'Meter',
        conversion_factor: 0.8359,
        description: 'Traditional Spanish unit of length',
        region: 'Latin America',
        era: 'Colonial',
        source_url: 'https://en.wikipedia.org/wiki/Vara',
        aliases: ['vara']
      },
      
      // Area units
      {
        name: 'Acre',
        category: 'Area',
        base_unit: 'Square Meter',
        conversion_factor: 4046.86,
        description: 'Traditional unit of area, originally the area a yoke of oxen could plow in a day',
        region: 'International',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Acre',
        aliases: ['acre', 'ac']
      },
      {
        name: 'Hectare',
        category: 'Area',
        base_unit: 'Square Meter',
        conversion_factor: 10000,
        description: 'Metric unit of area, 100 meters by 100 meters',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Hectare',
        aliases: ['hectare', 'ha']
      },
      {
        name: 'Rood',
        category: 'Area',
        base_unit: 'Square Meter',
        conversion_factor: 1011.714,
        description: 'Traditional English unit of area, quarter of an acre',
        region: 'United Kingdom',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Rood_(unit)',
        aliases: ['rood']
      },
      
      // Nordic units
      {
        name: 'Alen',
        category: 'Length',
        base_unit: 'Meter',
        conversion_factor: 0.6277,
        description: 'Traditional Scandinavian unit of length',
        region: 'Scandinavia',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Alen',
        aliases: ['alen', 'aln']
      },
      {
        name: 'Tunna',
        category: 'Volume',
        base_unit: 'Liter',
        conversion_factor: 146.9,
        description: 'Traditional Swedish unit of volume',
        region: 'Sweden',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Tunna',
        aliases: ['tunna', 'tun']
      },
      
      // Pacific Island units
      {
        name: 'Cubit',
        category: 'Length',
        base_unit: 'Meter',
        conversion_factor: 0.4572,
        description: 'Traditional unit of length, used in Pacific cultures',
        region: 'Pacific Islands',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Cubit',
        aliases: ['cubit']
      },
      
      // Temperature units
      {
        name: 'Réaumur',
        category: 'Temperature',
        base_unit: 'Celsius',
        conversion_factor: 1.25,
        description: 'Traditional temperature scale, 0°R = 0°C, 80°R = 100°C',
        region: 'Europe',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Réaumur_scale',
        aliases: ['reaumur', 'réaumur', 'R']
      },
      {
        name: 'Rankine',
        category: 'Temperature',
        base_unit: 'Kelvin',
        conversion_factor: 0.555556,
        description: 'Absolute temperature scale based on Fahrenheit',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Rankine_scale',
        aliases: ['rankine', 'R']
      },
      
      // Speed units
      {
        name: 'Knot',
        category: 'Speed',
        base_unit: 'Meter per Second',
        conversion_factor: 0.514444,
        description: 'Nautical speed unit, 1 knot = 1 nautical mile per hour',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Knot_(unit)',
        aliases: ['knot', 'kt', 'kn']
      },
      {
        name: 'Mach',
        category: 'Speed',
        base_unit: 'Meter per Second',
        conversion_factor: 343.2,
        description: 'Speed relative to the speed of sound in air',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Mach_number',
        aliases: ['mach', 'Ma']
      },
      
      // Time units
      {
        name: 'Fortnight',
        category: 'Time',
        base_unit: 'Day',
        conversion_factor: 14,
        description: 'Traditional unit of time, 14 days or 2 weeks',
        region: 'United Kingdom',
        era: 'Traditional',
        source_url: 'https://en.wikipedia.org/wiki/Fortnight',
        aliases: ['fortnight', 'fn']
      },
      {
        name: 'Lustrum',
        category: 'Time',
        base_unit: 'Year',
        conversion_factor: 5,
        description: 'Ancient Roman unit of time, 5 years',
        region: 'Ancient Rome',
        era: 'Ancient',
        source_url: 'https://en.wikipedia.org/wiki/Lustrum',
        aliases: ['lustrum']
      },
      {
        name: 'Decade',
        category: 'Time',
        base_unit: 'Year',
        conversion_factor: 10,
        description: 'Unit of time, 10 years',
        region: 'International',
        era: 'Modern',
        source_url: 'https://en.wikipedia.org/wiki/Decade',
        aliases: ['decade']
      },
      
      // Currency (Historical) units
      {
        name: 'Ducat',
        category: 'Currency (Historical)',
        base_unit: 'Unit',
        conversion_factor: 1,
        description: 'Historical gold coin used in medieval Europe',
        region: 'Europe',
        era: 'Medieval',
        source_url: 'https://en.wikipedia.org/wiki/Ducat',
        aliases: ['ducat']
      },
      {
        name: 'Florin',
        category: 'Currency (Historical)',
        base_unit: 'Unit',
        conversion_factor: 1,
        description: 'Historical gold coin, predecessor to the ducat',
        region: 'Europe',
        era: 'Medieval',
        source_url: 'https://en.wikipedia.org/wiki/Florin',
        aliases: ['florin']
      },
      {
        name: 'Guinea',
        category: 'Currency (Historical)',
        base_unit: 'Unit',
        conversion_factor: 1,
        description: 'Historical British gold coin, worth 21 shillings',
        region: 'United Kingdom',
        era: 'Historical',
        source_url: 'https://en.wikipedia.org/wiki/Guinea_(coin)',
        aliases: ['guinea']
      }
    ];
  }
}

module.exports = WikipediaScraper;
