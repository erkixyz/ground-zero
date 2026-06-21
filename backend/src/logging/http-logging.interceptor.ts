import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== "http") return next.handle();

    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, session } = req;
    const userId: string | null = (session as any)?.user?.id ?? null;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          this.logger.info("http_request", {
            method,
            url: originalUrl,
            status: res.statusCode,
            duration_ms: Date.now() - start,
            user_id: userId,
            ip,
          });
        },
        error: (err: any) => {
          this.logger.error("http_request_error", {
            method,
            url: originalUrl,
            error: err.message,
            status: err.status ?? 500,
            duration_ms: Date.now() - start,
            user_id: userId,
            ip,
          });
        },
      }),
    );
  }
}
