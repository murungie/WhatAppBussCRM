import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';


@Controller('webhook/whatsapp')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
  ) {}

  // ==========================================================
  // META WEBHOOK VERIFICATION
  // ==========================================================

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expectedToken = this.config.get<string>(
      'WHATSAPP_VERIFY_TOKEN',
    );

    this.logger.log(
      'Webhook verification request received',
    );

    if (
      mode === 'subscribe' &&
      token === expectedToken
    ) {
      this.logger.log(
        'WhatsApp webhook verification successful',
      );

      return res
        .status(200)
        .send(challenge);
    }

    this.logger.warn(
      'WhatsApp webhook verification failed',
    );

    return res
      .status(403)
      .send('Verification failed');
  }

  // ==========================================================
  // RECEIVE WHATSAPP WEBHOOK EVENTS
  // ==========================================================

  @Post()
  async receive(
    @Body() payload: any,
    @Res() res: Response,
  ) {
    // Meta expects a fast 200 response.
    res
      .status(200)
      .send('EVENT_RECEIVED');

    try {
      // ------------------------------------------------------
      // 1. Validate basic webhook structure
      // ------------------------------------------------------

      if (
        payload?.object !== 'whatsapp_business_account'
      ) {
        this.logger.warn(
          'Received non-WhatsApp webhook payload',
        );

        return;
      }

      const entries = payload?.entry;

      if (
        !Array.isArray(entries) ||
        entries.length === 0
      ) {
        this.logger.warn(
          'WhatsApp webhook contains no entries',
        );

        return;
      }

      // ------------------------------------------------------
      // 2. Process every entry
      // ------------------------------------------------------

      for (const entry of entries) {
        const changes = entry?.changes;

        if (
          !Array.isArray(changes) ||
          changes.length === 0
        ) {
          continue;
        }

        // ----------------------------------------------------
        // 3. Process every change
        // ----------------------------------------------------

        for (const change of changes) {
          const value = change?.value;

          if (!value) {
            continue;
          }

          const phoneNumberId =
            value?.metadata?.phone_number_id;

          if (!phoneNumberId) {
            this.logger.warn(
              'Webhook event does not contain phone_number_id',
            );

            continue;
          }

          // --------------------------------------------------
          // 4. Resolve the business
          // --------------------------------------------------

          const business =
            await this.prisma.business.findFirst({
              where: {
                whatsappPhoneId: phoneNumberId,
              },
            });

          if (!business) {
            this.logger.warn(
              `No business found for WhatsApp phone_number_id ${phoneNumberId}`,
            );

            continue;
          }

          // --------------------------------------------------
          // 5. Handle inbound messages
          // --------------------------------------------------

          const messages = value?.messages;
          const contacts = value?.contacts;

          if (
            Array.isArray(messages) &&
            messages.length > 0
          ) {
            for (const message of messages) {
              await this.processInboundMessage(
                business.id,
                message,
                contacts,
              );
            }
          }

          // --------------------------------------------------
          // 6. Handle message statuses
          // --------------------------------------------------

          const statuses = value?.statuses;

          if (
            Array.isArray(statuses) &&
            statuses.length > 0
          ) {
            for (const status of statuses) {
              await this.processMessageStatus(
                business.id,
                status,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to process WhatsApp webhook payload',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  // ==========================================================
  // PROCESS INBOUND MESSAGE
  // ==========================================================

  private async processInboundMessage(
    businessId: string,
    message: any,
    contacts: any[],
  ) {
    try {
      const fromPhoneNumber = message?.from;
      const waMessageId = message?.id;
      const messageType = message?.type;

      if (
        !fromPhoneNumber ||
        !waMessageId
      ) {
        this.logger.warn(
          'Inbound WhatsApp message missing sender or message ID',
        );

        return;
      }

      // ------------------------------------------------------
      // Prevent duplicate webhook messages
      // ------------------------------------------------------

      const existingMessage =
        await this.prisma.message.findFirst({
          where: {
            waMessageId,
          },
        });

      if (existingMessage) {
        this.logger.log(
          `Ignoring duplicate WhatsApp message ${waMessageId}`,
        );

        return;
      }

      // ------------------------------------------------------
      // Get contact name
      // ------------------------------------------------------

      const contactName =
        contacts?.[0]?.profile?.name;

      // ------------------------------------------------------
      // Extract message content
      // ------------------------------------------------------

      let content: string;

      switch (messageType) {
        case 'text':
          content =
            message?.text?.body ?? '';
          break;

        case 'image':
          content =
            message?.image?.caption ??
            '[Image received]';
          break;

        case 'video':
          content =
            message?.video?.caption ??
            '[Video received]';
          break;

        case 'audio':
          content =
            '[Audio message received]';
          break;

        case 'document':
          content =
            message?.document?.caption ??
            '[Document received]';
          break;

        case 'location':
          content =
            '[Location received]';
          break;

        case 'contacts':
          content =
            '[Contact received]';
          break;

        case 'sticker':
          content =
            '[Sticker received]';
          break;

        case 'button':
          content =
            message?.button?.text ??
            '[Button response received]';
          break;

        case 'interactive':
          content =
            message?.interactive?.button_reply?.title ??
            message?.interactive?.list_reply?.title ??
            '[Interactive response received]';
          break;

        default:
          content =
            `[Unsupported message type: ${messageType}]`;
      }

      // ------------------------------------------------------
      // Save inbound message + trigger auto-reply
      // ------------------------------------------------------

      const result =
        await this.messagesService.recordInbound({
          businessId,
          fromPhoneNumber,
          content,
          waMessageId,
          contactName,
        });

      this.logger.log(
        `Inbound WhatsApp message saved: ${waMessageId}`,
      );

      // ------------------------------------------------------
      // Log auto-reply result
      // ------------------------------------------------------

      if (result?.autoReply) {
        this.logger.log(
          `Auto-reply sent for keyword "${result.autoReply.keyword}" with WhatsApp ID ${result.autoReply.message.waMessageId}`,
        );
      }

      if (result?.autoReplyError) {
        this.logger.warn(
          `Auto-reply failed: ${result.autoReplyError}`,
        );
      }
    } catch (error) {
      this.logger.error(
        'Failed to process inbound WhatsApp message',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }

  // ==========================================================
  // PROCESS WHATSAPP MESSAGE STATUS
  // ==========================================================

  private async processMessageStatus(
    businessId: string,
    status: any,
  ) {
    try {
      const waMessageId = status?.id;
      const statusValue = status?.status;

      if (!waMessageId || !statusValue) {
        return;
      }

      this.logger.log(
        `WhatsApp message ${waMessageId} status: ${statusValue}`,
      );

      // ------------------------------------------------------
      // IMPORTANT:
      // Meta provides additional error information when
      // delivery fails.
      // ------------------------------------------------------

      if (
        statusValue.toLowerCase() === 'failed'
      ) {
        const errors = status?.errors;

        if (
          Array.isArray(errors) &&
          errors.length > 0
        ) {
          this.logger.error(
            `WhatsApp delivery errors for ${waMessageId}: ${JSON.stringify(
              errors,
            )}`,
          );
        } else {
          this.logger.warn(
            `WhatsApp message ${waMessageId} failed without error details in the webhook payload`,
          );
        }
      }

      const updatedMessage =
        await this.messagesService.updateMessageStatus({
          businessId,
          waMessageId,
          status: statusValue,
        });

      if (!updatedMessage) {
        this.logger.warn(
          `No local message found for WhatsApp message ${waMessageId}`,
        );

        return;
      }

      this.logger.log(
        `Message ${updatedMessage.id} updated to ${updatedMessage.status}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process WhatsApp message status',
        error instanceof Error
          ? error.stack
          : String(error),
      );
    }
  }
}