import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/Event";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const event = await Event.create({
      session_id: body.session_id,
      event_type: body.event_type,
      page_url: body.page_url,
      timestamp: body.timestamp,
      x: body.x ?? null,
      y: body.y ?? null,
      doc_width: body.doc_width ?? null,
      doc_height: body.doc_height ?? null,
    });

    return NextResponse.json({ success: true, event });
  } catch (err) {
    if (err instanceof Error) { 
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}