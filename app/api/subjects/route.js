import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const subjects = await prisma.subjects.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, message: "Имя предмета обязательно" }, { status: 400 });
    
    const subject = await prisma.subjects.create({
      data: { name: body.name.trim() }
    });
    return NextResponse.json({ success: true, subject });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    if (!body.id || !body.name) return NextResponse.json({ success: false, message: "ID и имя обязательны" }, { status: 400 });
    
    const subject = await prisma.subjects.update({
      where: { subject_id: Number(body.id) },
      data: { name: body.name.trim() }
    });
    return NextResponse.json({ success: true, subject });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, message: "ID обязателен" }, { status: 400 });
    
    await prisma.subjects.delete({
      where: { subject_id: Number(body.id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
