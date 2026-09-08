import { PrismaService } from '../prisma/prisma.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
export declare class AutoRepliesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(businessId: string, dto: CreateAutoReplyDto): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }>;
    findAll(businessId: string): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }[]>;
    findOne(businessId: string, id: string): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        keyword: string;
        response: string;
        isActive: boolean;
    }>;
    remove(businessId: string, id: string): Promise<{
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
