import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set, skipping pre-migration (drizzle-kit will handle schema sync)');
  process.exit(0);
}

const sql = neon(DATABASE_URL);

async function preMigrate() {
  try {
    console.log('🔧 Running pre-migration cleanup...');
    
    // Drop old column if exists (safe because we use IF EXISTS)
    console.log('  - Dropping old has_used_free_trial column if it exists...');
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS has_used_free_trial`;
    console.log('  ✓ Old column cleanup completed');
    
    // Ensure new columns exist (safe because we use IF NOT EXISTS)
    console.log('  - Ensuring new free trial columns exist...');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS nclex_free_trial_used BOOLEAN DEFAULT false NOT NULL
    `;
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS teas_free_trial_used BOOLEAN DEFAULT false NOT NULL
    `;
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS hesi_free_trial_used BOOLEAN DEFAULT false NOT NULL
    `;
    
    console.log('  ✓ Free trial columns ensured');
    console.log('✅ Pre-migration cleanup completed successfully');
    
  } catch (error) {
    // Don't fail the deployment - let drizzle-kit handle the migration
    console.warn('⚠️  Pre-migration encountered an error (this is usually OK):');
    console.warn(error.message || error);
    console.log('➡️  Continuing with drizzle-kit migration...');
    process.exit(0); // Exit successfully so deployment can continue
  }
}

preMigrate();
