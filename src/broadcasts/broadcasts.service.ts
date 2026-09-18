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
          scheduledAt: dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : null,
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
          scheduledAt: dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : null,
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

   // ============================================================
  // GET PAGINATED / FILTERED BROADCASTS
  // ============================================================

  async findAll(
    businessId: string,
    page = 1,
    limit = 20,
    status?: string,
  ) {
    const safePage =
      Number.isFinite(page) && page > 0
        ? Math.floor(page)
        : 1;

    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 100)
        : 20;

    const normalizedStatus =
      status?.trim().toUpperCase();

    const validStatuses = [
      'DRAFT',
      'QUEUED',
      'PROCESSING',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ] as const;

    let statusFilter:
      | (typeof validStatuses)[number]
      | undefined;

    if (normalizedStatus) {
      if (
        !validStatuses.includes(
          normalizedStatus as
            (typeof validStatuses)[number],
        )
      ) {
        throw new ConflictException(
          `Invalid broadcast status: ${status}`,
        );
      }

      statusFilter =
        normalizedStatus as
          (typeof validStatuses)[number];
    }

    const where = {
      businessId,
      ...(statusFilter
        ? {
            status: statusFilter,
          }
        : {}),
    };

    const skip =
      (safePage - 1) * safeLimit;

    const [total, broadcasts] =
      await Promise.all([
        this.prisma.broadcast.count({
          where,
        }),

        this.prisma.broadcast.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: safeLimit,
          include: {
            _count: {
              select: {
                recipients: true,
              },
            },
          },
        }),
      ]);

    const totalPages =
      Math.ceil(total / safeLimit);

    return {
      data: broadcasts,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage:
          safePage < totalPages,
        hasPreviousPage:
          safePage > 1,
      },
    };
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
  // GET BROADCAST ANALYTICS
  // GET /broadcasts/:id/analytics
  // ============================================================

  async getAnalytics(
    businessId: string,
    broadcastId: string,
  ) {
    const broadcast =
      await this.prisma.broadcast.findFirst({
        where: {
          id: broadcastId,
          businessId,
        },
        select: {
          id: true,
          status: true,
          type: true,
          message: true,
          templateName: true,
          segment: true,
          totalRecipients: true,
          sentCount: true,
          deliveredCount: true,
          readCount: true,
          failedCount: true,
          scheduledAt: true,
          sentAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!broadcast) {
      throw new NotFoundException(
        'Broadcast not found',
      );
    }

    const [
      pendingCount,
      windowExpiredCount,
    ] = await Promise.all([
      this.prisma.broadcastRecipient.count({
        where: {
          broadcastId,
          status: 'PENDING',
        },
      }),

      this.prisma.broadcastRecipient.count({
        where: {
          broadcastId,
          status: 'WINDOW_EXPIRED',
        },
      }),
    ]);

    const sent =
      broadcast.sentCount;

    const delivered =
      broadcast.deliveredCount;

    const read =
      broadcast.readCount;

    const failed =
      broadcast.failedCount;

    const total =
      broadcast.totalRecipients;

    const deliveryRate =
      sent > 0
        ? Number(
            ((delivered / sent) * 100).toFixed(2),
          )
        : 0;

    const readRate =
      sent > 0
        ? Number(
            ((read / sent) * 100).toFixed(2),
          )
        : 0;

    const failureRate =
      total > 0
        ? Number(
            ((failed / total) * 100).toFixed(2),
          )
        : 0;

    const sentRate =
      total > 0
        ? Number(
            ((sent / total) * 100).toFixed(2),
          )
        : 0;

    return {
      broadcast: {
        id: broadcast.id,
        status: broadcast.status,
        type: broadcast.type,
        message: broadcast.message,
        templateName: broadcast.templateName,
        segment: broadcast.segment,
        scheduledAt: broadcast.scheduledAt,
        sentAt: broadcast.sentAt,
        createdAt: broadcast.createdAt,
        updatedAt: broadcast.updatedAt,
      },

      summary: {
        totalRecipients: total,
        sent,
        delivered,
        read,
        failed,
        pending: pendingCount,
        windowExpired: windowExpiredCount,
      },

      rates: {
        sentRate,
        deliveryRate,
        readRate,
        failureRate,
      },
    };
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
  broadcast.status !== 'FAILED' &&
  broadcast.status !== 'QUEUED'
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
    deliveryStatus: 'SENT',
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
    deliveryStatus: 'FAILED',
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
  queueJobId: null,
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

  async processQueuedBroadcast(
  broadcastId: string,
) {
  const broadcast =
    await this.prisma.broadcast.findUnique({
      where: {
        id: broadcastId,
      },
    });

  if (!broadcast) {
    throw new NotFoundException(
      'Broadcast not found',
    );
  }

  return this.sendBroadcast(
    broadcast.businessId,
    broadcastId,
  );
}

async validateForQueue(
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
          select: {
            id: true,
          },
        },
      },
    });

  if (!broadcast) {
    throw new NotFoundException(
      'Broadcast not found',
    );
  }

  if (
    broadcast.status !== 'DRAFT' &&
    broadcast.status !== 'FAILED'
  ) {
    throw new ConflictException(
      `Broadcast cannot be queued while in ${broadcast.status} status`,
    );
  }

  if (broadcast.recipients.length === 0) {
    throw new ConflictException(
      'Broadcast has no pending or retryable recipients',
    );
  }

  return broadcast;
}
// ============================================================
// ATOMICALLY CLAIM BROADCAST FOR QUEUING
// ============================================================

