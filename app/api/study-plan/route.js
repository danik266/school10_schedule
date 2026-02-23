import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/study-plan?classId=1
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = Number(searchParams.get("classId"));
    if (!classId) return Response.json({ error: "classId required" }, { status: 400 });

    const rows = await prisma.study_plan.findMany({
      where: { class_id: classId },
      include: { subjects: { select: { name: true } } },
      orderBy: { study_plan_id: "asc" },
    });

    return Response.json({ success: true, rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — обновить часы
export async function PATCH(req) {
  try {
    const { study_plan_id, hours_per_week, hours_per_year } = await req.json();
    if (!study_plan_id) return Response.json({ error: "study_plan_id required" }, { status: 400 });

    const updated = await prisma.study_plan.update({
      where: { study_plan_id: Number(study_plan_id) },
      data: {
        ...(hours_per_week !== undefined && { hours_per_week: Number(hours_per_week) }),
        ...(hours_per_year !== undefined && { hours_per_year: Number(hours_per_year) }),
      },
    });

    return Response.json({ success: true, row: updated });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — добавить предмет в план
export async function POST(req) {
  try {
    const { class_id, subject_name, hours_per_week, hours_per_year } = await req.json();
    if (!class_id || !subject_name) {
      return Response.json({ error: "class_id и subject_name обязательны" }, { status: 400 });
    }

    let subject = await prisma.subjects.findFirst({
      where: { name: { equals: subject_name.trim(), mode: "insensitive" } },
    });

    if (!subject) {
      subject = await prisma.subjects.create({
        data: { name: subject_name.trim() },
      });
    }

    const exists = await prisma.study_plan.findFirst({
      where: { class_id: Number(class_id), subject_id: subject.subject_id },
    });
    if (exists) {
      return Response.json({ error: "Этот предмет уже есть в учебном плане класса" }, { status: 400 });
    }

    const row = await prisma.study_plan.create({
      data: {
        class_id: Number(class_id),
        subject_id: subject.subject_id,
        hours_per_week: Number(hours_per_week) || 1,
        hours_per_year: Number(hours_per_year) || 34,
      },
      include: { subjects: { select: { name: true } } },
    });

    return Response.json({ success: true, row });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — удалить запись
export async function DELETE(req) {
  try {
    const { study_plan_id } = await req.json();
    if (!study_plan_id) return Response.json({ error: "study_plan_id required" }, { status: 400 });

    await prisma.study_plan.delete({
      where: { study_plan_id: Number(study_plan_id) },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}