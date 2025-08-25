import { InvitationTemplate } from '../../../shared/src/types';
import { InvitationTemplateInput, InvitationTemplateUpdate } from '../models/InvitationTemplate';
import { InvitationTemplateModel } from '../models/InvitationTemplate';
import { DemoDataService } from './DemoDataService';
import { logger } from '../utils/logger';

export class MockInvitationTemplateService {
  private demoDataService: DemoDataService;

  constructor() {
    this.demoDataService = DemoDataService.getInstance();
  }

  async create(templateData: InvitationTemplateInput): Promise<InvitationTemplate> {
    const validation = InvitationTemplateModel.validate(templateData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const sanitizedData = InvitationTemplateModel.sanitize(templateData);
    
    // If this is set as default, ensure no other template is default for this event
    if (sanitizedData.isDefault) {
      const existingTemplates = this.demoDataService.getInvitationTemplates(sanitizedData.eventId);
      for (const template of existingTemplates) {
        if (template.isDefault) {
          this.demoDataService.updateInvitationTemplate(template.id, { isDefault: false });
        }
      }
    }

    const template = this.demoDataService.addInvitationTemplate(sanitizedData);
    logger.info(`Created invitation template: ${template.id} for event: ${template.eventId}`);
    return template;
  }

  async findById(id: string): Promise<InvitationTemplate | null> {
    return this.demoDataService.getInvitationTemplate(id);
  }

  async findByEventId(eventId: string): Promise<InvitationTemplate[]> {
    const templates = this.demoDataService.getInvitationTemplates(eventId);
    
    // If no templates exist, create default templates
    if (templates.length === 0) {
      const defaultTemplates = InvitationTemplateModel.createDefaultTemplates(eventId);
      for (const templateData of defaultTemplates) {
        await this.create(templateData);
      }
      return this.demoDataService.getInvitationTemplates(eventId);
    }
    
    return templates.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async findDefaultByEventId(eventId: string): Promise<InvitationTemplate | null> {
    const templates = await this.findByEventId(eventId);
    return templates.find(template => template.isDefault) || null;
  }

  async update(id: string, updates: InvitationTemplateUpdate): Promise<InvitationTemplate | null> {
    const validation = InvitationTemplateModel.validateUpdate(updates);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const existingTemplate = this.demoDataService.getInvitationTemplate(id);
    if (!existingTemplate) {
      throw new Error('Invitation template not found');
    }

    // If setting as default, ensure no other template is default for this event
    if (updates.isDefault) {
      this.demoDataService.setDefaultInvitationTemplate(id, existingTemplate.eventId);
      return this.demoDataService.getInvitationTemplate(id);
    }

    const updatedTemplate = this.demoDataService.updateInvitationTemplate(id, updates);
    if (!updatedTemplate) {
      throw new Error('Failed to update invitation template');
    }

    logger.info(`Updated invitation template: ${id}`);
    return updatedTemplate;
  }

  async delete(id: string): Promise<boolean> {
    const template = this.demoDataService.getInvitationTemplate(id);
    if (!template) {
      throw new Error('Invitation template not found');
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default invitation template');
    }

    const deleted = this.demoDataService.deleteInvitationTemplate(id);
    if (deleted) {
      logger.info(`Deleted invitation template: ${id}`);
    }
    return deleted;
  }

  async setAsDefault(id: string, eventId: string): Promise<InvitationTemplate | null> {
    const template = this.demoDataService.setDefaultInvitationTemplate(id, eventId);
    if (template) {
      logger.info(`Set invitation template as default: ${id}`);
    }
    return template;
  }
}