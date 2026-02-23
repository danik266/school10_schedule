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