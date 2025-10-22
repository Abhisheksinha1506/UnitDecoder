const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Backup database script
 * Creates a timestamped backup of the SQLite database
 */
function backupDatabase() {
  try {
    const dbPath = config.dbPath;
    const dbDir = path.dirname(dbPath);
    const dbName = path.basename(dbPath, '.db');
    
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(dbDir, 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsDir, `${dbName}-backup-${timestamp}.db`);
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    console.log(`✅ Database backed up to: ${backupPath}`);
    
    // Clean up old backups (keep last 10)
    const backups = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith(`${dbName}-backup-`) && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupsDir, file),
        mtime: fs.statSync(path.join(backupsDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (backups.length > 10) {
      const toDelete = backups.slice(10);
      toDelete.forEach(backup => {
        fs.unlinkSync(backup.path);
        console.log(`🗑️  Deleted old backup: ${backup.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  backupDatabase();
}

module.exports = { backupDatabase };
