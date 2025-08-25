export class MockMessageRepository {
  async findWithFilters(filters: any): Promise<any[]> {
    // Return empty array for demo mode
    return [];
  }

  // Add other methods as needed for demo mode
  async create(message: any): Promise<any> {
    return {
      id: 'mock-message-1',
      ...message,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}