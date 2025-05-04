import { PrismaClient } from "../../prisma/src/generated/prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  //eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();
const prisma = db;
export default prisma;
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
