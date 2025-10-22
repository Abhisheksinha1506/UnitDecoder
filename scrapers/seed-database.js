const WikipediaScraper = require('./wikipedia-scraper');
const db = require('../db/database');
const { normalizeString, generatePhoneticKey } = require('../utils/normalize');

/**
 * Seed the database with units from Wikipedia
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Initialize database if needed
    const conn = db.getConnection();
    console.log('✅ Database connection established');
    
    // Check if database already has data
    const existingUnits = conn.prepare('SELECT COUNT(*) as count FROM units').get();
    if (existingUnits.count > 0) {
      console.log(`⚠️  Database already contains ${existingUnits.count} units`);
      console.log('Use --force flag to re-seed: npm run seed -- --force');
      return;
    }
    
    // Scrape Wikipedia pages
    console.log('📚 Scraping Wikipedia pages...');
    console.log('🌍 This will cover units from:');
    console.log('   • Africa: Traditional African units');
    console.log('   • South America: Indigenous and colonial units');
    console.log('   • Southeast Asia: Thai, Vietnamese, Indonesian units');
    console.log('   • Middle East: Arabic/Persian units');
    console.log('   • Eastern Europe: Slavic units');
    console.log('   • Nordic countries: Traditional Scandinavian units');
    console.log('   • Pacific Islands: Traditional measurements');
    console.log('   • Plus original regions: India, Japan, China, UK, US');
    console.log('');
    
    const scraper = new WikipediaScraper();
    const scrapedUnits = await scraper.scrapeAllPages();
    console.log(`✅ Scraped ${scrapedUnits.length} units from Wikipedia`);
    
    // Add manual counting units
    const countingUnits = scraper.getCountingUnits();
    console.log(`✅ Added ${countingUnits.length} counting units`);
    
    // Add additional regional units
    const regionalUnits = scraper.getAdditionalRegionalUnits();
    console.log(`✅ Added ${regionalUnits.length} additional regional units`);
    
    const allUnits = [...scrapedUnits, ...countingUnits, ...regionalUnits];
    console.log(`📊 Total units to insert: ${allUnits.length}`);
    
    // Insert units into database using batch operations
    let insertedCount = 0;
    let errorCount = 0;
    
    // Prepare statements once for better performance
    const unitStmt = conn.prepare(`
      INSERT INTO units (name, category, base_unit, conversion_factor, description, region, era, source_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified')
    `);
    
    const aliasStmt = conn.prepare(`
      INSERT INTO aliases (unit_id, alias, normalized_alias, phonetic_key)
      VALUES (?, ?, ?, ?)
    `);
    
    // Process in batches for better performance
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < allUnits.length; i += batchSize) {
      batches.push(allUnits.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      // Start transaction for batch
      const insertMany = conn.transaction((units) => {
        for (const unit of units) {
          try {
            // Insert unit
            const unitResult = unitStmt.run(
              unit.name,
              unit.category,
              unit.base_unit,
              unit.conversion_factor,
              unit.description,
              unit.region,
              unit.era,
              unit.source_url
            );
            
            const unitId = unitResult.lastInsertRowid;
            
            // Insert aliases
            if (unit.aliases && unit.aliases.length > 0) {
              for (const alias of unit.aliases) {
                const normalized = normalizeString(alias);
                const phonetic = generatePhoneticKey(alias);
                aliasStmt.run(unitId, alias, normalized, phonetic);
              }
            }
            // Always insert primary name as alias for search coverage
            const primaryNormalized = normalizeString(unit.name);
            const primaryPhonetic = generatePhoneticKey(unit.name);
            aliasStmt.run(unitId, unit.name, primaryNormalized, primaryPhonetic);
            
            insertedCount++;
            
          } catch (error) {
            errorCount++;
            console.error(`❌ Error inserting unit "${unit.name}":`, error.message);
          }
        }
      });
      
      // Execute batch transaction
      insertMany(batch);
      
      console.log(`📝 Processed ${insertedCount}/${allUnits.length} units...`);
    }
    
    console.log('\n🎉 Database seeding completed!');
    console.log(`✅ Successfully inserted: ${insertedCount} units`);
    console.log(`❌ Errors: ${errorCount} units`);
    
    // Verify the data
    const finalCount = conn.prepare('SELECT COUNT(*) as count FROM units').get();
    console.log(`📊 Total units in database: ${finalCount.count}`);
    
  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  const force = process.argv.includes('--force');
  
  if (force) {
    console.log('🔄 Force mode: clearing existing data...');
    const conn = db.getConnection();
    conn.prepare('DELETE FROM aliases').run();
    conn.prepare('DELETE FROM units').run();
    console.log('🗑️  Cleared existing data');
  }
  
  seedDatabase().then(() => {
    console.log('✨ Seeding process completed');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = { seedDatabase };
