import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/Event";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page_url = searchParams.get("page_url");

    if (!page_url) {
      return NextResponse.json({ error: "a page_url is required" }, { status: 400 });
    }

    const clicks = await Event.find({
      event_type: "click",
      page_url: page_url
    }).select("x y doc_width doc_height -_id");

    return NextResponse.json({ clicks });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}