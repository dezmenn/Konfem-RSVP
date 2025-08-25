"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockVenueElementRepository = void 0;
const DemoDataService_1 = require("./DemoDataService");
class MockVenueElementRepository {
    constructor() {
        this.demoDataService = DemoDataService_1.DemoDataService.getInstance();
    }
    async create(elementData) {
        const newElement = {
            id: `venue-element-${Date.now()}`,
            type: elementData.type,
            name: elementData.name,
            position: elementData.position,
            dimensions: elementData.dimensions,
            color: elementData.color || '#000000',
            eventId: elementData.eventId
        };
        this.demoDataService.addVenueElement(newElement);
        return newElement;
    }
    async findById(id) {
        return this.demoDataService.getVenueElementById(id);
    }
    async findByEventId(eventId) {
        return this.demoDataService.getVenueElements(eventId);
    }
    async findByType(eventId, type) {
        const elements = this.demoDataService.getVenueElements(eventId);
        return elements.filter(element => element.type === type);
    }
    async update(id, updates) {
        const updatedElement = this.demoDataService.updateVenueElement(id, updates);
        return updatedElement;
    }
    async delete(id) {
        return this.demoDataService.deleteVenueElement(id);
    }
    async checkOverlap(eventId, position, dimensions, excludeId) {
        const elements = this.demoDataService.getVenueElements(eventId);
        const overlapping = [];
        for (const element of elements) {
            if (excludeId && element.id === excludeId)
                continue;
            // Check if rectangles overlap
            const left1 = position.x;
            const right1 = position.x + dimensions.width;
            const top1 = position.y;
            const bottom1 = position.y + dimensions.height;
            const left2 = element.position.x;
            const right2 = element.position.x + element.dimensions.width;
            const top2 = element.position.y;
            const bottom2 = element.position.y + element.dimensions.height;
            if (left1 < right2 && right1 > left2 && top1 < bottom2 && bottom1 > top2) {
                overlapping.push(element);
            }
        }
        return overlapping;
    }
    async getElementsByArea(eventId, topLeft, bottomRight) {
        const elements = this.demoDataService.getVenueElements(eventId);
        return elements.filter(element => {
            const elementLeft = element.position.x;
            const elementRight = element.position.x + element.dimensions.width;
            const elementTop = element.position.y;
            const elementBottom = element.position.y + element.dimensions.height;
            return (elementLeft >= topLeft.x &&
                elementRight <= bottomRight.x &&
                elementTop >= topLeft.y &&
                elementBottom <= bottomRight.y);
        });
    }
    async getVenueLayout(eventId) {
        const elements = this.demoDataService.getVenueElements(eventId);
        if (elements.length === 0) {
            return {
                elements: [],
                bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
            };
        }
        const minX = Math.min(...elements.map(e => e.position.x));
        const minY = Math.min(...elements.map(e => e.position.y));
        const maxX = Math.max(...elements.map(e => e.position.x + e.dimensions.width));
        const maxY = Math.max(...elements.map(e => e.position.y + e.dimensions.height));
        return {
            elements,
            bounds: { minX, minY, maxX, maxY }
        };
    }
}
exports.MockVenueElementRepository = MockVenueElementRepository;
//# sourceMappingURL=MockVenueElementRepository.js.map