import { prisma } from "@/lib/prisma";

const prisma = new PrismaClient();

export async function GET() {
  const teachers = await prisma.teachers.findMany();
  return Response.json(teachers);
}
