# CausalFunnel Analytics

A lightweight session analytics and click heatmap tracker — built as part of the CausalFunnel Full Stack Engineer assignment.

It does what the big tools do, stripped to the core: drop a script on any webpage, and start seeing exactly what users do — which pages they hit, where they click, how long they stay.

---

## What's inside

**Tracking script** (`public/tracker.js`) — a self-contained JS snippet that auto-generates a session ID, tracks `page_view` and `click` events, and ships them to the backend. Sessions expire after 30 minutes of inactivity, matching industry-standard session definition.

**Backend** — four API routes built with Next.js App Router (no separate Express server needed):

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/events` | Receive and store a tracking event |
| GET | `/api/sessions` | List all sessions with event counts |
| GET | `/api/sessions/[id]` | Full ordered event list for one session |
| GET | `/api/heatmap?page_url=` | All click coordinates for a given page |

**Dashboard** — three views:
- `/dashboard` — sessions table with event count, pages visited, duration, last seen
- `/dashboard/[sessionId]` — full user journey timeline, event by event
- `/heatmap` — radial dot heatmap per page URL, rendered on canvas

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 (App Router) | API routes + frontend in one repo, zero cold-start on Vercel |
| Language | TypeScript | Type safety on API handlers and component props |
| Database | MongoDB Atlas | Flexible schema for event data, free M0 tier |
| ODM | Mongoose 9 | Schema validation, aggregation pipeline support |
| Styling | Tailwind CSS v4 | Utility-first, no separate CSS files to maintain |
| Deployment | Vercel | Native Next.js hosting, no server to manage |

---

## Local setup

**1. Clone the repo**

```bash
git clone https://github.com/RajanPatel0/CF-Analytics.git
cd CF-Analytics
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up MongoDB Atlas**

- Create a free M0 cluster at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
- Under **Database Access**, create a user with read/write permissions
- Under **Network Access**, allow connections from `0.0.0.0/0`
- Copy your connection string from **Connect → Drivers**

**4. Add environment variables**

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/analytics
```

Replace `<username>`, `<password>`, and the cluster URL with your actual values.

**5. Run the dev server**

```bash
npm run dev
```

App runs at `http://localhost:3000`. Dashboard is at `/dashboard`.

**6. Test the tracker**

Open `http://localhost:3000/demo.html` in your browser. Click around — add items to cart, hit the nav links. Then open `/dashboard` to see your session appear with a full event trail.

---

## How session tracking works

Each visitor gets a unique session ID stored in `localStorage`. The 30-minute inactivity window works like this:

- On every page open, the tracker checks how long ago the last event was recorded
- If under 30 minutes → same session continues, timer resets
- If over 30 minutes → new session ID is generated

This matches how Google Analytics defines a session. Different browsers always produce different sessions since they have separate `localStorage`.

---

## Project structure

```
├── app/
│   ├── api/
│   │   ├── events/route.ts          # POST — store incoming events
│   │   ├── sessions/route.ts        # GET — list all sessions
│   │   ├── sessions/[id]/route.ts   # GET — single session journey
│   │   └── heatmap/route.ts         # GET — click data for a page
│   ├── dashboard/
│   │   ├── page.tsx                 # Sessions list view
│   │   └── [sessionId]/page.tsx     # User journey timeline
│   ├── heatmap/page.tsx             # Click heatmap view
│   └── layout.tsx
├── lib/
│   ├── mongodb.ts                   # Cached mongoose connection
│   └── Event.ts                     # Mongoose event schema
├── public/
│   ├── tracker.js                   # Drop-in tracking script
│   └── demo.html                    # Test webpage (mock e-commerce store)
```

---

## Deploying to Vercel

**1.** Push the repo to GitHub (must be public)

**2.** Go to [vercel.com](https://vercel.com) → Import the repository

**3.** Under **Environment Variables**, add:
```
MONGODB_URI = your_connection_string_here
```

**4.** Deploy — Vercel auto-detects Next.js, no config needed

**5.** Update the `API_URL` in `public/tracker.js` from `localhost:3000` to your Vercel deployment URL

---

## Trade-offs and assumptions

- **No authentication** — the assignment tracks anonymous visitor behavior, not logged-in users. Session IDs are randomly generated in the browser. There's no concept of "who" — only "what they did."

- **localStorage over cookies** — simpler to implement, no CORS or SameSite concerns for a same-origin tracker. A production system would use a server-set HttpOnly cookie for cross-domain tracking.


- **30 mins session time** — session expiry count after 30 mins of inactivity , if revisit within 30 mins of tab or browser close count the event in same session.

- **Coordinate normalization** — click x/y are stored as raw `clientX/clientY` values from the browser event. The heatmap canvas normalizes these against `window.screen` dimensions. This works well for same-device testing; a production heatmap would store viewport dimensions alongside each click for accurate cross-device rendering.

- **Single event collection** — all event types live in one MongoDB collection. At scale you'd want separate collections or time-based partitioning for query performance. For this assignment's scope, a single indexed collection on `session_id` is sufficient.

- **No real-time updates** — the dashboard requires a manual refresh to see new events. Adding WebSocket or SSE support would make it live, which is a natural next step.

---

## Demo

> Live deployment: https://cf-analytics-seven.vercel.app

To try it: open the `/demo.html` page on the deployed URL, interact with the mock store, then visit `/dashboard` to watch your session appear.
