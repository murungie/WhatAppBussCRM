
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const GRAPH_VERSION = 'v26.0';

@Injectable()
export class WhatsAppConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async connect(
    businessId: string,
    input: {
      code: string;
      wabaId: string;
      phoneNumberId: string;
    },
  ) {
    const appId =
      this.config.getOrThrow<string>('META_APP_ID');
    const appSecret =
      this.config.getOrThrow<string>('META_APP_SECRET');

    const exchangeUrl = new URL(
      `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
    );

    exchangeUrl.searchParams.set('client_id', appId);
    exchangeUrl.searchParams.set('client_secret', appSecret);
    exchangeUrl.searchParams.set('code', input.code);

    let exchangeResponse: Response;

    try {
      exchangeResponse = await fetch(exchangeUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new InternalServerErrorException(
        'Could not contact Meta to complete WhatsApp authorization',
      );
    }

    if (!exchangeResponse.ok) {
      throw new UnauthorizedException(
        'Meta authorization code was rejected or has expired. Please try connecting again.',
      );
    }

    const tokenResult: unknown =
      await exchangeResponse.json();

    if (
      !tokenResult ||
      typeof tokenResult !== 'object' ||
      !('access_token' in tokenResult) ||
      typeof tokenResult.access_token !== 'string' ||
      !tokenResult.access_token
    ) {
      throw new UnauthorizedException(
        'Meta did not return a valid access token',
      );
    }

    const accessToken = tokenResult.access_token;

    const graphGet = async (
      path: string,
    ): Promise<unknown> => {
      let response: Response;

      try {
        response = await fetch(
          `https://graph.facebook.com/${GRAPH_VERSION}/${path}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            signal: AbortSignal.timeout(15000),
          },
        );
      } catch {
        throw new InternalServerErrorException(
          'Could not verify the WhatsApp account with Meta',
        );
      }

      if (!response.ok) {
        throw new UnauthorizedException(
          'Meta could not verify the selected WhatsApp account or phone number',
        );
      }

      return response.json();
    };

    const [wabaResult, phoneResult] =
      await Promise.all([
        graphGet(
          `${encodeURIComponent(input.wabaId)}?fields=id`,
        ),
        graphGet(
          `${encodeURIComponent(input.wabaId)}/phone_numbers?fields=id`,
        ),
      ]);

    if (
      !wabaResult ||
      typeof wabaResult !== 'object' ||
      !('id' in wabaResult) ||
      wabaResult.id !== input.wabaId
    ) {
      throw new UnauthorizedException(
        'Meta did not verify the selected WhatsApp Business Account',
      );
    }

    if (
      !phoneResult ||
      typeof phoneResult !== 'object' ||
      !('data' in phoneResult) ||
      !Array.isArray(phoneResult.data)
    ) {
      throw new UnauthorizedException(
        'Meta did not return the phone numbers for this account',
      );
    }

    const phoneBelongsToWaba =
      phoneResult.data.some(
        (phone: unknown) =>
          !!phone &&
          typeof phone === 'object' &&
          'id' in phone &&
          phone.id === input.phoneNumberId,
      );

    if (!phoneBelongsToWaba) {
      throw new UnauthorizedException(
        'The selected phone number does not belong to the verified WhatsApp Business Account',
      );
    }

    const existingPhone =
      await this.prisma.business.findFirst({
        where: {
          whatsappPhoneId: input.phoneNumberId,
          NOT: { id: businessId },
        },
        select: { id: true },
      });

    if (existingPhone) {
      throw new ConflictException(
        'This WhatsApp phone number is already connected to another CRM business',
      );
    }

    try {
      await this.prisma.business.update({
        where: { id: businessId },
        data: {
          wabaId: input.wabaId,
          whatsappPhoneId: input.phoneNumberId,
          whatsappToken: accessToken,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This WhatsApp phone number is already connected to another CRM business',
        );
      }

      throw error;
    }

    return {
      connected: true,
      wabaId: input.wabaId,
      phoneNumberId: input.phoneNumberId,
    };
  }
}
