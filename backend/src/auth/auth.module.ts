import { Module } from "@nestjs/common";

// Auth is handled by Better Auth middleware in main.ts (mounted at /api/auth/*)
@Module({})
export class AuthModule {}
