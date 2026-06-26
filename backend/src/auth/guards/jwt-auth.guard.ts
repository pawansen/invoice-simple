import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that enforces a valid Bearer JWT. Applied to every protected route
 * (all /invoices endpoints and /auth/me). Delegates to the 'jwt' Passport
 * strategy; on failure Passport throws 401 Unauthorized.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
