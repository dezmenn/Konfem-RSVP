import { setupDatabase, closeDatabase } from '../config/database';
import { DatabaseSeeder } from '../seeds';
import { logger } from '../utils/logger';

async function runSeeding() {
  try {
    logger.info('Starting database seeding script...');
    
    // Setup database connection
    await setupDatabase();
    
    // Create seeder instance and run seeding
    const seeder = new DatabaseSeeder();
    await seeder.seedSampleData();
    
    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await closeDatabase();
  }
}

// Run if called directly
if (require.main === module) {
  runSeeding();
}

export { runSeeding };