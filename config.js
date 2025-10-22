module.exports = {
  port: process.env.PORT || 3000,
  dbPath: process.env.DB_PATH || './db/unit_decoder.db',
  nodeEnv: process.env.NODE_ENV || 'development',
  verificationInterval: 5 * 60 * 1000, // 5 minutes
  voteThresholds: {
    autoVerify: { yes: 10, no: 2 },
    autoReject: { no: 5 },
    flagged: { no: 3, ratio: 0.4 }
  },
  // Performance optimizations
  database: {
    cacheSize: 2000,
    journalMode: 'WAL',
    synchronous: 'NORMAL',
    tempStore: 'MEMORY',
    mmapSize: 134217728, // 128MB
    enableOptimizations: true
  },
  performance: {
    enableMonitoring: process.env.NODE_ENV === 'production',
    cacheSize: 1000,
    maxCacheAge: 5 * 60 * 1000, // 5 minutes
    enableServiceWorker: true
  }
}
