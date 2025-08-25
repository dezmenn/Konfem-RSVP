"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const VenueLayoutService_1 = require("../services/VenueLayoutService");
const MockVenueLayoutService_1 = require("../services/MockVenueLayoutService");
const VenueElementRepository_1 = require("../repositories/VenueElementRepository");
const router = express_1.default.Router();
// Initialize service based on environment
const venueLayoutService = process.env.SKIP_DB_SETUP === 'true'
    ? new MockVenueLayoutService_1.MockVenueLayoutService()
    : new VenueLayoutService_1.VenueLayoutService(new VenueElementRepository_1.VenueElementRepository());
// Get venue element library
router.get('/library', async (req, res) => {
    try {
        const library = venueLayoutService.getElementLibrary();
        res.json(library);
    }
    catch (error) {
        console.error('Error getting element library:', error);
        res.status(500).json({ error: 'Failed to get element library' });
    }
});
// Get venue layout for an event
router.get('/events/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const layout = await venueLayoutService.getVenueLayout(eventId);
        res.json(layout);
    }
    catch (error) {
        console.error('Error getting venue layout:', error);
        res.status(500).json({ error: 'Failed to get venue layout' });
    }
});
// Validate venue layout
router.get('/events/:eventId/validate', async (req, res) => {
    try {
        const { eventId } = req.params;
        const validation = await venueLayoutService.validateVenueLayout(eventId);
        res.json(validation);
    }
    catch (error) {
        console.error('Error validating venue layout:', error);
        res.status(500).json({ error: 'Failed to validate venue layout' });
    }
});
// Create venue element
router.post('/events/:eventId/elements', async (req, res) => {
    try {
        const { eventId } = req.params;
        const elementData = {
            ...req.body,
            eventId
        };
        const element = await venueLayoutService.createElement(elementData);
        res.status(201).json(element);
    }
    catch (error) {
        console.error('Error creating venue element:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create venue element' });
    }
});
// Create element from library
router.post('/events/:eventId/elements/from-library', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { type, position, name } = req.body;
        if (!type || !position) {
            return res.status(400).json({ error: 'Type and position are required' });
        }
        const elementData = venueLayoutService.createElementFromLibrary(eventId, type, position, name);
        const element = await venueLayoutService.createElement(elementData);
        res.status(201).json(element);
    }
    catch (error) {
        console.error('Error creating element from library:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create element from library' });
    }
});
// Update venue element
router.put('/elements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const element = await venueLayoutService.updateElement(id, updates);
        res.json(element);
    }
    catch (error) {
        console.error('Error updating venue element:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update venue element' });
    }
});
// Delete venue element
router.delete('/elements/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await venueLayoutService.deleteElement(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Venue element not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting venue element:', error);
        res.status(500).json({ error: 'Failed to delete venue element' });
    }
});
// Duplicate venue element
router.post('/elements/:id/duplicate', async (req, res) => {
    try {
        const { id } = req.params;
        const { offset } = req.body;
        const duplicatedElement = await venueLayoutService.duplicateElement(id, offset);
        res.status(201).json(duplicatedElement);
    }
    catch (error) {
        console.error('Error duplicating venue element:', error);
        res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to duplicate venue element' });
    }
});
// Get elements in area
router.post('/events/:eventId/elements/in-area', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { topLeft, bottomRight } = req.body;
        if (!topLeft || !bottomRight) {
            return res.status(400).json({ error: 'topLeft and bottomRight positions are required' });
        }
        const elements = await venueLayoutService.getElementsByArea(eventId, topLeft, bottomRight);
        res.json(elements);
    }
    catch (error) {
        console.error('Error getting elements in area:', error);
        res.status(500).json({ error: 'Failed to get elements in area' });
    }
});
exports.default = router;
//# sourceMappingURL=venue-layout.js.map