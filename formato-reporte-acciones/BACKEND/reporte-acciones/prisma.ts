import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  reporteAccionesPrisma?: PrismaClient;
};

function createPrismaClient() {
  loadWorkspaceEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function loadWorkspaceEnv() {
  if (process.env.DATABASE_URL) return;

  const candidates = [path.join(process.cwd(), ".env"), path.join(process.cwd(), "..", ".env")];
  const envPath = candidates.find((candidate) => existsSync(candidate));
  if (!envPath) return;

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (!key || process.env[key]) continue;

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function getPrismaClient() {
  if (!globalForPrisma.reporteAccionesPrisma) {
    globalForPrisma.reporteAccionesPrisma = createPrismaClient();
  }

  return globalForPrisma.reporteAccionesPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrismaClient(), prop, receiver);
  },
});
