import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  const classes = await prisma.classes.findMany({
    select: {
      class_id: true,
      class_name: true,
      students_count: true,
      subject_id: selectedSubjectId,
    },
  });

  const small = classes.filter(c => (c.students_count || 0) <= 23);
  const large = classes.filter(c => (c.students_count || 0) >= 24);

  return Response.json({ small, large });
}
