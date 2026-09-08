import { AutoRepliesService } from './auto-replies.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
export declare class AutoRepliesController {
    private readonly autoRepliesService;
    constructor(autoRepliesService: AutoRepliesService);
    create(req: any, dto: CreateAutoReplyDto): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }>;
    findAll(req: any): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }[]>;
    findOne(req: any, id: string): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }>;
    remove(req: any, id: string): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }>;
}
