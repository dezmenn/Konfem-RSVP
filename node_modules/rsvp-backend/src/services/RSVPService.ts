import { InvitationTemplate, RSVPToken, RSVPResponse, PublicRSVPRegistration, Guest, Event, InvitationPreview } from '../../../shared/src/types';
import { InvitationTemplateRepository } from '../repositories/InvitationTemplateRepository';
import { RSVPTokenRepository } from '../repositories/RSVPTokenRepository';
import { RSVPResponseRepository } from '../repositories/RSVPResponseRepository';
import { PublicRSVPRegistrationRepository } from '../repositories/PublicRSVPRegistrationRepository';
import { GuestRepository } from '../repositories/GuestRepository';
import { EventRepository } from '../repositories/EventRepository';
import { InvitationTemplateModel, InvitationTemplateInput, InvitationTemplateUpdate } from '../models/InvitationTemplate';
import { RSVPTokenModel, RSVPTokenInput } from '../models/RSVPToken';
import { RSVPResponseModel, RSVPResponseInput, RSVPResponseUpdate } from '../models/RSVPResponse';
import { PublicRSVPRegistrationModel, PublicRSVPRegistrationInput } from '../models/PublicRSVPRegistration';
import { GuestModel, GuestInput } from '../models/Guest';
import { logger } from '../utils/logger';

