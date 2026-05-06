// Force rebuild
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const classes = await prisma.classes.findMany({
      select: {
        class_id: true,
        class_name: true,
        students_count: true,
      },
    });

    const small = classes.filter(c => (c.students_count || 0) <= 23);
    const large = classes.filter(c => (c.students_count || 0) >= 24);

    return Response.json({ small, large });
  } catch (err) {
    console.error("classes GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { class_id, students_count } = await request.json();
    if (!class_id) {
      return Response.json({ error: "Missing class_id" }, { status: 400 });
    }
    const updated = await prisma.classes.update({
      where: { class_id: Number(class_id) },
      data: { students_count: students_count === "" ? null : Number(students_count) },
    });
    return Response.json({ success: true, class: updated });
  } catch (err) {
    console.error("classes PATCH error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}