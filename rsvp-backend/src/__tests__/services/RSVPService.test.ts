import { RSVPService } from '../../services/RSVPService';
import { InvitationTemplateRepository } from '../../repositories/InvitationTemplateRepository';
import { RSVPTokenRepository } from '../../repositories/RSVPTokenRepository';
import { RSVPResponseRepository } from '../../repositories/RSVPResponseRepository';
import { PublicRSVPRegistrationRepository } from '../../repositories/PublicRSVPRegistrationRepository';
import { GuestRepository } from '../../repositories/GuestRepository';
import { EventRepository } from '../../repositories/EventRepository';
import { InvitationTemplate, RSVPToken, Guest, Event, RSVPResponse } from '../../../../shared/src/types';
import { InvitationTemplateInput } from '../../models/InvitationTemplate';

// Mock all repositories
jest.mock('../../repositories/InvitationTemplateRepository');
jest.mock('../../repositories/RSVPTokenRepository');
jest.mock('../../repositories/RSVPResponseRepository');
jest.mock('../../repositories/PublicRSVPRegistrationRepository');
jest.mock('../../repositories/GuestRepository');
jest.mock('../../repositories/EventRepository');

describe('RSVPService', () => {
  let rsvpService: RSVPService;
  let mockInvitationTemplateRepo: jest.Mocked<InvitationTemplateRepository>;
  let mockRSVPTokenRepo: jest.Mocked<RSVPTokenRepository>;
  let mockRSVPResponseRepo: jest.Mocked<RSVPResponseRepository>;
  let mockPublicRSVPRepo: jest.Mocked<PublicRSVPRegistrationRepository>;
  let mockGuestRepo: jest.Mocked<GuestRepository>;
  let mockEventRepo: jest.Mocked<EventRepository>;

  const mockEvent: Event = {
    id: 'event-123',
    title: 'Wedding Celebration',
    description: 'A beautiful wedding',
    date: new Date('2024-06-15T15:00:00Z'),
    location: 'Grand Ballroom',
    rsvpDeadline: new Date('2024-06-01T23:59:59Z'),
    organizerId: 'organizer-123',
    publicRSVPEnabled: true,
    publicRSVPLink: 'http://example.com/rsvp/public/event-123',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockGuest: Guest = {
    id: 'guest-123',
    name: 'John Doe',
    phoneNumber: '+1234567890',
    dietaryRestrictions: [],
    additionalGuestCount: 0,
    relationshipType: 'FRIEND' as any,
    brideOrGroomSide: 'bride',
    rsvpStatus: 'pending',
    specialRequests: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    rsvpService = new RSVPService();

    // Get mocked instances
    mockInvitationTemplateRepo = (rsvpService as any).invitationTemplateRepository;
    mockRSVPTokenRepo = (rsvpService as any).rsvpTokenRepository;
    mockRSVPResponseRepo = (rsvpService as any).rsvpResponseRepository;
    mockPublicRSVPRepo = (rsvpService as any).publicRSVPRegistrationRepository;
    mockGuestRepo = (rsvpService as any).guestRepository;
    mockEventRepo = (rsvpService as any).eventRepository;
  });

  describe('createInvitationTemplate', () => {
    it('should create a new invitation template', async () => {
      const templateInput: InvitationTemplateInput = {
        eventId: 'event-123',
        name: 'Wedding Invitation',
        subject: 'You\'re Invited!',
        content: 'Dear {{guestName}}, please join us...',
        isDefault: false
      };

      const mockTemplate: InvitationTemplate = {
        id: 'template-123',
        ...templateInput,
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockInvitationTemplateRepo.findByEventId.mockResolvedValue([]);
      mockInvitationTemplateRepo.create.mockResolvedValue(mockTemplate);

      const result = await rsvpService.createInvitationTemplate(templateInput);

      expect(result).toEqual(mockTemplate);
      expect(mockInvitationTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-123',
          name: 'Wedding Invitation',
          subject: 'You\'re Invited!',
          content: 'Dear {{guestName}}, please join us...'
        })
      );
    });

    it('should handle setting template as default', async () => {
      const templateInput: InvitationTemplateInput = {
        eventId: 'event-123',
        name: 'Default Template',
        subject: 'You\'re Invited!',
        content: 'Content...',
        isDefault: true
      };

      const existingTemplate: InvitationTemplate = {
        id: 'existing-template',
        eventId: 'event-123',
        name: 'Old Default',
        subject: 'Old Subject',
        content: 'Old content',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newTemplate: InvitationTemplate = {
        id: 'template-123',
        ...templateInput,
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockInvitationTemplateRepo.findByEventId.mockResolvedValue([existingTemplate]);
      mockInvitationTemplateRepo.update.mockResolvedValue({ ...existingTemplate, isDefault: false });
      mockInvitationTemplateRepo.create.mockResolvedValue(newTemplate);

      const result = await rsvpService.createInvitationTemplate(templateInput);

      expect(mockInvitationTemplateRepo.update).toHaveBeenCalledWith('existing-template', { isDefault: false });
      expect(result).toEqual(newTemplate);
    });

    it('should throw error for invalid input', async () => {
      const invalidInput: InvitationTemplateInput = {
        eventId: '',
        name: '',
        subject: '',
        content: ''
      };

      await expect(rsvpService.createInvitationTemplate(invalidInput))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('generateRSVPToken', () => {
    it('should generate RSVP token for valid guest and event', async () => {
      const mockToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'abc123def456',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      mockGuestRepo.findById.mockResolvedValue(mockGuest);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockRSVPTokenRepo.findByGuestId.mockResolvedValue([]);
      mockRSVPTokenRepo.create.mockResolvedValue(mockToken);

      const result = await rsvpService.generateRSVPToken('guest-123', 'event-123');

      expect(result).toEqual(mockToken);
      expect(mockGuestRepo.findById).toHaveBeenCalledWith('guest-123');
      expect(mockEventRepo.findById).toHaveBeenCalledWith('event-123');
      expect(mockRSVPTokenRepo.create).toHaveBeenCalled();
    });

    it('should invalidate existing active tokens', async () => {
      const existingToken: RSVPToken = {
        id: 'old-token',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'old-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      const newToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'new-token-123',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      mockGuestRepo.findById.mockResolvedValue(mockGuest);
      mockEventRepo.findById.mockResolvedValue(mockEvent);
      mockRSVPTokenRepo.findByGuestId.mockResolvedValue([existingToken]);
      mockRSVPTokenRepo.markAsUsed.mockResolvedValue({ ...existingToken, isUsed: true });
      mockRSVPTokenRepo.create.mockResolvedValue(newToken);

      const result = await rsvpService.generateRSVPToken('guest-123', 'event-123');

      expect(mockRSVPTokenRepo.markAsUsed).toHaveBeenCalledWith('old-token');
      expect(result).toEqual(newToken);
    });

    it('should throw error for non-existent guest', async () => {
      mockGuestRepo.findById.mockResolvedValue(null);

      await expect(rsvpService.generateRSVPToken('invalid-guest', 'event-123'))
        .rejects.toThrow('Guest not found');
    });

    it('should throw error for non-existent event', async () => {
      mockGuestRepo.findById.mockResolvedValue(mockGuest);
      mockEventRepo.findById.mockResolvedValue(null);

      await expect(rsvpService.generateRSVPToken('guest-123', 'invalid-event'))
        .rejects.toThrow('Event not found');
    });
  });

  describe('validateRSVPToken', () => {
    it('should validate a valid token', async () => {
      const validToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const eventWithFutureDeadline = { ...mockEvent, rsvpDeadline: futureDeadline };

      mockRSVPTokenRepo.findByToken.mockResolvedValue(validToken);
      mockEventRepo.findById.mockResolvedValue(eventWithFutureDeadline);

      const result = await rsvpService.validateRSVPToken('valid-token');

      expect(result.isValid).toBe(true);
      expect(result.rsvpToken).toEqual(validToken);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid token', async () => {
      mockRSVPTokenRepo.findByToken.mockResolvedValue(null);

      const result = await rsvpService.validateRSVPToken('invalid-token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid RSVP token');
      expect(result.rsvpToken).toBeUndefined();
    });

    it('should reject expired token', async () => {
      const expiredToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        isUsed: false,
        createdAt: new Date()
      };

      mockRSVPTokenRepo.findByToken.mockResolvedValue(expiredToken);

      const result = await rsvpService.validateRSVPToken('expired-token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('RSVP token has expired or been used');
    });

    it('should reject token when RSVP deadline has passed', async () => {
      const validToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      const pastDeadline = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const eventWithPastDeadline = { ...mockEvent, rsvpDeadline: pastDeadline };

      mockRSVPTokenRepo.findByToken.mockResolvedValue(validToken);
      mockEventRepo.findById.mockResolvedValue(eventWithPastDeadline);

      const result = await rsvpService.validateRSVPToken('valid-token');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('RSVP deadline has passed');
    });
  });

  describe('submitRSVPResponse', () => {
    it('should submit RSVP response successfully', async () => {
      const validToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const eventWithFutureDeadline = { ...mockEvent, rsvpDeadline: futureDeadline };

      const responseData = {
        attendanceStatus: 'accepted' as const,
        mealPreferences: ['vegetarian'],
        specialRequests: 'No nuts please'
      };

      const mockResponse: RSVPResponse = {
        id: 'response-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        rsvpTokenId: 'token-123',
        attendanceStatus: 'accepted',
        mealPreferences: ['vegetarian'],
        specialRequests: 'No nuts please',
        additionalGuestDetails: [],
        submittedAt: new Date()
      };

      mockRSVPTokenRepo.findByToken.mockResolvedValue(validToken);
      mockEventRepo.findById.mockResolvedValue(eventWithFutureDeadline);
      mockRSVPResponseRepo.findByTokenId.mockResolvedValue(null);
      mockRSVPResponseRepo.create.mockResolvedValue(mockResponse);
      mockRSVPTokenRepo.markAsUsed.mockResolvedValue({ ...validToken, isUsed: true });
      mockGuestRepo.update.mockResolvedValue({ ...mockGuest, rsvpStatus: 'accepted' });

      const result = await rsvpService.submitRSVPResponse('valid-token', responseData);

      expect(result).toEqual(mockResponse);
      expect(mockRSVPResponseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          guestId: 'guest-123',
          eventId: 'event-123',
          rsvpTokenId: 'token-123',
          attendanceStatus: 'accepted'
        })
      );
      expect(mockRSVPTokenRepo.markAsUsed).toHaveBeenCalledWith('token-123');
      expect(mockGuestRepo.update).toHaveBeenCalledWith('guest-123', { rsvpStatus: 'accepted' });
    });

    it('should reject response for invalid token', async () => {
      mockRSVPTokenRepo.findByToken.mockResolvedValue(null);

      const responseData = {
        attendanceStatus: 'accepted' as const,
        mealPreferences: ['vegetarian']
      };

      await expect(rsvpService.submitRSVPResponse('invalid-token', responseData))
        .rejects.toThrow('Invalid RSVP token');
    });

    it('should reject duplicate response', async () => {
      const validToken: RSVPToken = {
        id: 'token-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
        createdAt: new Date()
      };

      const futureDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const eventWithFutureDeadline = { ...mockEvent, rsvpDeadline: futureDeadline };

      const existingResponse: RSVPResponse = {
        id: 'response-123',
        guestId: 'guest-123',
        eventId: 'event-123',
        rsvpTokenId: 'token-123',
        attendanceStatus: 'accepted',
        mealPreferences: [],
        specialRequests: '',
        additionalGuestDetails: [],
        submittedAt: new Date()
      };

      mockRSVPTokenRepo.findByToken.mockResolvedValue(validToken);
      mockEventRepo.findById.mockResolvedValue(eventWithFutureDeadline);
      mockRSVPResponseRepo.findByTokenId.mockResolvedValue(existingResponse);

      const responseData = {
        attendanceStatus: 'accepted' as const,
        mealPreferences: ['vegetarian']
      };

      await expect(rsvpService.submitRSVPResponse('valid-token', responseData))
        .rejects.toThrow('RSVP response already submitted for this token');
    });
  });

  describe('getDefaultInvitationTemplate', () => {
    it('should return existing default template', async () => {
      const defaultTemplate: InvitationTemplate = {
        id: 'template-123',
        eventId: 'event-123',
        name: 'Default Template',
        subject: 'You\'re Invited!',
        content: 'Default content',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockInvitationTemplateRepo.findDefaultByEventId.mockResolvedValue(defaultTemplate);

      const result = await rsvpService.getDefaultInvitationTemplate('event-123');

      expect(result).toEqual(defaultTemplate);
      expect(mockInvitationTemplateRepo.findDefaultByEventId).toHaveBeenCalledWith('event-123');
    });

    it('should create default template if none exists', async () => {
      const createdTemplate: InvitationTemplate = {
        id: 'template-123',
        eventId: 'event-123',
        name: 'Default Invitation',
        subject: 'You\'re Invited!',
        content: 'Dear {{guestName}}...',
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontFamily: 'Arial, sans-serif',
        fontSize: 16,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockInvitationTemplateRepo.findDefaultByEventId.mockResolvedValue(null);
      mockInvitationTemplateRepo.findByEventId.mockResolvedValue([]);
      mockInvitationTemplateRepo.create.mockResolvedValue(createdTemplate);

      const result = await rsvpService.getDefaultInvitationTemplate('event-123');

      expect(result).toEqual(createdTemplate);
      expect(mockInvitationTemplateRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event-123',
          name: 'Default Invitation',
          isDefault: true
        })
      );
    });
  });
});