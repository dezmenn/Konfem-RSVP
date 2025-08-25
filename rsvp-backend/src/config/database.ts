import { Pool } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool;

export const setupDatabase = async (): Promise<void> => {
  // Skip database setup in test environment or when DB is not available
  if (process.env.NODE_ENV === 'test' || process.env.SKIP_DB_SETUP === 'true') {
    logger.info('Database setup skipped (test mode or SKIP_DB_SETUP=true)');
    return;
  }

  // For demo purposes, skip database setup if no database is configured
  if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    logger.info('Database setup skipped (no database configured for demo)');
    return;
  }

  const config = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'rsvp_planning',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(config);

  // Test the connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established successfully');
    
    // Run initial migrations
    await runMigrations();
  } catch (error) {
    logger.error('Database connection failed:', error);
    // In demo mode, don't throw the error, just log it
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Continuing without database connection for demo purposes');
      return;
    }
    throw error;
  }
};

export const getPool = (): Pool => {
  if (!pool) {
    // In demo mode, return a mock pool that doesn't actually connect to a database
    if (process.env.SKIP_DB_SETUP === 'true') {
      return createMockPool();
    }
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
};

// Create a mock pool for demo purposes
const createMockPool = (): any => {
  return {
    connect: async () => ({
      query: async () => ({ rows: [] }),
      release: () => {}
    }),
    query: async () => ({ rows: [] }),
    end: async () => {}
  };
};

const runMigrations = async (): Promise<void> => {
  const client = await pool.connect();
  
  try {
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        location VARCHAR(500) NOT NULL,
        rsvp_deadline TIMESTAMP NOT NULL,
        organizer_id UUID NOT NULL,
        public_rsvp_enabled BOOLEAN DEFAULT false,
        public_rsvp_link VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        dietary_restrictions TEXT[],
        additional_guest_count INTEGER DEFAULT 0,
        relationship_type VARCHAR(50) NOT NULL,
        bride_or_groom_side VARCHAR(10) CHECK (bride_or_groom_side IN ('bride', 'groom')),
        rsvp_status VARCHAR(20) DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'accepted', 'declined', 'no_response')),
        special_requests TEXT,
        table_assignment UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS venue_elements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        position_x DECIMAL(10,2) NOT NULL,
        position_y DECIMAL(10,2) NOT NULL,
        width DECIMAL(10,2) NOT NULL,
        height DECIMAL(10,2) NOT NULL,
        color VARCHAR(7) DEFAULT '#000000',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        position_x DECIMAL(10,2) NOT NULL,
        position_y DECIMAL(10,2) NOT NULL,
        is_locked BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        recipient_id UUID REFERENCES guests(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('invitation', 'reminder', 'confirmation')),
        delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create RSVP-related tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitation_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        background_color VARCHAR(7) DEFAULT '#ffffff',
        background_image VARCHAR(500),
        width INTEGER DEFAULT 600,
        height INTEGER DEFAULT 800,
        text_elements JSONB DEFAULT '[]',
        image_elements JSONB DEFAULT '[]',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Note: For demo purposes, we'll create the new structure directly
    await client.query(`
      DO $$$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invitation_templates' 
                   AND column_name = 'subject') THEN
          -- Add new columns if they don't exist
          ALTER TABLE invitation_templates 
          ADD COLUMN IF NOT EXISTS background_image VARCHAR(500),
          ADD COLUMN IF NOT EXISTS width INTEGER DEFAULT 600,
          ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 800,
          ADD COLUMN IF NOT EXISTS text_elements JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS image_elements JSONB DEFAULT '[]';
          
          -- Drop old columns if they exist
          ALTER TABLE invitation_templates 
          DROP COLUMN IF EXISTS subject,
          DROP COLUMN IF EXISTS content,
          DROP COLUMN IF EXISTS text_color,
          DROP COLUMN IF EXISTS font_family,
          DROP COLUMN IF EXISTS font_size,
          DROP COLUMN IF EXISTS header_image,
          DROP COLUMN IF EXISTS footer_text;
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rsvp_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        token VARCHAR(64) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS rsvp_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        rsvp_token_id UUID REFERENCES rsvp_tokens(id) ON DELETE CASCADE,
        attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('accepted', 'declined')),
        meal_preferences JSONB DEFAULT '[]',
        special_requests TEXT,
        additional_guest_details JSONB DEFAULT '[]',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS public_rsvp_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        relationship_type VARCHAR(50) NOT NULL,
        bride_or_groom_side VARCHAR(10) CHECK (bride_or_groom_side IN ('bride', 'groom')),
        attendance_status VARCHAR(20) NOT NULL CHECK (attendance_status IN ('accepted', 'declined')),
        meal_preferences JSONB DEFAULT '[]',
        special_requests TEXT,
        additional_guest_count INTEGER DEFAULT 0,
        additional_guest_details JSONB DEFAULT '[]',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create reminder-related tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminder_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        trigger_days INTEGER NOT NULL CHECK (trigger_days >= 0),
        message_template TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, trigger_days)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reminder_executions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reminder_schedule_id UUID REFERENCES reminder_schedules(id) ON DELETE CASCADE,
        event_id UUID REFERENCES events(id) ON DELETE CASCADE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        guests_processed INTEGER DEFAULT 0,
        reminders_scheduled INTEGER DEFAULT 0,
        reminders_skipped INTEGER DEFAULT 0,
        errors TEXT DEFAULT '[]'
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
      CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
      CREATE INDEX IF NOT EXISTS idx_messages_event_id ON messages(event_id);
      CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_tables_event_id ON tables(event_id);
      CREATE INDEX IF NOT EXISTS idx_venue_elements_event_id ON venue_elements(event_id);
      CREATE INDEX IF NOT EXISTS idx_invitation_templates_event_id ON invitation_templates(event_id);
      CREATE INDEX IF NOT EXISTS idx_invitation_templates_default ON invitation_templates(event_id, is_default);
      CREATE INDEX IF NOT EXISTS idx_rsvp_tokens_guest_id ON rsvp_tokens(guest_id);
      CREATE INDEX IF NOT EXISTS idx_rsvp_tokens_token ON rsvp_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_rsvp_tokens_expires_at ON rsvp_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_rsvp_responses_guest_id ON rsvp_responses(guest_id);
      CREATE INDEX IF NOT EXISTS idx_rsvp_responses_event_id ON rsvp_responses(event_id);
      CREATE INDEX IF NOT EXISTS idx_public_rsvp_event_id ON public_rsvp_registrations(event_id);
      CREATE INDEX IF NOT EXISTS idx_public_rsvp_phone ON public_rsvp_registrations(event_id, phone_number);
      CREATE INDEX IF NOT EXISTS idx_reminder_schedules_event_id ON reminder_schedules(event_id);
      CREATE INDEX IF NOT EXISTS idx_reminder_schedules_active ON reminder_schedules(event_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_reminder_schedules_trigger ON reminder_schedules(trigger_days);
      CREATE INDEX IF NOT EXISTS idx_reminder_executions_schedule_id ON reminder_executions(reminder_schedule_id);
      CREATE INDEX IF NOT EXISTS idx_reminder_executions_event_id ON reminder_executions(event_id);
      CREATE INDEX IF NOT EXISTS idx_reminder_executions_date ON reminder_executions(executed_at);
      CREATE INDEX IF NOT EXISTS idx_messages_scheduled ON messages(scheduled_at) WHERE scheduled_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_messages_type_status ON messages(message_type, delivery_status);
    `);

    // Add foreign key constraint for table assignments
    await client.query(`
      ALTER TABLE guests 
      ADD CONSTRAINT fk_guests_table_assignment 
      FOREIGN KEY (table_assignment) REFERENCES tables(id) ON DELETE SET NULL;
    `);

    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};