import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const cabinets = await prisma.cabinets.findMany({
      orderBy: { room_number: "asc" },
      select: {
        room_id: true,
        room_number: true,
        room_name: true,
      },
    });

    return new Response(
      JSON.stringify({ success: true, cabinets }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Ошибка при получении кабинетов:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
