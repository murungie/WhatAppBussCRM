export declare class ConversationService {
    private readonly windowMs;
    isWithin24HourWindow(lastInboundAt: Date | null): boolean;
    getRemainingWindowMs(lastInboundAt: Date | null): number;
    getWindowExpiry(lastInboundAt: Date | null): Date | null;
    getConversationStatus(lastInboundAt: Date | null): {
        isOpen: boolean;
        lastInboundAt: Date | null;
        expiresAt: Date | null;
        remainingMs: number;
    };
}
