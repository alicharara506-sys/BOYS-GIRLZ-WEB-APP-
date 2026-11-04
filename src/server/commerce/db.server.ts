import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as typeof globalThis & { bngPrisma?: PrismaClient };
export const commerceEnabled = () => process.env.BNG_COMMERCE === "1";
export const db =
  globalDb.bngPrisma ||
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://bng:localdemo@127.0.0.1:55432/bng",
    }),
  });
if (process.env.NODE_ENV !== "production") globalDb.bngPrisma = db;
