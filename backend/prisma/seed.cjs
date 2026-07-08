/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL }),
});

const users = [
  {
    id: "u-lider-operaciones",
    name: "Mariana Gómez",
    email: "mariana.gomez@incomineria.com",
    company: "Incominería",
    role: "LIDER_PROCESO",
    process: "Operaciones",
  },
  {
    id: "u-calidad",
    name: "Gestión de Calidad",
    email: "calidad@incomineria.com",
    company: "Incominería",
    role: "GESTION_CALIDAD",
  },
  {
    id: "u-gerencia",
    name: "Gerencia Administrativa",
    email: "gerencia@incomineria.com",
    company: "Incominería",
    role: "GERENCIA_ADMINISTRATIVA",
  },
  {
    id: "u-lider-mantenimiento",
    name: "Carlos Rincón",
    email: "carlos.rincon@incomineria.com",
    company: "Incominería",
    role: "LIDER_PROCESO",
    process: "Mantenimiento",
  },
  {
    id: "u-jefe-hse",
    name: "Laura Pérez",
    email: "laura.perez@incomineria.com",
    company: "Incominería",
    role: "APROBADOR_ADICIONAL",
    process: "Gestión HSE",
  },
];

async function main() {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { ...user, active: true },
      create: { ...user, active: true },
    });
  }
  console.log(`Base lista: ${users.length} usuarios iniciales verificados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
