import { neon } from '@neondatabase/serverless';
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

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
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
      console.log(`  - Executing: ${statement.substring(0, 50)}...`);
      await sql(statement);
    }
    
    console.log('✅ SQL migration completed successfully');
    
  } catch (error) {
    console.warn('⚠️  SQL migration encountered an error (continuing anyway):');
    console.warn(error.message || error);
    process.exit(0);
  }
}

runMigration();
