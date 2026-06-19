"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// heatmap click type
interface Click {
  x: number;
  y: number;
  doc_width?: number;
  doc_height?: number;
}

type DevicePreset = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTHS: Record<DevicePreset, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search || "/";
  } catch {
    return url;
  }
}

export default function Heatmap() {
  const [urls, setUrls] = useState<string[]>([]);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [clicks, setClicks] = useState<Click[]>([]);
  const [loading, setLoading] = useState(false);
  const [iframeHeight, setIframeHeight] = useState(600);
  const [deviceWidth, setDeviceWidth] = useState<DevicePreset>("desktop");
  const [radius, setRadius] = useState(35);
  const [opacity, setOpacity] = useState(0.85);
  const [coordinateMode, setCoordinateMode] = useState<"scaled" | "absolute">("scaled");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const router = useRouter();

  // api call to get all pages visited across sessions
  useEffect(() => {
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => {
        const all = d.sessions || [];
        const pages = [...new Set(all.flatMap((s: any) => s.pages_visited || []))] as string[];
        if (pages.length === 0) {
          const fallback = window.location.origin + "/demo.html";
          setUrls([fallback]);
          setSelectedUrl(fallback);
        } else {
          setUrls(pages);
          setSelectedUrl(pages[0]);
        }
      })
      .catch(() => {
        const fallback = window.location.origin + "/demo.html";
        setUrls([fallback]);
        setSelectedUrl(fallback);
      });
  }, []);

  // api call to get clicks for the selected page
  const fetchClicks = () => {
    if (!selectedUrl) return;
    setLoading(true);
    fetch(`/api/heatmap?page_url=${encodeURIComponent(selectedUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        setClicks(d.clicks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchClicks();
  }, [selectedUrl]);

  // Iframe path
  const getIframePath = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return "/demo.html";
    }
  };

  // measuring iframe content height
  const handleIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        setTimeout(() => {
          const height = Math.max(
            doc.documentElement.scrollHeight,
            doc.body.scrollHeight,
            600
          );
          setIframeHeight(height);
        }, 300);
      }
    } catch {
      setIframeHeight(800);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleIframeLoad, 400);
    return () => clearTimeout(timer);
  }, [deviceWidth]);

  // heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (clicks.length === 0) return;

    // grayscale density
    clicks.forEach((click) => {
      let clickX = click.x;
      let clickY = click.y;

      if (coordinateMode === "scaled" && click.doc_width && click.doc_height) {
        clickX = (click.x / click.doc_width) * W;
        clickY = (click.y / click.doc_height) * H;
      }

      const grad = ctx.createRadialGradient(clickX, clickY, 2, clickX, clickY, radius);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(clickX, clickY, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Colorize
    try {
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;

      const colorCanvas = document.createElement("canvas");
      colorCanvas.width = 1;
      colorCanvas.height = 256;
      const cCtx = colorCanvas.getContext("2d");
      if (cCtx) {
        const rampGrad = cCtx.createLinearGradient(0, 0, 0, 256);
        rampGrad.addColorStop(0.0, "rgba(59,130,246,0.0)");
        rampGrad.addColorStop(0.2, "rgba(59,130,246,0.6)");
        rampGrad.addColorStop(0.4, "rgba(16,185,129,0.7)");
        rampGrad.addColorStop(0.75, "rgba(245,158,11,0.85)");
        rampGrad.addColorStop(1.0, "rgba(239,68,68,0.95)");
        cCtx.fillStyle = rampGrad;
        cCtx.fillRect(0, 0, 1, 256);
        const palette = cCtx.getImageData(0, 0, 1, 256).data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            const lookup = alpha * 4;
            data[i] = palette[lookup];
            data[i + 1] = palette[lookup + 1];
            data[i + 2] = palette[lookup + 2];
            data[i + 3] = palette[lookup + 3] * opacity;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }
    } catch (err) {
      console.error("Heatmap coloring error:", err);
    }
  }, [clicks, radius, opacity, coordinateMode, iframeHeight]);

  return (
    <div className="min-h-screen bg-[#070709] text-white">
      {/* glow */}
      <div className="pointer-events-none absolute right-1/3 top-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[130px]" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#070709]/80 px-8 py-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-lg shadow-violet-500/20">
              <img src="/CFLogo.png" alt="" />
            </div>
            <div>
              <span className="block text-base font-bold leading-tight tracking-tight">Causal Funnel</span>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/40">Heatmap Analytics</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchClicks}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-2.5 transition-colors hover:border-white/10 hover:bg-white/[0.06]"
              title="Reload clicks"
            >
              <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" />
              </svg>
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-2 text-sm font-semibold text-white/70 transition-all hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
            >
              ← Sessions
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">Visual Telemetry</span>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Click Heatmap</h1>
            <p className="text-sm text-white/40">Analyze where and how users click on your pages.</p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3 backdrop-blur-md lg:w-auto">
            <span className="pl-2 text-xs font-semibold uppercase tracking-widest text-white/40">Target</span>
            <select
              value={selectedUrl}
              onChange={(e) => setSelectedUrl(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white outline-none transition-colors hover:border-white/20 focus:border-violet-500/50 lg:w-72"
            >
              {urls.map((url) => (
                <option key={url} value={url} className="bg-[#0f0f13] text-white">
                  {shortUrl(url)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Volume */}
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-violet-500/5 blur-xl" />
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Telemetry Volume</p>
              <p className="mt-2 font-mono text-4xl font-extrabold">{clicks.length}</p>
              <p className="mt-1.5 text-[11px] text-white/30">Clicks on this page</p>
            </div>

            {/* Config */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5 space-y-5">
              <h3 className="border-b border-white/[0.04] pb-2.5 text-sm font-bold">Heatmap Configuration</h3>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-white/50">Blur Radius</span>
                  <span className="font-mono text-violet-400">{radius}px</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="70"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.06] accent-violet-500"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-white/50">Overlay Opacity</span>
                  <span className="font-mono text-violet-400">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/[0.06] accent-violet-500"
                />
              </div>

              <div>
                <span className="mb-2 block text-xs text-white/50">Coordinate Normalization</span>
                <div className="grid grid-cols-2 rounded-xl border border-white/[0.05] bg-white/[0.03] p-1">
                  <button
                    onClick={() => setCoordinateMode("scaled")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                      coordinateMode === "scaled"
                        ? "bg-violet-600 text-white"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    Scaled
                  </button>
                  <button
                    onClick={() => setCoordinateMode("absolute")}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${
                      coordinateMode === "absolute"
                        ? "bg-violet-600 text-white"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    Absolute
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-white/25">
                  Scaled adjusts coordinates to fit different viewport widths.
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-5">
              <h3 className="mb-2 text-sm font-bold">How it works</h3>
              <ul className="list-inside list-disc space-y-2 text-xs text-white/40">
                <li>Captures clicks relative to the page origin.</li>
                <li>Normalizes using document width/height.</li>
                <li>Renders a canvas matching the page's height.</li>
              </ul>
              <a
                href="/demo.html"
                target="_blank"
                className="mt-4 block rounded-xl border border-violet-500/10 bg-violet-500/5 p-2 text-center text-xs font-semibold text-violet-400 transition-all hover:border-violet-500/20 hover:text-violet-300"
              >
                Visit Demo Page
              </a>
            </div>
          </div>

          {/* Viewport + Canvas */}
          <div className="lg:col-span-3 space-y-4">
            {/* Viewport controls */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/[0.04] bg-[#0b0b0f] p-3.5 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/40" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/40" />
                <div className="h-3 w-3 rounded-full bg-emerald-500/40" />
                <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-white/30 truncate max-w-[200px]">
                  {shortUrl(selectedUrl)}
                </span>
              </div>
              <div className="flex rounded-xl border border-white/[0.05] bg-white/[0.03] p-1">
                {(["desktop", "tablet", "mobile"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDeviceWidth(preset)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                      deviceWidth === preset
                        ? "bg-violet-600 text-white"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {preset === "desktop" && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {preset === "tablet" && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    {preset === "mobile" && (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    )}
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Iframe + Canvas container */}
            <div className="relative rounded-3xl border border-white/[0.03] bg-white/[0.005] p-1.5">
              {loading && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-3xl bg-[#070709]/60 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  <span className="mt-3 text-sm font-semibold text-white/40">Loading telemetry…</span>
                </div>
              )}

              <div
                className="relative max-h-[700px] overflow-auto rounded-2xl border border-white/5 bg-white shadow-2xl transition-all duration-300 ease-in-out"
                style={{
                  width: `${DEVICE_WIDTHS[deviceWidth]}px`,
                  maxWidth: "100%",
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={getIframePath(selectedUrl)}
                  style={{ width: "100%", height: `${iframeHeight}px`, border: "none", pointerEvents: "auto" }}
                  onLoad={handleIframeLoad}
                />
                <canvas
                  ref={canvasRef}
                  width={DEVICE_WIDTHS[deviceWidth]}
                  height={iframeHeight}
                  className="pointer-events-none absolute left-0 top-0 opacity-90 mix-blend-multiply"
                  style={{ width: "100%", height: `${iframeHeight}px` }}
                />
              </div>
            </div>

            {/* Density legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 text-xs text-white/30">
              <span>Canvas: {DEVICE_WIDTHS[deviceWidth]}px × {iframeHeight}px</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-blue-500/60" />
                  <span>Cold</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-emerald-500/70" />
                  <span>Warm</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 animate-pulse rounded bg-red-500/90" />
                  <span>Peak</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}