import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// POST /api/snapshots/restore — восстановить снапшот по id
// Body: { id: 5 }
export async function POST(req) {
  try {
    const { id } = await req.json();
    const snapshot = await prisma.schedule_snapshots.findUnique({
      where: { id: Number(id) },
    });
    if (!snapshot) {
      return new Response(JSON.stringify({ error: "Снапшот не найден" }), { status: 404 });
    }
    const rows = snapshot.data;
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "Снапшот пустой" }), { status: 400 });
    }
    await prisma.schedule.deleteMany({});
    await prisma.schedule.createMany({ data: rows });
    return new Response(JSON.stringify({ success: true, count: rows.length }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}