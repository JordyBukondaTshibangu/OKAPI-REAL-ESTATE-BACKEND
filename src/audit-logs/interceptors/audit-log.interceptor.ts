import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AuditLogsService } from "../audit-logs.service";

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogsService: AuditLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || user.role !== "admin") {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const { method, url, params, body } = req;
        const action = this.deriveAction(method, url);
        const resource = this.deriveResource(url);
        const resourceId = params?.id;
        const details =
          ["POST", "PATCH", "PUT"].includes(method) && body
            ? JSON.stringify(body).substring(0, 500)
            : undefined;

        this.auditLogsService
          .log({ adminId: user.adminId, action, resource, resourceId, details })
          .catch(() => {});
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
      GET: "READ",
    };
    return map[method] ?? method;
  }

  private deriveResource(url: string): string {
    const parts = url.split("/").filter(Boolean);
    if (parts[0] === "auth") return parts.slice(0, 2).join("/");
    return parts[0] ?? "unknown";
  }
}
