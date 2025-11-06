import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const cabinets = await prisma.cabinets.findMany({
      select: {
        room_id: true,
        room_number: true,
        room_name: true,
      },
      orderBy: { room_number: "asc" },
    });

    return NextResponse.json(cabinets);
  } catch (error) {
    console.error("Ошибка при получении кабинетов:", error);
    return NextResponse.json(
      { error: "Ошибка при загрузке кабинетов" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const cabinet = await prisma.cabinets.create({
      data: {
        room_number: data.room_number,
        room_name: data.room_name || null,
      },
    });

    return NextResponse.json(cabinet);
  } catch (error) {
    console.error("Ошибка при добавлении кабинета:", error);
    return NextResponse.json(
      { error: "Ошибка при добавлении кабинета" },
      { status: 500 }
    );
  }
}
