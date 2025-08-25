"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockInvitationTemplateService = void 0;
const InvitationTemplate_1 = require("../models/InvitationTemplate");
const DemoDataService_1 = require("./DemoDataService");
const logger_1 = require("../utils/logger");
class MockInvitationTemplateService {
    constructor() {
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
    }
    async create(templateData) {
        const validation = InvitationTemplate_1.InvitationTemplateModel.validate(templateData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const sanitizedData = InvitationTemplate_1.InvitationTemplateModel.sanitize(templateData);
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
        logger_1.logger.info(`Created invitation template: ${template.id} for event: ${template.eventId}`);
        return template;
    }
    async findById(id) {
        return this.demoDataService.getInvitationTemplate(id);
    }
    async findByEventId(eventId) {
        const templates = this.demoDataService.getInvitationTemplates(eventId);
        // If no templates exist, create default templates
        if (templates.length === 0) {
            const defaultTemplates = InvitationTemplate_1.InvitationTemplateModel.createDefaultTemplates(eventId);
            for (const templateData of defaultTemplates) {
                await this.create(templateData);
            }
            return this.demoDataService.getInvitationTemplates(eventId);
        }
        return templates.sort((a, b) => {
            if (a.isDefault && !b.isDefault)
                return -1;
            if (!a.isDefault && b.isDefault)
                return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
    async findDefaultByEventId(eventId) {
        const templates = await this.findByEventId(eventId);
        return templates.find(template => template.isDefault) || null;
    }
    async update(id, updates) {
        const validation = InvitationTemplate_1.InvitationTemplateModel.validateUpdate(updates);
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
        logger_1.logger.info(`Updated invitation template: ${id}`);
        return updatedTemplate;
    }
    async delete(id) {
        const template = this.demoDataService.getInvitationTemplate(id);
        if (!template) {
            throw new Error('Invitation template not found');
        }
        if (template.isDefault) {
            throw new Error('Cannot delete default invitation template');
        }
        const deleted = this.demoDataService.deleteInvitationTemplate(id);
        if (deleted) {
            logger_1.logger.info(`Deleted invitation template: ${id}`);
        }
        return deleted;
    }
    async setAsDefault(id, eventId) {
        const template = this.demoDataService.setDefaultInvitationTemplate(id, eventId);
        if (template) {
            logger_1.logger.info(`Set invitation template as default: ${id}`);
        }
        return template;
    }
}
exports.MockInvitationTemplateService = MockInvitationTemplateService;
//# sourceMappingURL=MockInvitationTemplateService.js.map