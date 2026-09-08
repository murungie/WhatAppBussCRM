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
    getMessagingEligibility(lastInboundAt: Date | null): {
        canSendFreeForm: boolean;
        requiresTemplate: boolean;
        isOpen: boolean;
        lastInboundAt: Date | null;
        expiresAt: Date | null;
        remainingMs: number;
    };
}