async claimForQueue(
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
          select: {
            id: true,
          },
        },
      },
    });

  if (!broadcast) {
    throw new NotFoundException(
      'Broadcast not found',
    );
  }

  if (
    broadcast.status !== 'DRAFT' &&
    broadcast.status !== 'FAILED'
  ) {
    throw new ConflictException(
      `Broadcast cannot be queued while in ${broadcast.status} status`,
    );
  }

  if (broadcast.recipients.length === 0) {
    throw new ConflictException(
      'Broadcast has no pending or retryable recipients',
    );
  }

  // ----------------------------------------------------------
  // Atomic state transition
  // ----------------------------------------------------------

  const claimed =
    await this.prisma.broadcast.updateMany({
      where: {
        id: broadcastId,
        businessId,
        status: {
          in: [
            'DRAFT',
            'FAILED',
          ],
        },
      },
      data: {
        status: 'QUEUED',
        queueJobId: null,
      },
    });

  if (claimed.count !== 1) {
    throw new ConflictException(
      'Broadcast was already queued or is being processed',
    );
  }

  const queuedBroadcast =
    await this.prisma.broadcast.findFirst({
      where: {
        id: broadcastId,
        businessId,
      },
    });

  if (!queuedBroadcast) {
    throw new NotFoundException(
      'Broadcast could not be loaded after being queued',
    );
  }

  return queuedBroadcast;
}
async markQueued(
  businessId: string,
  broadcastId: string,
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

  return this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
      status: 'QUEUED',
    },
  });
}

async markFailedToQueue(
  businessId: string,
  broadcastId: string,
  error?: string,
) {
  const broadcast =
    await this.prisma.broadcast.findFirst({
      where: {
        id: broadcastId,
        businessId,
      },
    });

  if (!broadcast) {
    return null;
  }

  return this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
  status: 'FAILED',
  queueJobId: null,
},
  });
}

async markQueueProcessingFailed(
  broadcastId: string,
  error?: string,
) {
  const broadcast =
    await this.prisma.broadcast.findUnique({
      where: {
        id: broadcastId,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!broadcast) {
    return null;
  }

  if (
    broadcast.status === 'COMPLETED' ||
    broadcast.status === 'FAILED' ||
    broadcast.status === 'CANCELLED'
  ) {
    return broadcast;
  }

  return this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
      status: 'FAILED',
    },
  });
}

async saveQueueJobId(
  businessId: string,
  broadcastId: string,
  jobId: string,
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

  return this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
      queueJobId: jobId,
    },
  });
}

async cancelBroadcast(
  businessId: string,
  broadcastId: string,
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

  if (broadcast.status === 'COMPLETED') {
    throw new ConflictException(
      'Completed broadcasts cannot be cancelled',
    );
  }

  if (broadcast.status === 'PROCESSING') {
    throw new ConflictException(
      'A broadcast that is currently processing cannot be cancelled',
    );
  }

  if (broadcast.status === 'CANCELLED') {
    throw new ConflictException(
      'Broadcast is already cancelled',
    );
  }

  return broadcast;
}

