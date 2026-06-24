import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtAgentStrategy extends PassportStrategy(Strategy, "jwt-agent") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET ?? "secret",
    });
  }

  validate(payload: { sub: string; role: string }) {
    if (payload.role !== "agent") throw new UnauthorizedException();
    return { agentId: payload.sub, role: payload.role };
  }
}
