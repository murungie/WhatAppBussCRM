export declare enum BroadcastType {
    TEXT = "TEXT",
    TEMPLATE = "TEMPLATE"
}
export declare class CreateBroadcastDto {
    type?: BroadcastType;
    message?: string;
    templateName?: string;
    templateLanguage?: string;
    templateParameters?: string[];
    segment?: string;
}
