# SPA Info Repo - Project Overview & Agent Guide

This document provides a comprehensive technical overview of the **spa-info-repo** full-stack project architecture, environment paths, file structure, database schema, and operational commands for AI coding agents and developers.

---

## 🏗️ Architecture Overview

The application follows a 3-tier Fullstack Architecture:

```text
[ React 19 Frontend ]  ==== (REST API) ====>  [ Laravel 12 Backend ]  ==== (PostgREST Client) ====>  [ Supabase PostgreSQL ]
  http://localhost:5173                          http://127.0.0.1:8000                                https://lydxhltbvsuyrbvulkwe.supabase.co
```

1. **Frontend (`client/`)**: Single Page Application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **shadcn/ui** components.
2. **Backend (`server/`)**: **Laravel 12 (PHP 8.4)** REST API engine that handles CORS, validates input, and communicates with Supabase.
3. **Database (`supabase/`)**: Cloud **Supabase PostgreSQL** instance running Row Level Security (RLS) policies.

---

## 📂 Project Directory Structure

```text
spa-info-repo-main/
├── run.bat                          # One-click Windows batch script to launch both FE & BE
├── PROJECT_OVERVIEW.md              # AI Agent & Developer Architecture Guide (This file)
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── components/ui/           # shadcn UI components (Button, Card, Badge, Input)
│   │   ├── lib/
│   │   │   ├── utils.ts             # Tailwind classnames merger (cn helper)
│   │   │   ├── supabase.ts          # Supabase client singleton
│   │   │   └── supabase/            # Generated Supabase client handlers
│   │   ├── App.tsx                  # Main Fullstack Dashboard Component
│   │   └── index.css                # Tailwind CSS v4 & shadcn HSL theme variables
│   ├── scripts/                     # Utility scripts (test-supabase.js, seed-users.js)
│   ├── supabase/
│   │   ├── config.toml              # Supabase CLI config (project_id: lydxhltbvsuyrbvulkwe)
│   │   └── migrations/              # SQL Migration scripts
│   ├── .env                         # Frontend environment variables
│   ├── components.json              # shadcn UI configuration file
│   ├── vite.config.ts               # Vite configuration (@ path alias & Tailwind v4 plugin)
│   └── tsconfig.app.json            # TypeScript configuration
└── server/                          # Laravel Backend Application
    ├── app/
    │   └── Http/Controllers/
    │       └── SupabaseUserController.php # Laravel Controller calling Supabase PostgREST API
    ├── config/
    │   └── cors.php                 # Laravel CORS configuration
    ├── routes/
    │   └── web.php                  # API route registrations (/api/users)
    ├── database/
    │   └── database.sqlite          # SQLite local backup DB
    └── .env                         # Backend environment variables (SUPABASE_URL, SUPABASE_KEY)
```

---

## 💻 Environment & System Binary Paths (Windows)

The system uses pre-installed Windows binaries located at:
- **Node.js / npm**: `C:\Program Files\nodejs` (`node.exe` v24.18.1, `npm.cmd` v11.16.0)
- **PHP Engine**: `C:\Users\kiena\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.4_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe` (v8.4.22)
- **Git**: `C:\Program Files\Git\cmd\git.exe`

---

## 🔐 Environment Variables

### Frontend (`client/.env`)
```env
VITE_SUPABASE_URL=https://lydxhltbvsuyrbvulkwe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL
```

### Backend (`server/.env`)
```env
SUPABASE_URL=https://lydxhltbvsuyrbvulkwe.supabase.co
SUPABASE_KEY=sb_publishable_HKxhY-I6jzJSksJlSujaLQ_vgQW6UeL
```

---

## 🗄️ Database Schema (`public.users`)

The primary database table hosted on Supabase PostgreSQL:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔌 API Endpoints Reference

Base Backend URL: `http://127.0.0.1:8000`

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Fetches all user rows from Supabase `users` table | None |
| `POST` | `/api/users` | Inserts a new user row into Supabase `users` table | `{ "full_name": "string", "email": "string", "role": "user/admin/manager" }` |

---

## 🚀 Commands & Development Scripts

### Launch Everything (One-Click)
Run the root batch file:
```cmd
run.bat
```

### Manual Commands
- **Start React Frontend**:
  ```cmd
  cd client
  npm run dev
  ```
- **Build React Frontend**:
  ```cmd
  cd client
  npm run build
  ```
- **Start Laravel Backend**:
  ```cmd
  cd server
  php -S 127.0.0.1:8000 -t public
  ```
- **Test Supabase Connection**:
  ```cmd
  cd client
  node scripts/test-supabase.js
  ```
- **Seed Sample Users**:
  ```cmd
  cd client
  node scripts/seed-users.js
  ```
