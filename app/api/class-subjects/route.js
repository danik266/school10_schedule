
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    const where = classId ? { class_id: Number(classId) } : {};

    const bindings = await prisma.class_subjects.findMany({
      where,
      include: {
        classes: true,
        subjects: true,
        teachers: true,
      },
      orderBy: [
        { subjects: { name: 'asc' } },
        { group_type: 'asc' }
      ]
    });

    const studyPlans = await prisma.study_plan.findMany({
      where,
    });

    const bindingsWithHours = bindings.map(b => {
      const plan = studyPlans.find(sp => sp.subject_id === b.subject_id);
      return {
        ...b,
        study_plan_id: plan ? plan.study_plan_id : null,
        hours_per_week: plan ? Number(plan.hours_per_week) : 0,
        hours_per_year: plan ? plan.hours_per_year : 0,
      };
    });

    return NextResponse.json({ success: true, bindings: bindingsWithHours });
  } catch (error) {
    console.error("GET class-subjects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { class_id, subject_id, teacher_id, group_type } = await request.json();

    if (!class_id || !subject_id || !teacher_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newBinding = await prisma.class_subjects.create({
      data: {
        class_id: Number(class_id),
        subject_id: Number(subject_id),
        teacher_id: Number(teacher_id),
        group_type: group_type || "Толық сынып",
      },
      include: {
        classes: true,
        subjects: true,
      }
    });

    return NextResponse.json({ success: true, binding: newBinding });
  } catch (error) {
    console.error("POST class-subjects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    await prisma.class_subjects.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE class-subjects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, teacher_id, group_type } = await request.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const updatedBinding = await prisma.class_subjects.update({
      where: { id: Number(id) },
      data: {
        teacher_id: teacher_id ? Number(teacher_id) : undefined,
        group_type: group_type || undefined,
      },
      include: {
        classes: true,
        subjects: true,
        teachers: true,
      }
    });

    return NextResponse.json({ success: true, binding: updatedBinding });
  } catch (error) {
    console.error("PATCH class-subjects error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
