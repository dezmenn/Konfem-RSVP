import { InvitationSchedule } from '../../../shared/src/types';

export interface InvitationScheduleInput {
  eventId: string;
  triggerDays: number;
  messageTemplate: string;
  isActive?: boolean;
}

export interface InvitationScheduleUpdate {
  triggerDays?: number;
  messageTemplate?: string;
  isActive?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class InvitationScheduleModel {
  /**
   * Validate invitation schedule input
   */
  static validate(input: InvitationScheduleInput): ValidationResult {
    const errors: string[] = [];

    // Validate eventId
    if (!input.eventId || typeof input.eventId !== 'string') {
      errors.push('Event ID is required and must be a string');
    }

    // Validate triggerDays
    if (typeof input.triggerDays !== 'number') {
      errors.push('Trigger days must be a number');
    } else if (input.triggerDays < 0) {
      errors.push('Trigger days must be non-negative');
    } else if (input.triggerDays > 365) {
      errors.push('Trigger days cannot exceed 365 days');
    }

    // Validate messageTemplate
    if (!input.messageTemplate || typeof input.messageTemplate !== 'string') {
      errors.push('Message template is required and must be a string');
    } else if (input.messageTemplate.trim().length === 0) {
      errors.push('Message template cannot be empty');
    } else if (input.messageTemplate.length > 5000) {
      errors.push('Message template cannot exceed 5000 characters');
    }

    // Validate isActive (optional)
    if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate invitation schedule update
   */
  static validateUpdate(update: InvitationScheduleUpdate): ValidationResult {
    const errors: string[] = [];

    // Validate triggerDays (optional)
    if (update.triggerDays !== undefined) {
      if (typeof update.triggerDays !== 'number') {
        errors.push('Trigger days must be a number');
      } else if (update.triggerDays < 0) {
        errors.push('Trigger days must be non-negative');
      } else if (update.triggerDays > 365) {
        errors.push('Trigger days cannot exceed 365 days');
      }
    }

    // Validate messageTemplate (optional)
    if (update.messageTemplate !== undefined) {
      if (typeof update.messageTemplate !== 'string') {
        errors.push('Message template must be a string');
      } else if (update.messageTemplate.trim().length === 0) {
        errors.push('Message template cannot be empty');
      } else if (update.messageTemplate.length > 5000) {
        errors.push('Message template cannot exceed 5000 characters');
      }
    }

    // Validate isActive (optional)
    if (update.isActive !== undefined && typeof update.isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize invitation schedule input
   */
  static sanitize(input: InvitationScheduleInput): InvitationScheduleInput {
    return {
      eventId: input.eventId.trim(),
      triggerDays: Math.floor(Math.abs(input.triggerDays)),
      messageTemplate: input.messageTemplate.trim(),
      isActive: input.isActive !== undefined ? input.isActive : true
    };
  }

  /**
   * Get default invitation template
   */
  static getDefaultTemplate(): string {
    return `Hi {{guestName}},

You're invited to {{eventTitle}} on {{eventDate}} at {{eventLocation}}!

We're excited to celebrate with you. Please let us know if you can make it by {{rsvpDeadline}} by clicking the link below:

{{rsvpLink}}

Looking forward to seeing you there!

Best regards,
{{organizerName}}`;
  }

  /**
   * Get available template variables
   */
  static getAvailableVariables(): string[] {
    return [
      '{{guestName}}',
      '{{eventTitle}}',
      '{{eventDate}}',
      '{{eventTime}}',
      '{{eventLocation}}',
      '{{rsvpDeadline}}',
      '{{rsvpLink}}',
      '{{organizerName}}'
    ];
  }

  /**
   * Replace template variables in message content
   */
  static replaceVariables(
    template: string,
    variables: {
      guestName: string;
      eventTitle: string;
      eventDate: string;
      eventTime?: string;
      eventLocation: string;
      rsvpDeadline: string;
      rsvpLink: string;
      organizerName: string;
    }
  ): string {
    let content = template;

    // Replace all variables
    content = content.replace(/\{\{guestName\}\}/g, variables.guestName);
    content = content.replace(/\{\{eventTitle\}\}/g, variables.eventTitle);
    content = content.replace(/\{\{eventDate\}\}/g, variables.eventDate);
    content = content.replace(/\{\{eventTime\}\}/g, variables.eventTime || 'TBD');
    content = content.replace(/\{\{eventLocation\}\}/g, variables.eventLocation);
    content = content.replace(/\{\{rsvpDeadline\}\}/g, variables.rsvpDeadline);
    content = content.replace(/\{\{rsvpLink\}\}/g, variables.rsvpLink);
    content = content.replace(/\{\{organizerName\}\}/g, variables.organizerName);

    return content;
  }

  /**
   * Validate template variables
   */
  static validateTemplate(template: string): ValidationResult {
    const errors: string[] = [];
    const availableVariables = this.getAvailableVariables();
    
    // Find all variables in template
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const foundVariables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      const variable = `{{${match[1]}}}`;
      foundVariables.push(variable);
      
      if (!availableVariables.includes(variable)) {
        errors.push(`Unknown variable: ${variable}`);
      }
    }

    // Check for required variables
    const requiredVariables = ['{{guestName}}', '{{eventTitle}}'];
    for (const required of requiredVariables) {
      if (!foundVariables.includes(required)) {
        errors.push(`Missing required variable: ${required}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new invitation schedule instance
   */
  static create(input: InvitationScheduleInput): Omit<InvitationSchedule, 'id' | 'createdAt' | 'updatedAt'> {
    const sanitized = this.sanitize(input);
    
    return {
      eventId: sanitized.eventId,
      triggerDays: sanitized.triggerDays,
      messageTemplate: sanitized.messageTemplate,
      isActive: sanitized.isActive || true
    };
  }

  /**
   * Calculate when an invitation should be sent
   */
  static calculateSendDate(rsvpDeadline: Date, triggerDays: number): Date {
    if (triggerDays === 0) {
      // Send immediately
      return new Date();
    }

    const sendDate = new Date(rsvpDeadline);
    sendDate.setDate(sendDate.getDate() - triggerDays);
    
    // Don't send in the past
    const now = new Date();
    return sendDate > now ? sendDate : now;
  }

  /**
   * Check if an invitation schedule should be executed
   */
  static shouldExecute(schedule: InvitationSchedule, rsvpDeadline: Date): boolean {
    if (!schedule.isActive) {
      return false;
    }

    const sendDate = this.calculateSendDate(rsvpDeadline, schedule.triggerDays);
    const now = new Date();
    
    // Execute if send date has passed
    return sendDate <= now;
  }

  /**
   * Get invitation type based on trigger days
   */
  static getInvitationType(triggerDays: number): 'immediate' | 'scheduled' | 'reminder' {
    if (triggerDays === 0) {
      return 'immediate';
    } else if (triggerDays >= 7) {
      return 'scheduled';
    } else {
      return 'reminder';
    }
  }

  /**
   * Generate a human-readable description of the schedule
   */
  static getScheduleDescription(schedule: InvitationSchedule): string {
    if (schedule.triggerDays === 0) {
      return 'Send invitations immediately';
    } else if (schedule.triggerDays === 1) {
      return 'Send invitations 1 day before RSVP deadline';
    } else {
      return `Send invitations ${schedule.triggerDays} days before RSVP deadline`;
    }
  }
}

// Export for backward compatibility
export const ReminderScheduleModel = InvitationScheduleModel;