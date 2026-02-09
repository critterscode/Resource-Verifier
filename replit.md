# ResourceHub

## Overview

ResourceHub is a community resource management application for organizing, verifying, and distributing information about local services and resources (e.g., healthcare, food banks, shelters). Users can browse resources, review and verify their information, organize them into printable collections/lists, and export data. The app features a dashboard with status tracking, a review mode for triaging resources, and a collections system for curating shareable lists.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Forms**: react-hook-form with Zod validation via @hookform/resolvers
- **Animations**: Framer Motion (used in Review mode for card transitions)
- **Icons**: Lucide React
- **Styling**: Tailwind CSS with CSS variables for theming, custom fonts (Inter + Outfit)

The frontend lives in `client/src/` with pages in `pages/`, reusable components in `components/`, custom hooks in `hooks/`, and utility functions in `lib/`. Path aliases are configured: `@/` maps to `client/src/`, `@shared/` maps to `shared/`.

**Key Pages**:
- `/` — Dashboard with stats overview
- `/resources` — Full resource list with search, filter, CRUD operations
- `/review` — Card-by-card review mode for verifying resources
- `/lists` — Collection management
- `/lists/:id` — Collection detail with print support

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via tsx
- **API Design**: RESTful JSON API under `/api/` prefix. A shared API contract in `shared/routes.ts` defines paths, methods, input schemas, and response schemas using Zod — both client and server reference this contract.
- **Build**: Custom build script (`script/build.ts`) using Vite for client and esbuild for server, outputting to `dist/`

### Shared Code
- `shared/schema.ts` — Drizzle ORM table definitions and Zod schemas (insert schemas via drizzle-zod)
- `shared/routes.ts` — API contract with typed route definitions, input validation schemas, and response schemas

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema Management**: `drizzle-kit push` for schema synchronization (no migration files needed for dev)
- **Connection**: node-postgres (`pg`) Pool in `server/db.ts`

**Tables**:
- `resources` — Main table storing community resources with fields: name, category, categories (text array, max 2), phone, email, website, address, services (mapped from Excel "Description"), hours, accessInfo (from "Access"), eligibility, serviceArea (from "Service_Area"), tags (text array, semicolon-separated in Excel), status (unverified/verified/missing_info), isFavorite, notes, createdAt
- `collections` — Named lists/collections of resources
- `collection_items` — Join table linking collections to resources

### Recent Changes (Feb 2026)
- Added new fields from Excel import: email, accessInfo, eligibility, serviceArea, tags, categories
- Resource names are clickable Google search links (target=_blank)
- Websites are clickable with auto https:// prefix
- Quick-select tag UI in ResourceForm and Review mode
- Reusable category picker with max-2 limit in ResourceForm
- Tags endpoint: GET /api/tags returns all unique tags
- CSV export includes all fields
- Print layout includes all fields (access, eligibility, service area)
- Data-testid attributes on all interactive elements

### Storage Layer
- `server/storage.ts` defines an `IStorage` interface and `DatabaseStorage` implementation
- Supports filtered queries (search, category, status, favorites) using Drizzle query builders

### Dev vs Production
- **Development**: Vite dev server with HMR proxied through Express (`server/vite.ts`)
- **Production**: Static files served from `dist/public` via Express (`server/static.ts`)

## External Dependencies

### Database
- **PostgreSQL** — Primary data store, required via `DATABASE_URL` environment variable
- **connect-pg-simple** — PostgreSQL session store (available but sessions not fully wired)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** — ORM and schema management
- **express** v5 — HTTP server
- **zod** — Runtime schema validation (shared between client and server)
- **xlsx** — Excel file import/export support
- **framer-motion** — Animation library for review card transitions
- **@tanstack/react-query** — Async state management
- **wouter** — Client-side routing
- **date-fns** — Date formatting utilities

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal` — Runtime error overlay
- `@replit/vite-plugin-cartographer` — Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner` — Dev banner (dev only)

### Fonts (External CDN)
- Google Fonts: Inter, Outfit, DM Sans, Fira Code, Geist Mono, Architects Daughter