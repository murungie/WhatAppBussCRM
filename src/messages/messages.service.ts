import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Direction, MessageStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customersService: CustomersService,
    private readonly whatsappClient: WhatsappClientService,
  ) {}

  // ============================================================
  // RECORD INBOUND WHATSAPP MESSAGE
  // ============================================================

  async recordInbound(params: {
  businessId: string;
  fromPhoneNumber: string;
  content: string;
  waMessageId?: string;
  contactName?: string;
}) {
  // ============================================================
  // 1. Find or create customer
  // ============================================================

  const customer =
  await this.customersService.findOrCreate(
    params.businessId,
    {
      phoneNumber: params.fromPhoneNumber,
      name: params.contactName,
    },
  );

await this.prisma.customer.update({
  where: {
    id: customer.id,
  },
  data: {
    lastInboundAt: new Date(),
  },
});

  // ============================================================
  // 2. Save inbound message
  // ============================================================

  const inboundMessage =
  await this.prisma.message.create({
    data: {
      businessId: params.businessId,
      customerId: customer.id,
      direction: Direction.INBOUND,
      content: params.content,
      waMessageId: params.waMessageId,
      status: MessageStatus.SENT,
    },
  });

  // ============================================================
  // 3. Find matching active auto-reply rule
  // ============================================================

  const incomingText = params.content.trim().toLowerCase();

  const autoReplyRules =
    await this.prisma.autoReplyRule.findMany({
      where: {
        businessId: params.businessId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

  const matchedRule = autoReplyRules.find((rule) => {
    const keyword = rule.keyword.trim().toLowerCase();

    return (
      keyword.length > 0 &&
      incomingText.includes(keyword)
    );
  });

  // ============================================================
  // 4. No matching rule
  // ============================================================

  if (!matchedRule) {
    return {
      inboundMessage,
      autoReply: null,
    };
  }

  // ============================================================
  // 5. Send automatic WhatsApp reply
  // ============================================================

  const business =
    await this.prisma.business.findUnique({
      where: {
        id: params.businessId,
      },
      select: {
        id: true,
        whatsappPhoneId: true,
        whatsappToken: true,
      },
    });

  if (
    !business ||
    !business.whatsappPhoneId ||
    !business.whatsappToken
  ) {
    return {
      inboundMessage,
      autoReply: null,
      autoReplyError:
        'WhatsApp is not connected for this business',
    };
  }

let replyResult: any;

const phoneNumber =
  customer.phoneNumber.replace(/\D/g, '');

if (!phoneNumber) {
  return {
    inboundMessage,
    autoReply: null,
    autoReplyError:
      'Customer does not have a valid WhatsApp phone number',
  };
}
try {
  replyResult =
    await this.whatsappClient.sendTextMessage({
      phoneNumberId:
        business.whatsappPhoneId,

      accessToken:
        business.whatsappToken,

      to: phoneNumber,

      body: matchedRule.response,
    });
} catch (error) {
  return {
    inboundMessage,

    autoReply: null,

    autoReplyError:
      error instanceof Error
        ? error.message
        : 'Failed to send auto-reply',
  };
}

const waMessageId =
  replyResult?.messages?.[0]?.id ?? null;

if (!waMessageId) {
  return {
    inboundMessage,

    autoReply: null,

    autoReplyError:
      'WhatsApp accepted the request but did not return a message ID',
  };
}

const outboundMessage =
  await this.prisma.message.create({
    data: {
      businessId: params.businessId,

      customerId: customer.id,

      direction: Direction.OUTBOUND,

      content: matchedRule.response,

      waMessageId,

      status: MessageStatus.SENT,
    },
  });

  // ============================================================
  // 8. Return conversation result
  // ============================================================

  return {
    inboundMessage,

    autoReply: {
      ruleId: matchedRule.id,
      keyword: matchedRule.keyword,
      message: outboundMessage,
    },
  };
}


// ============================================================
// UPDATE WHATSAPP MESSAGE STATUS
// ============================================================

async updateMessageStatus(params: {
  businessId: string;
  waMessageId: string;
  status: string;
}) {
  const normalizedStatus =
    params.status.trim().toUpperCase();

  const allowedStatuses = [
    'SENT',
    'DELIVERED',
    'READ',
    'FAILED',
  ] as const;

  if (
    !allowedStatuses.includes(
      normalizedStatus as
        (typeof allowedStatuses)[number],
    )
  ) {
    return null;
  }

  const message =
  await this.prisma.message.findFirst({
    where: {
      waMessageId: params.waMessageId,
      businessId: params.businessId,
    },
  });

  if (!message) {
    return null;
  }

  return this.prisma.message.update({
    where: {
      id: message.id,
    },
    data: {
      status:
        normalizedStatus as
          | 'SENT'
          | 'DELIVERED'
          | 'READ'
          | 'FAILED',
    },
  });
}
  // ============================================================
  // SEND DIRECT WHATSAPP MESSAGE
  // ============================================================

  async sendReply(
  businessId: string,
  dto: SendMessageDto,
) {
  // ----------------------------------------------------------
  // 1. Validate message content
  // ----------------------------------------------------------

  const content = dto.content?.trim();

  if (!content) {
    throw new NotFoundException(
      'Message content cannot be empty',
    );
  }

  // ----------------------------------------------------------
  // 2. Get business WhatsApp configuration
  // ----------------------------------------------------------

  const business =
    await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
        whatsappPhoneId: true,
        whatsappToken: true,
      },
    });

  if (
    !business ||
    !business.whatsappPhoneId ||
    !business.whatsappToken
  ) {
    throw new NotFoundException(
      'WhatsApp is not connected for this business yet. Complete WhatsApp setup first.',
    );
  }

  // ----------------------------------------------------------
  // 3. Find customer belonging to this business
  // ----------------------------------------------------------

  const customer =
    await this.prisma.customer.findFirst({
      where: {
        id: dto.customerId,
        businessId,
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
      },
    });

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  // ----------------------------------------------------------
  // 4. Validate customer phone number
  // ----------------------------------------------------------

  const phoneNumber =
    customer.phoneNumber.replace(/\D/g, '');

  if (!phoneNumber) {
    throw new NotFoundException(
      'Customer does not have a valid WhatsApp phone number',
    );
  }

  // ----------------------------------------------------------
  // 5. Send message through WhatsApp Cloud API
  // ----------------------------------------------------------

  const result =
    await this.whatsappClient.sendTextMessage({
      phoneNumberId:
        business.whatsappPhoneId,

      accessToken:
        business.whatsappToken,

      to: phoneNumber,

      body: content,
    });

  // ----------------------------------------------------------
  // 6. Extract WhatsApp message ID
  // ----------------------------------------------------------

  const waMessageId =
    result?.messages?.[0]?.id ?? null;

  // Meta should normally return a message ID.
  // If it doesn't, don't silently pretend the message was
  // successfully tracked.
  if (!waMessageId) {
    throw new Error(
      'WhatsApp accepted the request but did not return a message ID',
    );
  }

  // ----------------------------------------------------------
  // 7. Save outbound message in database
  // ----------------------------------------------------------

  return this.prisma.message.create({
  data: {
    businessId,

    customerId: customer.id,

    direction: Direction.OUTBOUND,

    content,

    waMessageId,

    status: MessageStatus.SENT,
  },
});
}

  // ============================================================
  // GET INBOX
  // ============================================================

  async getInbox(
    businessId: string,
  ) {
    const customers =
      await this.prisma.customer.findMany({
        where: {
          businessId,
        },

        include: {
          messages: {
            orderBy: {
              createdAt: 'desc',
            },

            take: 1,
          },
        },
      });

    return customers
      .filter(
        (customer) =>
          customer.messages.length > 0,
      )
      .sort(
        (a, b) =>
          b.messages[0].createdAt.getTime() -
          a.messages[0].createdAt.getTime(),
      );
  }

 async sendTemplateTest(
  businessId: string,
  customerId: string,
) {
  const business =
    await this.prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        whatsappPhoneId: true,
        whatsappToken: true,
      },
    });

  if (
    !business?.whatsappPhoneId ||
    !business.whatsappToken
  ) {
    throw new NotFoundException(
      'WhatsApp is not connected',
    );
  }

  const customer =
    await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
      },
    });

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  const result =
    await this.whatsappClient.sendTemplateMessage({
      phoneNumberId:
        business.whatsappPhoneId,

      accessToken:
        business.whatsappToken,

      to: customer.phoneNumber,

      templateName:
        'jaspers_market_order_confirmation_v1',

      languageCode:
        'en_US',

      parameters: [
        customer.name ?? 'Customer',
        '123456',
        'Sep 7, 2026',
      ],
    });

  const waMessageId =
    result?.messages?.[0]?.id ?? null;

  if (!waMessageId) {
    throw new Error(
      'WhatsApp accepted the template request but returned no message ID',
    );
  }

  const message =
    await this.prisma.message.create({
      data: {
        businessId,
        customerId: customer.id,
        direction: 'OUTBOUND',
        content:
          `[Template: jaspers_market_order_confirmation_v1]`,
        waMessageId,
        status: 'SENT',
      },
    });

  return {
    message,
    whatsappResponse: result,
  };
}
}