# Naviss SDM — Kwara State Sustainable Development Monitor

A full-stack WebGIS dashboard for monitoring amenities (Health, Power, Water, Road) across Kwara State, Nigeria.

**Built with:** Next.js 15 · Supabase (PostGIS) · MapLibre GL JS · Tailwind CSS · Bun

---

## Quick Start

### 1. Install dependencies
```bash
bun install
```

### 2. Configure environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL + anon key
```

### 3. Set up the database
```bash
# Option A — Supabase CLI
bunx supabase db push

# Option B — paste into Supabase SQL editor
# supabase/migrations/001_init.sql
# supabase/seed/001_seed.sql
```

> **PostGIS required.** Enable it in your Supabase project:
> Dashboard → Database → Extensions → PostGIS → Enable

### 4. Enable Realtime
In your Supabase dashboard go to **Database → Replication** and enable these tables:
- `amenities`
- `amenity_status_log`

### 5. Run the dev server
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
kwara-sdm/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Dashboard page
│   ├── globals.css             # Global + MapLibre styles
│   └── api/
│       ├── amenities/route.ts  # REST: GET/POST amenities
│       └── lgas/route.ts       # REST: GET LGAs
├── components/
│   ├── map/
│   │   ├── SDMMap.tsx          # MapLibre map component
│   │   └── MapShell.tsx        # Responsive shell (panels + nav)
│   ├── panels/
│   │   ├── LayerPanel.tsx      # Left panel: layers, viz, filters
│   │   ├── StatsPanel.tsx      # Right panel: stats, charts, alerts
│   │   └── MobileDrawer.tsx    # Mobile bottom drawer
│   └── ui/
│       └── Topbar.tsx          # App header
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   └── server.ts           # Server Supabase client
│   └── hooks/
│       ├── useAmenities.ts     # Amenity data + realtime
│       ├── useLGAStats.ts      # Aggregated LGA statistics
│       └── useAlerts.ts        # Recent status change alerts
├── types/
│   └── index.ts                # Shared TypeScript types
└── supabase/
    ├── migrations/
    │   └── 001_init.sql        # PostGIS schema
    └── seed/
        └── 001_seed.sql        # Kwara LGAs + sample data
```

---

## Amenity Types

| Type   | Color     | Sub-types                                              |
|--------|-----------|--------------------------------------------------------|
| Health | `#E63946` | tertiary_hospital, secondary_hospital, clinic, phc     |
| Power  | `#F4A261` | transmission_substation, distribution_transformer, etc |
| Water  | `#2196F3` | water_treatment_plant, borehole, storage_tank, etc     |
| Road   | `#6D4C41` | federal_highway, state_road, urban_road, etc           |

---

## Map Features

- **Layer toggling** — turn each amenity type on/off
- **Marker view** — clustered circles, click for popup
- **Heatmap view** — density visualization
- **Choropleth** — LGA-level intensity map
- **Draw boundary** — polygon draw tool to spatially filter features
- **Upload GeoJSON** — upload custom study area boundary
- **Basemap switching** — Streets / Light / Dark (all free via OpenFreeMap)
- **Realtime updates** — live marker refresh via Supabase Realtime

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (`≥768px`) | Floating left + right panels over map, FAB toggles |
| Mobile (`<768px`)  | Full-screen map, bottom nav bar, slide-up drawer |

---

## MapLibre vs Mapbox

This project uses **MapLibre GL JS** — the open-source fork of Mapbox GL JS.

- No API token required
- Tiles served by [OpenFreeMap](https://openfreemap.org) (free, no account)
- Full API compatibility with Mapbox GL JS v1
- `@maplibre/maplibre-gl-draw` for polygon draw tools

---

## Commands

```bash
bun dev           # Start dev server
bun build         # Production build
bun start         # Start production server
bun lint          # ESLint
bun db:types      # Generate Supabase TypeScript types
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |

---

## Naviss Technologies

> Where Location Meets Intelligence — Transforming spatial data into strategic advantage

📧 info@naviss.com.ng · 📞 +234 806 696 8490 · 📍 Abuja, Nigeria
# SDG_kwara
