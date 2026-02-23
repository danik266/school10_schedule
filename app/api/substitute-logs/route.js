import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/substitute-logs?teacher=...&status=...&from=...&to=...&page=1&limit=20
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacher = searchParams.get("teacher") || "";
    const status  = searchParams.get("status")  || "";
    const from    = searchParams.get("from")    || "";
    const to      = searchParams.get("to")      || "";
    const page    = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit   = Math.min(100, parseInt(searchParams.get("limit") || "20"));

    const where = {};
    if (teacher) {
      where.sick_teacher_name = { contains: teacher, mode: "insensitive" };
    }
    if (status && ["success", "error"].includes(status)) {
      where.status = status;
    }
    if (from) {
      where.start_date = { gte: from };
    }
    if (to) {
      where.end_date = { lte: to };
    }

    const [total, logs] = await Promise.all([
      prisma.substitute_logs.count({ where }),
      prisma.substitute_logs.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip:  (page - 1) * limit,
        take:  limit,
      }),
    ]);

    return NextResponse.json({ success: true, logs, total, page, limit });
  } catch (error) {
    console.error("Ошибка substitute-logs GET:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/substitute-logs  body: { id } — удалить конкретную запись
export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: "id required" }, { status: 400 });
    await prisma.substitute_logs.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}