// src/utils/jwt-auth.guard.ts
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext) {
    const can = await super.canActivate(context); // Await parent guard
    if (!can) return false;

    const request = context.switchToHttp().getRequest();
    if (!request.user) return false; // Safety check

    return true; // JWT validated, let RolesGuard decide roles
  }
}
