
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
