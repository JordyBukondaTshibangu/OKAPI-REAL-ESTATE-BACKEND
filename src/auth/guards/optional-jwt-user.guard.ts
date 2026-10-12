import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Like JwtUserGuard but doesn't throw if no token is provided.
 * req.user will be undefined for unauthenticated requests.
 */
@Injectable()
export class OptionalJwtUserGuard extends AuthGuard("jwt-user") {
  handleRequest(_err: any, user: any) {
    // Return the user if authenticated, otherwise undefined (no error thrown)
    return user ?? null;
  }

  canActivate(context: ExecutionContext) {
    // Never throw on missing/invalid token — just resolve without a user
    return super.canActivate(context) as any;
  }
}
