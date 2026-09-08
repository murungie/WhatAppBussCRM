import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../conversation/conversation.service';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';

import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Injectable()
export class BroadcastsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappClient: WhatsappClientService,
    private readonly conversationService: ConversationService,
  ) {}

  // ============================================================
  // CREATE BROADCAST
  // ============================================================

  async create(
    businessId: string,
    dto: CreateBroadcastDto,
  ) {
    const type = dto.type ?? 'TEXT';

    // ----------------------------------------------------------
    // TEXT BROADCAST
    // ----------------------------------------------------------

    if (type === 'TEXT') {
      if (!dto.message?.trim()) {
        throw new ConflictException(
          'Text broadcasts require a message',
        );
      }

      return this.prisma.broadcast.create({
        data: {
          businessId,
          type: 'TEXT',
          message: dto.message.trim(),
          segment: dto.segment?.trim() || 'ALL',
        },
      });
    }

    // ----------------------------------------------------------
    // TEMPLATE BROADCAST
    // ----------------------------------------------------------

    if (type === 'TEMPLATE') {
      if (!dto.templateName?.trim()) {
        throw new ConflictException(
          'Template broadcasts require a template name',
        );
      }

      if (!dto.templateLanguage?.trim()) {
        throw new ConflictException(
          'Template broadcasts require a template language',
        );
      }

      return this.prisma.broadcast.create({
        data: {
          businessId,
          type: 'TEMPLATE',
          templateName:
            dto.templateName.trim(),
          templateLanguage:
            dto.templateLanguage.trim(),
          templateParameters:
            dto.templateParameters ?? [],
          segment: dto.segment?.trim() || 'ALL',
        },
      });
    }

    throw new ConflictException(
      `Unsupported broadcast type: ${type}`,
    );
  }

  // ============================================================
  // GET ALL BROADCASTS
  // ============================================================

  async findAll(
    businessId: string,
  ) {
    return this.prisma.broadcast.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            recipients: true,
          },
        },
      },
    });
  }

  // ============================================================
  // GET ONE BROADCAST
  // ============================================================

  async findOne(
    businessId: string,
    broadcastId: string,
  ) {
    const broadcast =
      await this.prisma.broadcast.findFirst({
        where: {
          id: broadcastId,
          businessId,
        },
        include: {
          recipients: {
            include: {
              customer: true,
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

    if (!broadcast) {
      throw new NotFoundException(
        'Broadcast not found',
      );
    }

    return broadcast;
  }

  // ============================================================
  // ADD RECIPIENTS
  // ============================================================

  async addRecipients(
    businessId: string,
    broadcastId: string,
    customerIds: string[],
  ) {
    const broadcast =
      await this.prisma.broadcast.findFirst({
        where: {
          id: broadcastId,
          businessId,
        },
      });

    if (!broadcast) {
      throw new NotFoundException(
        'Broadcast not found',
      );
    }

    if (broadcast.status !== 'DRAFT') {
      throw new ConflictException(
        'Recipients can only be added to a draft broadcast',
      );
    }

    if (!customerIds?.length) {
      throw new ConflictException(
        'At least one customer ID is required',
      );
    }

    // Remove duplicate IDs before querying.
    const uniqueCustomerIds = [
      ...new Set(customerIds),
    ];

    const customers =
      await this.prisma.customer.findMany({
        where: {
          id: {
            in: uniqueCustomerIds,
          },
          businessId,
        },
        select: {
          id: true,
        },
      });

    const validCustomerIds =
      customers.map(
        (customer) => customer.id,
      );

    if (validCustomerIds.length === 0) {
      throw new NotFoundException(
        'No valid customers found',
      );
    }

    await this.prisma.broadcastRecipient.createMany({
      data: validCustomerIds.map(
        (customerId) => ({
          broadcastId,
          customerId,
        }),
      ),
      skipDuplicates: true,
    });

    const totalRecipients =
      await this.prisma.broadcastRecipient.count({
        where: {
          broadcastId,
        },
      });

    return this.prisma.broadcast.update({
      where: {
        id: broadcastId,
      },
      data: {
        totalRecipients,
      },
      include: {
        recipients: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  // ============================================================
  // RESOLVE TEMPLATE PARAMETERS
  // ============================================================

  private resolveTemplateParameters(
    rawParameters: unknown,
    context: {
      customer: {
        id: string;
        name: string | null;
        phoneNumber: string;
      };
      broadcast: {
        id: string;
      };
    },
  ): string[] {
    if (!Array.isArray(rawParameters)) {
      return [];
    }

    return rawParameters.map(
      (parameter) => {
        if (
          typeof parameter !== 'string'
        ) {
          return '';
        }

        return parameter
          .replace(
            /\{\{customer\.name\}\}/g,
            context.customer.name ??
              'Customer',
          )
          .replace(
            /\{\{customer\.phone\}\}/g,
            context.customer.phoneNumber,
          )
          .replace(
            /\{\{customer\.id\}\}/g,
            context.customer.id,
          )
          .replace(
            /\{\{broadcast\.id\}\}/g,
            context.broadcast.id,
          )
          .replace(
            /\{\{date\}\}/g,
            new Date().toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              },
            ),
          );
      },
    );
  }

  // ============================================================
  // SEND / RETRY BROADCAST
  // ============================================================

  async sendBroadcast(
    businessId: string,
    broadcastId: string,
  ) {
    const broadcast =
      await this.prisma.broadcast.findFirst({
        where: {
          id: broadcastId,
          businessId,
        },
        include: {
          recipients: {
            where: {
              status: {
                in: [
                  'PENDING',
                  'FAILED',
                ],
              },
            },
            include: {
              customer: true,
            },
          },
        },
      });

    if (!broadcast) {
      throw new NotFoundException(
        'Broadcast not found',
      );
    }

    if (broadcast.status === 'COMPLETED') {
      throw new ConflictException(
        'Broadcast has already completed',
      );
    }

    if (
      broadcast.status !== 'DRAFT' &&
      broadcast.status !== 'FAILED'
    ) {
      throw new ConflictException(
        `Broadcast cannot be sent while in ${broadcast.status} status`,
      );
    }

    if (broadcast.recipients.length === 0) {
      throw new ConflictException(
        'Broadcast has no pending or retryable recipients',
      );
    }

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
      !business?.whatsappPhoneId ||
      !business.whatsappToken
    ) {
      throw new NotFoundException(
        'WhatsApp is not connected for this business yet',
      );
    }

    // ----------------------------------------------------------
    // PROCESSING
    // ----------------------------------------------------------

    await this.prisma.broadcast.update({
      where: {
        id: broadcastId,
      },
      data: {
        status: 'PROCESSING',
        failedCount: 0,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    // ----------------------------------------------------------
    // SEND EACH RECIPIENT
    // ----------------------------------------------------------

    for (const recipient of broadcast.recipients) {
      try {
        const phoneNumber =
          recipient.customer.phoneNumber
            .trim()
            .replace(/\D/g, '');

        if (!phoneNumber) {
          throw new Error(
            'Customer does not have a valid WhatsApp phone number',
          );
        }

        const eligibility =
          this.conversationService
            .getMessagingEligibility(
              recipient.customer.lastInboundAt,
            );

        let result: any;
        let messageContent: string;

        // ======================================================
        // TEXT BROADCAST
        // ======================================================

        if (broadcast.type === 'TEXT') {
          if (!eligibility.canSendFreeForm) {
            await this.prisma.broadcastRecipient.update({
              where: {
                id: recipient.id,
              },
              data: {
                status: 'WINDOW_EXPIRED',
                error:
                  'Customer conversation window has expired. A WhatsApp template is required.',
              },
            });

            failedCount++;

            continue;
          }

          if (!broadcast.message?.trim()) {
            throw new Error(
              'Text broadcast has no message',
            );
          }

          result =
            await this.whatsappClient.sendTextMessage({
              phoneNumberId:
                business.whatsappPhoneId,

              accessToken:
                business.whatsappToken,

              to: phoneNumber,

              body: broadcast.message,
            });

          messageContent =
            broadcast.message;
        }

        // ======================================================
        // TEMPLATE BROADCAST
        // ======================================================

        else if (
          broadcast.type === 'TEMPLATE'
        ) {
          if (
            !broadcast.templateName ||
            !broadcast.templateLanguage
          ) {
            throw new Error(
              'Template broadcast is missing template configuration',
            );
          }

          const parameters =
            this.resolveTemplateParameters(
              broadcast.templateParameters,
              {
                customer: {
                  id: recipient.customer.id,
                  name: recipient.customer.name,
                  phoneNumber:
                    recipient.customer.phoneNumber,
                },

                broadcast: {
                  id: broadcast.id,
                },
              },
            );

          result =
            await this.whatsappClient.sendTemplateMessage({
              phoneNumberId:
                business.whatsappPhoneId,

              accessToken:
                business.whatsappToken,

              to: phoneNumber,

              templateName:
                broadcast.templateName,

              languageCode:
                broadcast.templateLanguage,

              parameters,
            });

          messageContent =
            `[Template: ${broadcast.templateName}]`;
        }

        else {
          throw new Error(
            `Unsupported broadcast type: ${broadcast.type}`,
          );
        }

        // ======================================================
        // GET WHATSAPP MESSAGE ID
        // ======================================================

        const waMessageId =
          result?.messages?.[0]?.id ??
          null;

        if (!waMessageId) {
          throw new Error(
            'WhatsApp accepted the request but returned no message ID',
          );
        }

        // ======================================================
        // RECIPIENT SENT
        // ======================================================

        await this.prisma.broadcastRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: 'SENT',
            waMessageId,
            sentAt: new Date(),
            error: null,
          },
        });

        // ======================================================
        // SAVE MESSAGE HISTORY
        // ======================================================

        await this.prisma.message.create({
          data: {
            businessId,
            customerId:
              recipient.customerId,
            direction: 'OUTBOUND',
            content: messageContent,
            waMessageId,
            status: 'SENT',
          },
        });

        sentCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown WhatsApp error';

        await this.prisma.broadcastRecipient.update({
          where: {
            id: recipient.id,
          },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });

        failedCount++;
      }
    }

    // ----------------------------------------------------------
    // FINAL STATUS
    // ----------------------------------------------------------

    const finalStatus =
      sentCount > 0
        ? 'COMPLETED'
        : 'FAILED';

    return this.prisma.broadcast.update({
      where: {
        id: broadcastId,
      },
      data: {
        sentCount,
        failedCount,
        sentAt: new Date(),
        status: finalStatus,
      },
      include: {
        recipients: {
          include: {
            customer: true,
          },
        },
      },
    });
  }

  // ============================================================
  // UPDATE BROADCAST RECIPIENT STATUS
  // ============================================================

  async updateRecipientStatus(
    businessId: string,
    waMessageId: string,
    status: 'SENT' | 'FAILED',
    error?: string,
  ) {
    const recipient =
      await this.prisma.broadcastRecipient.findFirst({
        where: {
          waMessageId,
          broadcast: {
            businessId,
          },
        },
      });

    if (!recipient) {
      return null;
    }

    return this.prisma.broadcastRecipient.update({
      where: {
        id: recipient.id,
      },
      data: {
        status,
        error:
          error ??
          (status === 'FAILED'
            ? 'WhatsApp delivery failed'
            : null),
      },
    });
  }
}