async markCancelled(
  businessId: string,
  broadcastId: string,
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

  return this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
  status: 'CANCELLED',
  queueJobId: null,
},
  });
}
async prepareBroadcastRetry(
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
                'FAILED',
                'WINDOW_EXPIRED',
              ],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

  if (!broadcast) {
    throw new NotFoundException(
      'Broadcast not found',
    );
  }

  if (broadcast.status !== 'FAILED') {
    throw new ConflictException(
      `Only failed broadcasts can be retried. Current status: ${broadcast.status}`,
    );
  }

  if (broadcast.recipients.length === 0) {
    throw new ConflictException(
      'Broadcast has no failed recipients to retry',
    );
  }

  await this.prisma.broadcastRecipient.updateMany({
    where: {
      broadcastId,
      status: {
        in: [
          'FAILED',
          'WINDOW_EXPIRED',
        ],
      },
    },
    data: {
  status: 'PENDING',
  deliveryStatus: null,
  error: null,
  waMessageId: null,
  sentAt: null,
},
  });

  await this.prisma.broadcast.update({
    where: {
      id: broadcastId,
    },
    data: {
  sentCount: 0,
  deliveredCount: 0,
  readCount: 0,
  failedCount: 0,
  sentAt: null,
  status: 'DRAFT',
},
  });

  return this.prisma.broadcast.findUnique({
    where: {
      id: broadcastId,
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


async updateBroadcastDeliveryStatus(
  businessId: string,
  waMessageId: string,
  status:
    | 'SENT'
    | 'DELIVERED'
    | 'READ'
    | 'FAILED',
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
      select: {
        id: true,
        broadcastId: true,
      },
    });

  if (!recipient) {
    return null;
  }

  // ==========================================================
  // SENT
  // Only move NULL -> SENT.
  // Never downgrade DELIVERED / READ / FAILED.
  // ==========================================================

  if (status === 'SENT') {
    await this.prisma.broadcastRecipient.updateMany({
      where: {
        id: recipient.id,
        deliveryStatus: null,
      },
      data: {
        deliveryStatus: 'SENT',
      },
    });

    return this.prisma.broadcastRecipient.findUnique({
      where: {
        id: recipient.id,
      },
    });
  }

  // ==========================================================
  // DELIVERED
  //
  // Only SENT/NULL can transition to DELIVERED.
  // The conditional update is atomic, preventing two
  // simultaneous Meta webhooks from incrementing twice.
  // ==========================================================

  if (status === 'DELIVERED') {
    return this.prisma.$transaction(async (tx) => {
      const updated =
        await tx.broadcastRecipient.updateMany({
          where: {
            id: recipient.id,
            OR: [
              {
                deliveryStatus: null,
              },
              {
                deliveryStatus: 'SENT',
              },
            ],
          },
          data: {
            deliveryStatus: 'DELIVERED',
          },
        });

      if (updated.count === 1) {
        await tx.broadcast.update({
          where: {
            id: recipient.broadcastId,
          },
          data: {
            deliveredCount: {
              increment: 1,
            },
          },
        });
      }

      return tx.broadcastRecipient.findUnique({
        where: {
          id: recipient.id,
        },
      });
    });
  }

  // ==========================================================
  // READ
  //
  // There are two valid transitions:
  //
  // NULL/SENT -> READ
  //     => increment read + delivered
  //
  // DELIVERED -> READ
  //     => increment read only
  //
  // Both are conditional atomic updates.
  // ==========================================================

  if (status === 'READ') {
    return this.prisma.$transaction(async (tx) => {
      // First attempt:
      // NULL/SENT -> READ
      const fromSent =
        await tx.broadcastRecipient.updateMany({
          where: {
            id: recipient.id,
            OR: [
              {
                deliveryStatus: null,
              },
              {
                deliveryStatus: 'SENT',
              },
            ],
          },
          data: {
            deliveryStatus: 'READ',
          },
        });

      if (fromSent.count === 1) {
        await tx.broadcast.update({
          where: {
            id: recipient.broadcastId,
          },
          data: {
            deliveredCount: {
              increment: 1,
            },
            readCount: {
              increment: 1,
            },
          },
        });

        return tx.broadcastRecipient.findUnique({
          where: {
            id: recipient.id,
          },
        });
      }

      // Second attempt:
      // DELIVERED -> READ
      const fromDelivered =
        await tx.broadcastRecipient.updateMany({
          where: {
            id: recipient.id,
            deliveryStatus: 'DELIVERED',
          },
          data: {
            deliveryStatus: 'READ',
          },
        });

      if (fromDelivered.count === 1) {
        await tx.broadcast.update({
          where: {
            id: recipient.broadcastId,
          },
          data: {
            readCount: {
              increment: 1,
            },
          },
        });
      }

      return tx.broadcastRecipient.findUnique({
        where: {
          id: recipient.id,
        },
      });
    });
  }

  // ==========================================================
  // FAILED
  //
  // Never downgrade an already-read recipient.
  // ==========================================================

  await this.prisma.broadcastRecipient.updateMany({
    where: {
      id: recipient.id,
      OR: [
        {
          deliveryStatus: null,
        },
        {
          deliveryStatus: 'SENT',
        },
        {
          deliveryStatus: 'DELIVERED',
        },
      ],
    },
    data: {
      deliveryStatus: 'FAILED',
      status: 'FAILED',
      error:
        error ??
        'WhatsApp delivery failed',
    },
  });

  return this.prisma.broadcastRecipient.findUnique({
    where: {
      id: recipient.id,
    },
  });
}
}