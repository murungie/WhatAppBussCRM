export declare class WhatsappClientService {
    private readonly logger;
    private readonly apiVersion;
    sendTextMessage(params: {
        phoneNumberId: string;
        accessToken: string;
        to: string;
        body: string;
    }): Promise<any>;
    sendTemplateMessage(params: {
        phoneNumberId: string;
        accessToken: string;
        to: string;
        templateName: string;
        languageCode: string;
        parameters?: string[];
    }): Promise<any>;
}
