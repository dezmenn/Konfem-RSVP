// Core data types shared between mobile and web

export enum RelationshipType {
  BRIDE = 'Bride',
  GROOM = 'Groom',
  PARENT = 'Parent',
  SIBLING = 'Sibling',
  GRANDPARENT = 'Grandparent',
  GRANDUNCLE = 'Granduncle',
  GRANDAUNT = 'Grandaunt',
  UNCLE = 'Uncle',
  AUNT = 'Aunt',
  COUSIN = 'Cousin',
  COLLEAGUE = 'Colleague',
  FRIEND = 'Friend',
  OTHER = 'Other'
}

export interface Guest {
  id: string;
  name: string;
  phoneNumber: string;
  dietaryRestrictions: string[];
  additionalGuestCount: number;
  relationshipType: RelationshipType;
  brideOrGroomSide: 'bride' | 'groom';
  rsvpStatus: 'not_invited' | 'pending' | 'accepted' | 'declined' | 'no_response';
  specialRequests: string;
  tableAssignment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  rsvpDeadline: Date;
  organizerId: string;
  publicRSVPEnabled: boolean;
  publicRSVPLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  position: Position;
  isLocked: boolean;
  assignedGuests: string[];
  eventId: string;
}

export interface VenueElement {
  id: string;
  type: 'stage' | 'walkway' | 'decoration' | 'entrance' | 'bar' | 'dance_floor' | 'custom';
  name: string;
  position: Position;
  dimensions: Dimensions;
  color: string;
  eventId: string;
}

export interface VenueLayout {
  elements: VenueElement[];
  tables: Table[];
}

export interface Message {
  id: string;
  recipientId: string;
  content: string;
  messageType: 'invitation' | 'reminder' | 'confirmation';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  eventId: string;
  createdAt: Date;
}

export interface InvitationSchedule {
  id: string;
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvitationExecution {
  id: string;
  invitationScheduleId: string;
  eventId: string;
  executedAt: Date;
  guestsProcessed: number;
  invitationsScheduled: number;
  invitationsSkipped: number;
  errors: string[];
}

// Keep old interfaces for backward compatibility during transition
export interface ReminderSchedule extends InvitationSchedule {}
export interface ReminderExecution extends InvitationExecution {
  reminderScheduleId: string;
  remindersScheduled: number;
  remindersSkipped: number;
}

// Export invitation types
export * from './invitation';

// Import-related types
export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  errors: ImportError[];
  importedGuests: Guest[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface CSVGuestData {
  name: string;
  phoneNumber: string;
  dietaryRestrictions?: string;
  additionalGuestCount?: string;
  relationshipType?: string;
  brideOrGroomSide?: string;
  specialRequests?: string;
}

export interface ContactData {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails?: string[];
}

export interface ImportPreview {
  validGuests: Guest[];
  invalidRows: ImportError[];
  totalRows: number;
}