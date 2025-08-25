"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeeding = runSeeding;
const database_1 = require("../config/database");
const seeds_1 = require("../seeds");
const logger_1 = require("../utils/logger");
async function runSeeding() {
    try {
        logger_1.logger.info('Starting database seeding script...');
        // Setup database connection
        await (0, database_1.setupDatabase)();
        // Create seeder instance and run seeding
        const seeder = new seeds_1.DatabaseSeeder();
        await seeder.seedSampleData();
        logger_1.logger.info('Database seeding completed successfully!');
    }
    catch (error) {
        logger_1.logger.error('Database seeding failed:', error);
        process.exit(1);
    }
    finally {
        // Close database connection
        await (0, database_1.closeDatabase)();
    }
}
// Run if called directly
if (require.main === module) {
    runSeeding();
}
//# sourceMappingURL=seed.js.map