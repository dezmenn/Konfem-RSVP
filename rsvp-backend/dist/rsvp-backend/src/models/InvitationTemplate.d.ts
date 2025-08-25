import { TextElement, ImageElement } from '../../../shared/src/types';
export interface InvitationTemplateInput {
    eventId: string;
    name: string;
    backgroundColor?: string;
    backgroundImage?: string;
    width?: number;
    height?: number;
    textElements?: TextElement[];
    imageElements?: ImageElement[];
    isDefault?: boolean;
}
export interface InvitationTemplateUpdate {
    name?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    width?: number;
    height?: number;
    textElements?: TextElement[];
    imageElements?: ImageElement[];
    isDefault?: boolean;
}
export declare class InvitationTemplateModel {
    static readonly DEFAULT_BACKGROUND_COLOR = "#ffffff";
    static readonly DEFAULT_TEXT_COLOR = "#333333";
    static readonly DEFAULT_FONT_FAMILY = "Arial, sans-serif";
    static readonly DEFAULT_FONT_SIZE = 16;
    static validate(input: InvitationTemplateInput): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdate(update: InvitationTemplateUpdate): {
        isValid: boolean;
        errors: string[];
    };
    static sanitize(input: InvitationTemplateInput): InvitationTemplateInput;
    static createDefaultTemplates(eventId: string): InvitationTemplateInput[];
}
//# sourceMappingURL=InvitationTemplate.d.ts.map