import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set, skipping SQL migration');
  process.exit(0);
}

async function runMigration() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔧 Running SQL migration...');
    
    // Read the SQL migration file
    const migrationPath = join(__dirname, '..', 'drizzle', '0001_migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolons and run each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      console.log(`  - Executing: ${preview}...`);
      try {
        await client.query(statement);
      } catch (stmtError: any) {
        // Ignore "already exists" errors, fail on others
        if (stmtError.code === '42701' || stmtError.code === '42P07') {
          console.log(`    (already exists, skipping)`);
        } else {
          throw stmtError;
        }
      }
    }
    
    console.log('✅ SQL migration completed successfully');
    
  } catch (error: any) {
    console.error('❌ SQL migration failed:', error.message || error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
