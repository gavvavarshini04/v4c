# Voice4City – Citizen Grievance Management Portal

A full-stack web application that empowers citizens to report civic issues, track complaints, and enables government officials to manage resolutions transparently.
application link : v4c.netlify.app/

## Features

- **Multi-role access**: Citizen, Officer, and Admin roles
- **Complaint submission**: Report issues with title, description, category, image, and map location
- **Real-time tracking**: Track complaint status from submission to resolution
- **Officer dashboard**: Manage assigned complaints and update their status
- **Admin dashboard**: Oversee all complaints, assign officers/departments, and view analytics
- **Feedback system**: Citizens can rate resolutions after their complaint is resolved

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Storage)
- **Maps**: Leaflet / react-leaflet
- **Charts**: Recharts

## Getting Started

```sh
# 1. Clone the repository
git clone <your-repo-url>
cd city-voice-portal-main

# 2. Install dependencies
npm install

# 3. Configure environment variables
# The .env file already contains Supabase credentials

# 4. Start the development server
npm run dev
# → http://localhost:8080
```

## Database Setup

Run the SQL migrations in Supabase SQL Editor in order:

1. `supabase/migrations/20260309085811_*.sql` — Core schema (profiles, complaints, departments)
2. `supabase/migrations/20260309090616_*.sql` — Status history & timeline
3. `supabase/migrations/20260309090633_*.sql` — Security policy fix

To enable image uploads, also run `supabase/fix_storage_bucket.sql`.

## User Roles

| Role | Dashboard URL | Capabilities |
|---|---|---|
| Citizen | `/dashboard` | Submit & track complaints, give feedback |
| Officer | `/officer` | View assigned complaints, update status |
| Admin | `/admin` | View all complaints, assign officers, analytics |
