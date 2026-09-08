import { Injectable, Logger } from '@nestjs/common';

// Thin wrapper around the Meta WhatsApp Cloud API.
// Each business has its own whatsappPhoneId + whatsappToken.
@Injectable()
export class WhatsappClientService {
  private readonly logger = new Logger(
    WhatsappClientService.name,
  );

  private readonly apiVersion = 'v21.0';

  async sendTextMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    body: string;
  }) {
    const {
      phoneNumberId,
      accessToken,
      to,
      body,
    } = params;

    const url =
      `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

    const res = await fetch(url, {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        messaging_product: 'whatsapp',

        to,

        type: 'text',

        text: {
          body,
        },
      }),
    });

    // --------------------------------------------------------
    // Handle Meta API errors
    // --------------------------------------------------------

    if (!res.ok) {
      const errorBody =
        await res.text();

      this.logger.error(
        `WhatsApp send failed: ${res.status} ${errorBody}`,
      );

      throw new Error(
        `WhatsApp API error (${res.status}): ${errorBody}`,
      );
    }

    // --------------------------------------------------------
    // Successful response
    // --------------------------------------------------------

    return res.json();
  }

  async sendTemplateMessage(params: {
  phoneNumberId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  parameters?: string[];
}) {
  const {
    phoneNumberId,
    accessToken,
    to,
    templateName,
    languageCode,
    parameters = [],
  } = params;

  const url =
    `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;

  const bodyParameters = parameters.map(
    (value) => ({
      type: 'text',
      text: value,
    }),
  );

  const payload = {
    messaging_product: 'whatsapp',
    to: to.trim().replace(/\D/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      ...(bodyParameters.length > 0
        ? {
            components: [
              {
                type: 'body',
                parameters: bodyParameters,
              },
            ],
          }
        : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',

    headers: {
      Authorization:
        `Bearer ${accessToken}`,
      'Content-Type':
        'application/json',
    },

    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.text();

    this.logger.error(
      `WhatsApp template send failed: ${res.status} ${errorBody}`,
    );

    throw new Error(
      `WhatsApp template API error (${res.status}): ${errorBody}`,
    );
  }

  return res.json();
}
}