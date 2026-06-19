"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// session types
interface Session {
  _id: string;
  event_count: number;
  pages_visited: string[];
  first_seen: string;
  last_seen: string;
}

// session helper functions for formatting time and duration
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function duration(first: string, last: string): string {
  const diff = new Date(last).getTime() - new Date(first).getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  if (mins < 1) return `${secs}s`;
  return `${mins}m ${secs % 60}s`;
}

// component for session row in the table
interface SessionRowProps {
  session: Session;
  onClick: () => void;
}

function SessionRow({ session, onClick }: SessionRowProps) {
  const pages = session.pages_visited?.length || 0;
  return (
    <tr
      onClick={onClick}
      className="group cursor-pointer border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500" />
          </span>
          <span className="font-mono text-sm text-white/80 group-hover:text-white">
            {session._id.slice(0, 12)}…
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
          {session.event_count} events
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-white/70">
        {pages} page{pages !== 1 ? "s" : ""}
      </td>
      <td className="px-6 py-4 font-mono text-sm text-white/70">
        {duration(session.first_seen, session.last_seen)}
      </td>
      <td className="px-6 py-4 text-sm text-white/50">
        {timeAgo(session.last_seen)}
      </td>
      <td className="px-6 py-4 text-right">
        <span className="inline-flex items-center text-xs font-medium text-violet-400 transition-all group-hover:translate-x-1 group-hover:text-violet-300">
          View Journey
          <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </td>
    </tr>
  );
}

// dashboard
export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchSessions = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error loading sessions:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = sessions.filter((s) =>
    s._id.toLowerCase().includes(search.toLowerCase())
  );

  const totalEvents = sessions.reduce((a, s) => a + s.event_count, 0);
  const avgEvents = sessions.length
    ? Math.round((totalEvents / sessions.length) * 10) / 10
    : 0;
  const interactiveSessions = sessions.filter((s) => s.event_count > 1).length;
  const engagementRate = sessions.length
    ? Math.round((interactiveSessions / sessions.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* glows */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#070709]/80 px-8 py-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
              <img src="/CFLogo.png" alt="CausalFunnel Logo" />
            </div>
            <div>
              <span className="block text-base font-bold leading-tight tracking-tight">Causal Funnel</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">Session Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/heatmap")}
              className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-2 text-sm font-medium text-white/70 transition-all hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
            >
              <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Heatmap
            </button>
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Live</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-8 py-10">
        {/* header */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-4xl font-extrabold tracking-tight">
              Visitor Sessions
            </h1>
            <p className="mt-2 max-w-xl text-base text-white/50">
              Track active users, view ordered journeys, and analyze mouse interactions in real‑time.
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-950/20 to-indigo-950/20 p-5 backdrop-blur-md">
            <div>
              <span className="rounded border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-400">
                Sandbox
              </span>
              <h3 className="mt-2 text-sm font-semibold">Generate test data</h3>
              <p className="mt-1 text-xs text-white/40">
                Open the demo store, click around, and watch sessions appear here.
              </p>
            </div>
            <a
              href="/demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-center text-xs font-medium text-white shadow-lg shadow-violet-600/15 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-95"
            >
              Open Demo Page
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* stats */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Captured Sessions",
              value: sessions.length,
              desc: "Total unique sessions",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
            },
            {
              label: "Total Events",
              value: totalEvents,
              desc: "Clicks & page views",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
            },
            {
              label: "Average Interactions",
              value: `${avgEvents} events`,
              desc: "Per session",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />,
            },
            {
              label: "Engagement Rate",
              value: `${engagementRate}%`,
              desc: "Active vs passive users",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative rounded-2xl border border-white/[0.04] bg-white/[0.02] p-5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{stat.label}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]">
                  <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {stat.icon}
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-3xl font-extrabold">{stat.value}</p>
              <p className="mt-1 text-[11px] text-white/30">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* sessions table */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] backdrop-blur-md">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-white/[0.04] px-6 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold">All Active Sessions</h2>
              <p className="text-xs text-white/40">Select a session to trace the exact user journey</p>
            </div>
            <div className="flex w-full items-center gap-3 md:w-auto">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search session ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.04] px-9 py-2 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-violet-500/50"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={() => fetchSessions(false)}
                disabled={refreshing}
                className="flex items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-all hover:border-white/10 hover:bg-white/[0.06] disabled:opacity-50"
              >
                <svg className={`h-4 w-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" />
                </svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-28">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <span className="text-sm font-medium text-white/40">Fetching sessions…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <svg className="mb-4 h-12 w-12 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-white/50">No sessions found</p>
              <p className="mt-1 max-w-sm text-xs text-white/20">Generate data by opening the demo page and clicking around.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                    {["Session", "Events", "Pages", "Duration", "Last Seen", ""].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {filtered.map((s) => (
                    <SessionRow key={s._id} session={s} onClick={() => router.push(`/dashboard/${s._id}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}