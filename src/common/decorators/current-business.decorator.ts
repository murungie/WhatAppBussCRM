import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Pulls the authenticated business (tenant) off the request, set by JwtStrategy.validate()
export const CurrentBusiness = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // { businessId, email }
  },
);
