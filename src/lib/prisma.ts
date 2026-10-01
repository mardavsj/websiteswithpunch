import { PrismaClient } from "@prisma/client";

/**
 * One client per server instance. Kept on globalThis in every environment so dev hot reloads and
 * warm serverless invocations reuse the same connection pool instead of opening new ones.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
