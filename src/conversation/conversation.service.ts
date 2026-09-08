import { Injectable } from '@nestjs/common';


@Injectable()
export class ConversationService {
  private readonly windowMs = 24 * 60 * 60 * 1000;

  isWithin24HourWindow(
    lastInboundAt: Date | null,
  ): boolean {
    if (!lastInboundAt) {
      return false;
    }

    const elapsed =
      Date.now() - lastInboundAt.getTime();

    return (
      elapsed >= 0 &&
      elapsed < this.windowMs
    );
  }

  getRemainingWindowMs(
    lastInboundAt: Date | null,
  ): number {
    if (!lastInboundAt) {
      return 0;
    }

    const remaining =
      this.windowMs -
      (Date.now() - lastInboundAt.getTime());

    return Math.max(0, remaining);
  }

  getWindowExpiry(
    lastInboundAt: Date | null,
  ): Date | null {
    if (!lastInboundAt) {
      return null;
    }

    return new Date(
      lastInboundAt.getTime() +
        this.windowMs,
    );
  }

  getConversationStatus(
    lastInboundAt: Date | null,
  ) {
    const isOpen =
      this.isWithin24HourWindow(
        lastInboundAt,
      );

    const expiresAt =
      this.getWindowExpiry(
        lastInboundAt,
      );

    const remainingMs =
      this.getRemainingWindowMs(
        lastInboundAt,
      );

    return {
      isOpen,
      lastInboundAt,
      expiresAt,
      remainingMs,
    };
  }

  getMessagingEligibility(
  lastInboundAt: Date | null,
) {
  const conversation =
    this.getConversationStatus(
      lastInboundAt,
    );

  return {
    ...conversation,
    canSendFreeForm: conversation.isOpen,
    requiresTemplate: !conversation.isOpen,
  };
}
}