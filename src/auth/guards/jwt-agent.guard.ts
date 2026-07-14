import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAgentGuard extends AuthGuard("jwt-agent") {}
