import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/Event";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const events = await Event.find({ session_id: id })
      .sort({ timestamp: 1 });

    return NextResponse.json({ events });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}