export class RSVPService {
  private invitationTemplateRepository: InvitationTemplateRepository;
  private rsvpTokenRepository: RSVPTokenRepository;
  private rsvpResponseRepository: RSVPResponseRepository;
  private publicRSVPRegistrationRepository: PublicRSVPRegistrationRepository;
  private guestRepository: GuestRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.invitationTemplateRepository = new InvitationTemplateRepository();
    this.rsvpTokenRepository = new RSVPTokenRepository();
    this.rsvpResponseRepository = new RSVPResponseRepository();
    this.publicRSVPRegistrationRepository = new PublicRSVPRegistrationRepository();
    this.guestRepository = new GuestRepository();
    this.eventRepository = new EventRepository();
  }

  // Invitation Template Management
  async createInvitationTemplate(templateData: InvitationTemplateInput): Promise<InvitationTemplate> {
    const validation = InvitationTemplateModel.validate(templateData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sanitizedData = InvitationTemplateModel.sanitize(templateData);
    
    // If this is set as default, ensure no other template is default for this event
    if (sanitizedData.isDefault) {
      const existingTemplates = await this.invitationTemplateRepository.findByEventId(sanitizedData.eventId);
      for (const template of existingTemplates) {
        if (template.isDefault) {
          await this.invitationTemplateRepository.update(template.id, { isDefault: false });
        }
      }
    }

    const template = await this.invitationTemplateRepository.create(sanitizedData);
    logger.info(`Created invitation template: ${template.id} for event: ${template.eventId}`);
    return template;
  }

  async updateInvitationTemplate(id: string, updates: InvitationTemplateUpdate): Promise<InvitationTemplate> {
    const validation = InvitationTemplateModel.validateUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const existingTemplate = await this.invitationTemplateRepository.findById(id);
    if (!existingTemplate) {
      throw new Error('Invitation template not found');
    }

    // If setting as default, ensure no other template is default for this event
    if (updates.isDefault) {
      await this.invitationTemplateRepository.setAsDefault(id, existingTemplate.eventId);
      return await this.invitationTemplateRepository.findById(id) as InvitationTemplate;
    }

    const updatedTemplate = await this.invitationTemplateRepository.update(id, updates);
    if (!updatedTemplate) {
      throw new Error('Failed to update invitation template');
    }

    logger.info(`Updated invitation template: ${id}`);
    return updatedTemplate;
  }

  async getInvitationTemplate(id: string): Promise<InvitationTemplate> {
    const template = await this.invitationTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Invitation template not found');
    }
    return template;
  }

  async getInvitationTemplatesByEvent(eventId: string): Promise<InvitationTemplate[]> {
    return await this.invitationTemplateRepository.findByEventId(eventId);
  }

  async getDefaultInvitationTemplate(eventId: string): Promise<InvitationTemplate> {
    let template = await this.invitationTemplateRepository.findDefaultByEventId(eventId);
    
    if (!template) {
      // Create default templates if none exist
      const defaultTemplates = InvitationTemplateModel.createDefaultTemplates(eventId);
      for (const templateData of defaultTemplates) {
        await this.createInvitationTemplate(templateData);
      }
      // Return the first (default) template
      template = await this.invitationTemplateRepository.findDefaultByEventId(eventId);
    }
    
    return template!;
  }

  async deleteInvitationTemplate(id: string): Promise<void> {
    const template = await this.invitationTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Invitation template not found');
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default invitation template');
    }

    const deleted = await this.invitationTemplateRepository.delete(id);
    if (!deleted) {
      throw new Error('Failed to delete invitation template');
    }

    logger.info(`Deleted invitation template: ${id}`);
  }

  // RSVP Token Management
  async generateRSVPToken(guestId: string, eventId: string, expiryDays?: number): Promise<RSVPToken> {
    // Check if guest exists
    const guest = await this.guestRepository.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }

    // Check if event exists
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Invalidate any existing active tokens for this guest
    const existingTokens = await this.rsvpTokenRepository.findByGuestId(guestId);
    for (const token of existingTokens) {
      if (RSVPTokenModel.isTokenValid(token)) {
        await this.rsvpTokenRepository.markAsUsed(token.id);
      }
    }

    const tokenInput: RSVPTokenInput = {
      guestId,
      eventId,
      expiresAt: expiryDays ? RSVPTokenModel.generateExpiryDate(expiryDays) : undefined
    };

    const validation = RSVPTokenModel.validate(tokenInput);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sanitizedData = RSVPTokenModel.sanitize(tokenInput);
    const token = await this.rsvpTokenRepository.create(sanitizedData);
    
    logger.info(`Generated RSVP token for guest: ${guestId}, event: ${eventId}`);
    return token;
  }

  async validateRSVPToken(token: string): Promise<{ isValid: boolean; rsvpToken?: RSVPToken; error?: string }> {
    const rsvpToken = await this.rsvpTokenRepository.findByToken(token);
    
    if (!rsvpToken) {
      return { isValid: false, error: 'Invalid RSVP token' };
    }

    if (!RSVPTokenModel.isTokenValid(rsvpToken)) {
      return { isValid: false, error: 'RSVP token has expired or been used' };
    }

    // Check if event RSVP deadline has passed
    const event = await this.eventRepository.findById(rsvpToken.eventId);
    if (!event) {
      return { isValid: false, error: 'Event not found' };
    }

    if (event.rsvpDeadline <= new Date()) {
      return { isValid: false, error: 'RSVP deadline has passed' };
    }

    return { isValid: true, rsvpToken };
  }

  async getRSVPLink(guestId: string, eventId: string): Promise<string> {
    // Get or create RSVP token
    let token = await this.rsvpTokenRepository.findActiveByGuestId(guestId);
    
    if (!token) {
      token = await this.generateRSVPToken(guestId, eventId);
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/rsvp/${token.token}`;
  }

  // RSVP Response Management
  async submitRSVPResponse(token: string, responseData: Omit<RSVPResponseInput, 'guestId' | 'eventId' | 'rsvpTokenId'>): Promise<RSVPResponse> {
    const tokenValidation = await this.validateRSVPToken(token);
    if (!tokenValidation.isValid || !tokenValidation.rsvpToken) {
      throw new Error(tokenValidation.error || 'Invalid token');
    }

    const rsvpToken = tokenValidation.rsvpToken;

    // Check if response already exists
    const existingResponse = await this.rsvpResponseRepository.findByTokenId(rsvpToken.id);
    if (existingResponse) {
      throw new Error('RSVP response already submitted for this token');
    }

    const fullResponseData: RSVPResponseInput = {
      ...responseData,
      guestId: rsvpToken.guestId,
      eventId: rsvpToken.eventId,
      rsvpTokenId: rsvpToken.id
    };

    const validation = RSVPResponseModel.validate(fullResponseData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sanitizedData = RSVPResponseModel.sanitize(fullResponseData);
    const response = await this.rsvpResponseRepository.create(sanitizedData);

    // Mark token as used
    await this.rsvpTokenRepository.markAsUsed(rsvpToken.id);

    // Update guest RSVP status
    await this.guestRepository.update(rsvpToken.guestId, {
      rsvpStatus: responseData.attendanceStatus === 'accepted' ? 'accepted' : 'declined'
    });

    logger.info(`RSVP response submitted for guest: ${rsvpToken.guestId}, status: ${responseData.attendanceStatus}`);
    return response;
  }

  async updateRSVPResponse(responseId: string, updates: RSVPResponseUpdate): Promise<RSVPResponse> {
    const validation = RSVPResponseModel.validateUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const existingResponse = await this.rsvpResponseRepository.findById(responseId);
    if (!existingResponse) {
      throw new Error('RSVP response not found');
    }

    // Check if event RSVP deadline has passed
    const event = await this.eventRepository.findById(existingResponse.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.rsvpDeadline <= new Date()) {
      throw new Error('Cannot update RSVP after deadline has passed');
    }

    const updatedResponse = await this.rsvpResponseRepository.update(responseId, updates);
    if (!updatedResponse) {
      throw new Error('Failed to update RSVP response');
    }

    // Update guest RSVP status if attendance status changed
    if (updates.attendanceStatus) {
      await this.guestRepository.update(existingResponse.guestId, {
        rsvpStatus: updates.attendanceStatus === 'accepted' ? 'accepted' : 'declined'
      });
    }

    logger.info(`Updated RSVP response: ${responseId}`);
    return updatedResponse;
  }

  async getRSVPResponse(guestId: string): Promise<RSVPResponse | null> {
    return await this.rsvpResponseRepository.findByGuestId(guestId);
  }

  async getEventRSVPResponses(eventId: string): Promise<RSVPResponse[]> {
    return await this.rsvpResponseRepository.findByEventId(eventId);
  }

  // Public RSVP Management
  async submitPublicRSVP(eventId: string, registrationData: Omit<PublicRSVPRegistrationInput, 'eventId'>): Promise<PublicRSVPRegistration> {
    // Check if event exists and allows public RSVPs
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    if (!event.publicRSVPEnabled) {
      throw new Error('Public RSVP is not enabled for this event');
    }

    if (event.rsvpDeadline <= new Date()) {
      throw new Error('RSVP deadline has passed');
    }

    const fullRegistrationData: PublicRSVPRegistrationInput = {
      ...registrationData,
      eventId
    };

    const validation = PublicRSVPRegistrationModel.validate(fullRegistrationData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if phone number already registered for this event
    const existingRegistration = await this.publicRSVPRegistrationRepository.findByPhoneNumber(eventId, registrationData.phoneNumber);
    if (existingRegistration) {
      throw new Error('Phone number already registered for this event');
    }

    const sanitizedData = PublicRSVPRegistrationModel.sanitize(fullRegistrationData);
    const registration = await this.publicRSVPRegistrationRepository.create(sanitizedData);

    logger.info(`Public RSVP submitted for event: ${eventId}, name: ${registrationData.name}`);
    return registration;
  }

  async getPublicRSVPRegistrations(eventId: string): Promise<PublicRSVPRegistration[]> {
    return await this.publicRSVPRegistrationRepository.findByEventId(eventId);
  }

  // Invitation Preview and Generation
  async generateInvitationPreview(templateId: string, guestId: string): Promise<InvitationPreview> {
    const template = await this.invitationTemplateRepository.findById(templateId);
    if (!template) {
      throw new Error('Invitation template not found');
    }

    const guest = await this.guestRepository.findById(guestId);
    if (!guest) {
      throw new Error('Guest not found');
    }

    const event = await this.eventRepository.findById(template.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const rsvpLink = await this.getRSVPLink(guestId, template.eventId);

    // Personalize text elements
    const personalizedTextElements = template.textElements.map(element => ({
      ...element,
      content: this.personalizeInvitationContent(element.content, guest, event, rsvpLink)
    }));

    return {
      subject: `Invitation to ${event.title}`,
      content: '', // Not used in new structure
      backgroundColor: template.backgroundColor,
      textColor: '#000000', // Default for compatibility
      fontFamily: 'Arial, sans-serif', // Default for compatibility
      fontSize: 16, // Default for compatibility
      headerImage: template.backgroundImage,
      footerText: '',
      rsvpLink,
      // Add new fields for the updated structure
      template: {
        ...template,
        textElements: personalizedTextElements
      }
    } as any; // Type assertion since InvitationPreview needs to be updated
  }

  private personalizeInvitationContent(content: string, guest: Guest, event: Event, rsvpLink: string): string {
    return content
      .replace(/\{\{guestName\}\}/g, guest.name)
      .replace(/\{\{eventTitle\}\}/g, event.title)
      .replace(/\{\{eventDate\}\}/g, event.date.toLocaleDateString())
      .replace(/\{\{eventTime\}\}/g, event.date.toLocaleTimeString())
      .replace(/\{\{eventLocation\}\}/g, event.location)
      .replace(/\{\{rsvpDeadline\}\}/g, event.rsvpDeadline.toLocaleDateString())
      .replace(/\{\{rsvpLink\}\}/g, rsvpLink)
      .replace(/\{\{organizerName\}\}/g, 'Event Organizer'); // TODO: Add organizer name to event model
  }

  // Statistics and Analytics
  async getEventRSVPStatistics(eventId: string): Promise<{
    invitedGuests: number;
    totalResponses: number;
    acceptedCount: number;
    declinedCount: number;
    pendingCount: number;
    totalAttendees: number;
    publicRegistrations: number;
    publicAttendees: number;
    responseRate: number;
    mealPreferenceCounts: Record<string, number>;
  }> {
    // Get invited guests count
    const allGuests = await this.guestRepository.findByEventId(eventId);
    const invitedGuests = allGuests.length;

    // Get RSVP response statistics
    const rsvpStats = await this.rsvpResponseRepository.getEventStatistics(eventId);

    // Get public registration statistics
    const publicStats = await this.publicRSVPRegistrationRepository.getEventStatistics(eventId);

    const pendingCount = invitedGuests - rsvpStats.totalResponses;
    const responseRate = invitedGuests > 0 ? (rsvpStats.totalResponses / invitedGuests) * 100 : 0;

    // Combine meal preferences from both sources
    const combinedMealPreferences = { ...rsvpStats.mealPreferenceCounts };
    Object.entries(publicStats.mealPreferenceCounts).forEach(([pref, count]) => {
      combinedMealPreferences[pref] = (combinedMealPreferences[pref] || 0) + count;
    });

    return {
      invitedGuests,
      totalResponses: rsvpStats.totalResponses,
      acceptedCount: rsvpStats.acceptedCount,
      declinedCount: rsvpStats.declinedCount,
      pendingCount,
      totalAttendees: rsvpStats.totalAttendees + publicStats.totalAttendees,
      publicRegistrations: publicStats.totalRegistrations,
      publicAttendees: publicStats.totalAttendees,
      responseRate: Math.round(responseRate * 100) / 100,
      mealPreferenceCounts: combinedMealPreferences
    };
  }

  // Utility Methods
  async cleanupExpiredTokens(): Promise<number> {
    return await this.rsvpTokenRepository.deleteExpired();
  }
}