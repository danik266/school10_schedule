import { prisma } from "@/lib/prisma";

const prisma = new PrismaClient();

export async function GET(req, { params: paramsPromise }) {
  const params = await paramsPromise;
  const classId = Number(params.classId);

  try {
    const studyPlans = await prisma.study_plan.findMany({
      where: { class_id: classId },
      include: { subjects: true }, // имя связи из schema.prisma
    });

    const subjects = studyPlans.map((sp) => ({
      subject_id: sp.subject_id,
      name: sp.subjects.name,
      hours_per_week: sp.hours_per_week,
      hours_per_year: sp.hours_per_year,
    }));

    return Response.json(subjects);
  } catch (err) {
    console.error("Ошибка при получении предметов:", err);
    return new Response(
      JSON.stringify({ error: "Ошибка на сервере", details: err.message }),
      { status: 500 }
    );
  }
}
