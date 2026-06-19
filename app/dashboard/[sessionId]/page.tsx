"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// types
interface Event {
  _id: string;
  event_type: "page_view" | "click";
  timestamp: string;
  page_url?: string;
  x?: number;
  y?: number;
  doc_width?: number;
  doc_height?: number;
}

// event styling
const EVENT_CONFIG = {
  page_view: {
    bg: "bg-blue-500/10",
    text: "text-blue-300",
    border: "border-blue-500/20",
    dot: "bg-blue-400 shadow-[0_0_8px_#60a5fa]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  click: {
    bg: "bg-violet-500/10",
    text: "text-violet-300",
    border: "border-violet-500/20",
    dot: "bg-violet-400 shadow-[0_0_8px_#a78bfa]",
    icon: (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
};

// helper functions
function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortUrl(url?: string): string {
  if (!url) return "/";
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search || "/";
  } catch {
    return url;
  }
}

export default function SessionDetail() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "page_view" | "click">("all");
  const [searchUrl, setSearchUrl] = useState("");
  const router = useRouter();

  const fetchEvents = () => {
    if (!sessionId) return;
    setLoading(true);
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvents();
  }, [sessionId]);

  const clicks = events.filter((e) => e.event_type === "click").length;
  const pageViews = events.filter((e) => e.event_type === "page_view").length;
  const durationSec =
    events.length > 1
      ? Math.round(
          (new Date(events[events.length - 1].timestamp).getTime() -
            new Date(events[0].timestamp).getTime()) /
            1000
        )
      : 0;

  const filteredEvents = events.filter((e) => {
    const matchesFilter = filterType === "all" || e.event_type === filterType;
    const matchesSearch = !searchUrl || (e.page_url && e.page_url.toLowerCase().includes(searchUrl.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const durationStr =
    durationSec > 60
      ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
      : `${durationSec}s`;

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute right-1/4 top-0 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[100px]" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#070709]/80 px-8 py-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-1.5 text-sm text-white/40 transition-all hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <span className="text-white/20">/</span>
            <span className="truncate rounded-md border border-white/[0.05] bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-white/50 max-w-xs">
              {sessionId}
            </span>
          </div>
          <button
            onClick={fetchEvents}
            className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3.5 py-1.5 text-sm font-medium text-white/60 transition-all hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" />
            </svg>
            Reload
          </button>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-4xl px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Trace History</span>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">User Journey Timeline</h1>
          <p className="mt-1 font-mono text-sm text-white/40 truncate">Session: {sessionId}</p>
          {events.length > 0 && (
            <p className="mt-2 text-xs text-white/30">Recorded on {formatDate(events[0].timestamp)}</p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Events", value: events.length },
            { label: "Page Views", value: pageViews },
            { label: "Clicks", value: clicks },
            { label: "Duration", value: durationStr },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-colors hover:border-white/10">
              <p className="mb-1 text-xs font-semibold text-white/40">{s.label}</p>
              <p className="font-mono text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 md:flex-row">
          <div className="flex w-full rounded-xl border border-white/[0.05] bg-white/[0.03] p-1 md:w-auto">
            {(["all", "page_view", "click"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`flex-1 rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  filterType === t
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/10"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {t === "all" ? "All Logs" : t === "page_view" ? "Page Views" : "Clicks Only"}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Filter by Page URL…"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              className="w-full rounded-xl border border-white/[0.05] bg-white/[0.03] px-9 py-1.5 text-xs text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500/50"
            />
            <svg className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-28">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            <span className="text-sm font-medium text-white/40">Loading events…</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] py-20 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-white/40">No matching events</p>
          </div>
        ) : (
          <div className="relative">
            <div className="pointer-events-none absolute left-[20px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-violet-500/20 via-indigo-500/20 to-violet-500/10" />

            <div className="space-y-4">
              {filteredEvents.map((event, i) => {
                const cfg = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.page_view;
                return (
                  <div key={event._id} className="group flex gap-5">
                    {/* Dot */}
                    <div className="relative mt-3.5 flex-shrink-0">
                      <div className={`relative z-10 left-[16px] h-2.5 w-2.5 rounded-full ${cfg.dot} transition-transform group-hover:scale-125`} />
                    </div>

                    {/* event Card */}
                    <div className="flex-1 rounded-2xl border border-white/[0.03] bg-white/[0.01] p-5 transition-all hover:border-white/10 hover:bg-white/[0.02]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            {cfg.icon}
                            {event.event_type === "page_view" ? "Page View" : "Mouse Click"}
                          </span>
                          <span className="truncate text-sm font-semibold text-white/80 transition-colors group-hover:text-white max-w-sm md:max-w-md">
                            {shortUrl(event.page_url)}
                          </span>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className="font-mono text-[10px] text-white/20">#{i + 1}</span>
                          <span className="font-mono text-xs text-white/40">{formatTime(event.timestamp)}</span>
                        </div>
                      </div>

                      {event.page_url && (
                        <p className="mt-2 truncate font-mono text-xs text-white/30 opacity-80">{event.page_url}</p>
                      )}

                      {event.event_type === "click" && (
                        <div className="mt-3.5 grid grid-cols-2 gap-4 rounded-xl border border-white/[0.02] bg-white/[0.005] p-3 pt-3.5 md:grid-cols-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Coords</p>
                            <p className="mt-0.5 font-mono text-xs text-violet-300">X: {event.x}px, Y: {event.y}px</p>
                          </div>
                          {event.doc_width && event.doc_height && (
                            <>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Doc Size</p>
                                <p className="mt-0.5 font-mono text-xs text-indigo-300">
                                  {event.doc_width} × {event.doc_height}px
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Relative</p>
                                <p className="mt-0.5 font-mono text-xs text-emerald-300">
                                  {Math.round((event.x! / event.doc_width!) * 100)}% ,{" "}
                                  {Math.round((event.y! / event.doc_height!) * 100)}%
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* end */}
            {filteredEvents.length > 0 && (
              <div className="mt-6 flex gap-4">
                <div className="w-[10px] flex-shrink-0" />
                <div className="flex-1 rounded-xl border border-dashed border-white/[0.02] bg-white/[0.005] py-4 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/20">End of journey</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}