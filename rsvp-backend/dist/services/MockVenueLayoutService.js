"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockVenueLayoutService = void 0;
const VenueElement_1 = require("../models/VenueElement");
const VenueLayoutService_1 = require("./VenueLayoutService");
class MockVenueLayoutService extends VenueLayoutService_1.VenueLayoutService {
    constructor() {
        // Pass null as we won't use the repository
        super(null);
        this.elements = new Map();
        this.nextId = 1;
        this.initializeDemoData();
    }
    initializeDemoData() {
        // Add some demo venue elements
        const demoElements = [
            {
                id: 'demo-stage-1',
                type: 'stage',
                name: 'Main Stage',
                position: { x: 300, y: 50 },
                dimensions: { width: 200, height: 100 },
                color: '#8B4513',
                eventId: 'demo-event-1'
            },
            {
                id: 'demo-dance-1',
                type: 'dance_floor',
                name: 'Dance Floor',
                position: { x: 250, y: 200 },
                dimensions: { width: 150, height: 150 },
                color: '#FFD700',
                eventId: 'demo-event-1'
            },
            {
                id: 'demo-bar-1',
                type: 'bar',
                name: 'Main Bar',
                position: { x: 50, y: 100 },
                dimensions: { width: 120, height: 60 },
                color: '#654321',
                eventId: 'demo-event-1'
            },
            {
                id: 'demo-entrance-1',
                type: 'entrance',
                name: 'Main Entrance',
                position: { x: 350, y: 400 },
                dimensions: { width: 80, height: 40 },
                color: '#228B22',
                eventId: 'demo-event-1'
            }
        ];
        demoElements.forEach(element => {
            this.elements.set(element.id, element);
        });
    }
    async createElement(elementData) {
        // Validate input
        const validation = VenueElement_1.VenueElementModel.validate(elementData);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Sanitize input
        const sanitizedData = VenueElement_1.VenueElementModel.sanitize(elementData);
        const newElement = {
            id: `mock-element-${this.nextId++}`,
            ...sanitizedData,
            color: sanitizedData.color || '#000000'
        };
        this.elements.set(newElement.id, newElement);
        console.log(`[MOCK] Created venue element: ${newElement.name} (${newElement.type})`);
        return newElement;
    }
    async updateElement(id, updates) {
        const existingElement = this.elements.get(id);
        if (!existingElement) {
            throw new Error('Venue element not found');
        }
        // Validate updates
        const validation = VenueElement_1.VenueElementModel.validateUpdate(updates);
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        const updatedElement = {
            ...existingElement,
            ...updates
        };
        this.elements.set(id, updatedElement);
        console.log(`[MOCK] Updated venue element: ${updatedElement.name} (${updatedElement.type})`);
        return updatedElement;
    }
    async deleteElement(id) {
        const deleted = this.elements.delete(id);
        if (deleted) {
            console.log(`[MOCK] Deleted venue element: ${id}`);
        }
        return deleted;
    }
    async getVenueLayout(eventId) {
        const elements = Array.from(this.elements.values())
            .filter(element => element.eventId === eventId);
        if (elements.length === 0) {
            return {
                elements: [],
                bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
            };
        }
        const minX = Math.min(...elements.map(e => e.position.x));
        const minY = Math.min(...elements.map(e => e.position.y));
        const maxX = Math.max(...elements.map(e => e.position.x + e.dimensions.width));
        const maxY = Math.max(...elements.map(e => e.position.y + e.dimensions.height));
        const bounds = {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
        return { elements, bounds };
    }
    async validateVenueLayout(eventId) {
        const elements = Array.from(this.elements.values())
            .filter(element => element.eventId === eventId);
        const errors = [];
        const warnings = [];
        const overlappingElements = [];
        // Check for overlaps between all elements
        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const element1 = elements[i];
                const element2 = elements[j];
                const overlap = this.calculateOverlap(element1, element2);
                if (overlap) {
                    overlappingElements.push({
                        element1,
                        element2,
                        overlapArea: overlap
                    });
                }
            }
        }
        if (overlappingElements.length > 0) {
            warnings.push(`Found ${overlappingElements.length} overlapping element pairs`);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            overlappingElements
        };
    }
    async getElementsByArea(eventId, topLeft, bottomRight) {
        return Array.from(this.elements.values())
            .filter(element => element.eventId === eventId &&
            element.position.x < bottomRight.x &&
            element.position.x + element.dimensions.width > topLeft.x &&
            element.position.y < bottomRight.y &&
            element.position.y + element.dimensions.height > topLeft.y);
    }
    async duplicateElement(id, offset = { x: 20, y: 20 }) {
        const originalElement = this.elements.get(id);
        if (!originalElement) {
            throw new Error('Venue element not found');
        }
        const duplicateData = {
            eventId: originalElement.eventId,
            type: originalElement.type,
            name: `${originalElement.name} (Copy)`,
            position: {
                x: originalElement.position.x + offset.x,
                y: originalElement.position.y + offset.y
            },
            dimensions: originalElement.dimensions,
            color: originalElement.color
        };
        return await this.createElement(duplicateData);
    }
    // Clear all elements (for testing)
    clearAll() {
        this.elements.clear();
        this.initializeDemoData();
    }
    // Get all elements (for testing)
    getAllElements() {
        return Array.from(this.elements.values());
    }
}
exports.MockVenueLayoutService = MockVenueLayoutService;
//# sourceMappingURL=MockVenueLayoutService.js.map