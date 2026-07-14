import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditLogsService } from "../audit-logs.service";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const user = req.user;
        if (!user || user.role !== "admin") return;

        const { method, url, params, body } = req;
        if (!["POST", "PATCH", "PUT", "DELETE"].includes(method)) return;

        const action = this.deriveAction(method, url);
        const resource = this.deriveResource(url);
        const resourceId = params?.id;
        // Extract only key scalar fields — avoids truncating large payloads
        // which breaks JSON.parse on the display side.
        const details =
          ["POST", "PATCH", "PUT"].includes(method) && body
            ? JSON.stringify(this.extractKeyFields(body))
            : undefined;

        this.auditLogsService
          .log({ adminId: user.adminId ?? user.sub, action, resource, resourceId, details })
          .catch((err) =>
            this.logger.error(
              `Audit log failed [${action} ${resource}]: ${err?.message}`,
              err?.stack,
            ),
          );
      }),
    );
  }

  private deriveAction(method: string, url: string): string {
    if (url.includes("logout")) return "LOGOUT";
    const map: Record<string, string> = {
      POST: "CREATE",
      PATCH: "UPDATE",
      PUT: "UPDATE",
      DELETE: "DELETE",
    };
    return map[method] ?? method;
  }

  private deriveResource(url: string): string {
    const parts = url.split("/").filter(Boolean);
    if (parts[0] === "auth") return parts.slice(0, 2).join("/");
    return parts[0] ?? "unknown";
  }

  /**
   * Picks only the human-readable scalar fields from a request body.
   * Arrays and objects are included selectively (e.g. communes as count).
   * This keeps audit log details small and always valid JSON.
   */
  private extractKeyFields(body: Record<string, unknown>): Record<string, unknown> {
    const SCALAR_KEYS = [
      "name", "email", "phone", "phoneNumber", "agentType", "agencyId",
      "verificationTier", "verificationStatus", "title", "specialization",
      "nationality", "bio", "tagline", "monogram", "rccmNumber",
      "rentalFocus", "plan", "website", "address", "founded",
      "freeListingCap", "gracePeriodEndsAt",
    ];
    const result: Record<string, unknown> = {};
    for (const key of SCALAR_KEYS) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== "") {
        result[key] = body[key];
      }
    }
    // Include array field counts (not values) to avoid bloat
    for (const key of ["communes", "propertyTypes", "languages", "specializations", "certifications"]) {
      if (Array.isArray(body[key]) && (body[key] as unknown[]).length > 0) {
        result[`${key}Count`] = (body[key] as unknown[]).length;
      }
    }
    return result;
  }
}
