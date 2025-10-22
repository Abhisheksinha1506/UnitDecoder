/**
 * Performance configuration for The Unit Decoder
 */
module.exports = {
  // Scraping performance
  scraping: {
    maxConcurrent: 3,        // Number of concurrent Wikipedia requests
    delay: 500,              // Delay between batches (ms)
    timeout: 10000,          // Request timeout (ms)
    cacheSize: 100,          // Maximum cached pages
    batchSize: 50            // Database batch size
  },
  
  // Database performance
  database: {
    connectionPool: 5,       // Maximum connections
    queryTimeout: 30000,     // Query timeout (ms)
    journalMode: 'WAL',      // Write-Ahead Logging for better concurrency
    synchronous: 'NORMAL',   // Balance between safety and speed
    cacheSize: 2000,        // SQLite cache size (KB)
    tempStore: 'MEMORY'      // Store temp tables in memory
  },
  
  // Search performance
  search: {
    maxResults: 50,          // Maximum search results
    cacheSize: 1000,        // Search result cache size
    cacheTimeout: 300000,    // Cache timeout (5 minutes)
    phoneticThreshold: 0.8,  // Phonetic matching threshold
    fuzzyThreshold: 0.6      // Fuzzy matching threshold
  },
  
  // Memory management
  memory: {
    maxHeapSize: 512,        // Maximum heap size (MB)
    gcInterval: 60000,       // Garbage collection interval (ms)
    leakDetection: false     // Enable memory leak detection
  },
  
  // Rate limiting
  rateLimit: {
    search: { count: 100, window: 60000 },      // 100 searches per minute
    submit: { count: 5, window: 3600000 },      // 5 submissions per hour
    vote: { count: 20, window: 3600000 },       // 20 votes per hour
    api: { count: 1000, window: 60000 }         // 1000 API calls per minute
  }
};
