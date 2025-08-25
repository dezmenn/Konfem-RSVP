export interface SyncOperation {
    id: string;
    type: 'create' | 'update' | 'delete';
    entity: 'guest' | 'table' | 'venue' | 'rsvp';
    entityId: string;
    data: any;
    timestamp: Date;
    userId?: string;
    eventId: string;
    retryCount: number;
    maxRetries: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}
export interface ConflictResolution {
    operationId: string;
    resolution: 'client_wins' | 'server_wins' | 'merge' | 'manual';
    mergedData?: any;
    timestamp: Date;
}
export declare class SyncQueueService {
    private static instance;
    private queue;
    private processingQueue;
    private conflictQueue;
    private constructor();
    static getInstance(): SyncQueueService;
    addOperation(operation: Omit<SyncOperation, 'id' | 'retryCount' | 'status'>): string;
    processOperation(operationId: string): Promise<boolean>;
    private executeOperation;
    private executeGuestOperation;
    private executeTableOperation;
    private executeVenueOperation;
    private executeRSVPOperation;
    private handleConflict;
    private resolveConflictAutomatically;
    applyConflictResolution(resolution: ConflictResolution): Promise<void>;
    getPendingOperations(): SyncOperation[];
    getFailedOperations(): SyncOperation[];
    getConflicts(): Map<string, SyncOperation[]>;
    clearCompletedOperations(): void;
    getQueueStatus(): {
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    private generateOperationId;
}
//# sourceMappingURL=SyncQueueService.d.ts.map