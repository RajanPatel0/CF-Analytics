import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Event from "@/lib/Event";

export async function GET() {
  try {
    await connectDB();

    const sessions = await Event.aggregate([
      {
        $group: {
          _id: "$session_id",
          event_count: { $sum: 1 },
          first_seen: { $min: "$timestamp" },
          last_seen: { $max: "$timestamp" },
          pages_visited: { $addToSet: "$page_url" }
        }
      },
      { $sort: { last_seen: -1 } }
    ]);

    return NextResponse.json({ sessions });
  } catch (err) {
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}