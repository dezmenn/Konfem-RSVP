"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockMessageRepository = void 0;
class MockMessageRepository {
    async findWithFilters(filters) {
        // Return empty array for demo mode
        return [];
    }
    // Add other methods as needed for demo mode
    async create(message) {
        return {
            id: 'mock-message-1',
            ...message,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
exports.MockMessageRepository = MockMessageRepository;
//# sourceMappingURL=MockMessageRepository.js.map