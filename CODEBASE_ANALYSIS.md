# AJPC Webpage - Codebase Architecture Summary

## Project Overview

This is a full-stack web application for **Academia Juvenil Programación Competitiva (AJPC)**, a youth competitive programming academy. The project is built with modern web technologies and includes features for course management, student enrollment, attendance tracking, and Discord integration.

---

## 1. PROJECT STRUCTURE

### Directory Layout

```
/home/enzo/dev/ajpc-webpage/
├── src/
│   ├── assets/              # Static assets (images, icons)
│   ├── components/          # Reusable Svelte/Astro components
│   ├── constants/           # Constants and configuration
│   ├── db/                  # Database schema and initialization
│   ├── layouts/             # Astro layout templates
│   ├── lib/                 # Utility libraries (auth, email, Discord, Codeforces, etc.)
│   ├── pages/               # Astro page routes (public, admin, dashboard)
│   │   ├── api/            # API endpoints (OAuth handlers)
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── dashboard/      # Role-based dashboards
│   │   └── auth/           # Authentication pages
│   ├── styles/              # CSS stylesheets
│   ├── trpc/                # tRPC API routes and procedures
│   │   ├── routers/        # API endpoint logic
│   │   │   ├── admin/      # Admin operations
│   │   │   ├── docente/    # Teacher operations
│   │   │   └── codeforces.ts # Codeforces integration and ranking
│   │   ├── context.ts      # tRPC context definition
│   │   ├── trpc.ts         # tRPC core setup
│   │   └── index.ts        # Router registry
│   ├── types/               # TypeScript type definitions
│   ├── middleware.ts        # Authentication middleware
│   └── env.d.ts            # Environment type definitions
├── drizzle/                 # Generated Drizzle ORM files
├── public/                  # Public static files
├── astro.config.mjs        # Astro framework configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── .env.example            # Environment variable template
```

---

## 2. TECH STACK

### Frontend

- **Framework**: Astro 5.12.8 (Server-side rendering, SSR)
- **UI Library**: Svelte 5.38.0 (Interactive components)
- **Styling**: CSS (custom stylesheets)
- **Icons**: Astro Icon + Iconify

### Backend

- **Framework**: Astro (Server components + API routes)
- **API Layer**: tRPC 11.16.0 (Type-safe RPC)
- **Runtime**: Node.js/Edge Runtime (Vercel/Cloudflare compatible)

### Database

- **ORM**: Drizzle ORM 0.45.1 (TypeScript-first)
- **Database**: Turso/LibSQL (SQLite-compatible distributed DB)
- **Driver**: @libsql/client 0.17.0

### Authentication & Authorization

- **OAuth Providers**:
  - Discord OAuth 2.0 (Primary login)
  - Codeforces OpenID Connect (Account linking)
- **Library**: Arctic 3.7.0
- **Session Management**: HMAC-based JWT tokens stored in HTTP-only cookies
- **Authorization**: Role-based access control (student, docente, admin, sudo)

### External Services

- **Email**: Google Workspace Gmail API
- **Authentication**: JWT signing (jose 6.1.3)
- **Discord Integration**: Discord API v10 (member management, roles, guilds)
- **Codeforces Integration**: Official API (contests, submissions, ranking)

### Deployment

- **Adapters**: Vercel (default) or Cloudflare Workers
- **Analytics**: Vercel Analytics

### Development Tools

- **Language**: TypeScript 5.9.3
- **Validation**: Zod 4.3.6 (Schema validation)
- **Linting**: ESLint 9.33.0
- **Formatting**: Prettier 3.6.2
- **Package Manager**: PNPM

---

## 3. DATABASE SCHEMA & MODELS

### Core User Model

**Table: `users`**

```
id: text (Primary Key)
discordId: text (Unique, NOT NULL) - Discord user ID
discordUsername: text (NOT NULL) - Discord username
discordAvatar: text - Discord profile picture URL
name: text - System display name
email: text - User email address
role: text enum['student', 'docente', 'admin', 'sudo'] (Default: 'student')
discordAccessToken: text - OAuth access token for Discord
discordRefreshToken: text - OAuth refresh token
discordTokenExpiresAt: timestamp - Token expiration time
createdAt: timestamp (Default: unix epoch)
updatedAt: timestamp (Default: unix epoch)
codeforcesHandle: text (Unique) - Linked Codeforces handle
codeforcesRating: integer - User's current Codeforces rating
codeforcesLastSync: integer - Unix timestamp of last user sync
```

**Key User Attributes**:

- Discord-centric authentication (no password-based login)
- Role-based access control with 4 tiers
- OAuth token storage for Discord API operations
- Codeforces account linkage via verified OpenID Connect flow

### Core Course Model

**Table: `courses`**

```
id: text (Primary Key)
name: text (NOT NULL) - Course name
description: text - Course description/syllabus
level: text enum['beginner', 'intermediate', 'advanced'] (NOT NULL)
year: integer (NOT NULL) - Academic year
maxStudents: integer - Enrollment capacity limit
status: text enum['open', 'closed'] (Default: 'closed', NOT NULL)
availableSchedules: json - Array of schedule objects
  - Each schedule: { id: string, day: string, timeRange: string }
discordGuildId: text - Discord server ID for course community
discordRoleId: text - Discord role ID for course members
codeforcesGroupId: text - Codeforces Group ID for contest sync
codeforcesLastRankingSync: timestamp - Cache tracker for global ranking
createdAt: timestamp
updatedAt: timestamp
```

**Key Course Attributes**:

- Curriculum levels for skill-based learning paths
- Schedule management with multiple time slots
- Discord community integration (auto-invite students to guild + role assignment)
- Codeforces group integration for course-specific ranking systems

### Related Tables

**Table: `enrollments`** (Bridges Users and Courses)

```
id: text (Primary Key)
userId: text (Foreign Key → users.id, NOT NULL)
courseId: text (Foreign Key → courses.id, NOT NULL)
sectionId: text (Foreign Key → sections.id, NULLABLE)
fullName: text (NOT NULL) - Student full name
email: text (NOT NULL) - Contact email
... (enrollment data) ...
status: text enum['pending', 'approved', 'rejected'] (Default: 'pending')
createdAt: timestamp
updatedAt: timestamp
```

**Table: `codeforces_contests`** (Tracked contests for courses)

```
id: text (Primary Key) - Codeforces contest ID
courseId: text (Foreign Key → courses.id, NOT NULL)
name: text (NOT NULL)
type: text (NOT NULL) - ICPC, IOI, etc.
startTimeSeconds: integer - Unix start time
durationSeconds: integer
countedForGlobal: boolean (Default: false) - If counts for course ranking
lastSync: timestamp - Last submission sync for this contest
createdAt: timestamp
updatedAt: timestamp
```

**Table: `codeforces_submissions`** (Student problem attempts)

```
id: text (Primary Key) - Codeforces submission ID
contestId: text (Foreign Key → codeforces_contests.id, NOT NULL)
userId: text (Foreign Key → users.id, NOT NULL)
problemId: text (NOT NULL) - e.g., "A", "B"
verdict: text (NOT NULL) - OK, WRONG_ANSWER, etc.
passedTestCount: integer
timeConsumedMillis: integer
creationTimeSeconds: integer
points: integer
createdAt: timestamp
updatedAt: timestamp
```

... (Other tables: sections, sectionDocentes, modules, moduleMaterials, attendance, studentObservations, inviteCodes, inviteUsages, emailTemplates, settings) ...

---

## 4. API ARCHITECTURE (tRPC)

### API Organization

tRPC provides end-to-end type safety. All procedures are organized by namespace:

#### Public Routers

- **user**: User profile operations
- **enrollment**: Course enrollment operations
- **codeforces**: Public ranking access
  - `getRanking` - Retrieve course ranking with 10min auto-sync cache

#### Admin Routers (`/admin/*`)

Protected by `adminProcedure` (requires admin or sudo role)

- **courses**: Course management (including Codeforces Group ID)
- **codeforces**: Integration management
  - `syncContests` - Fetch latest contests from Group
  - `toggleContest` - Mark contests to be counted for ranking
  - `syncRankingManual` - Force immediate submission refresh
- ... (users, enrollments, sections, invites, templates, settings, notifications, massEmail, discord) ...

#### Teacher/Docente Routers (`/docente/*`)

- **sections**, **students**, **modules**, **attendance**, **observations**

#### Protected Routers (All authenticated users)

- **codeforces**: Account management
  - `unlinkAccount` - Clear Codeforces link and delete associated submission cache

---

## 5. EXTERNAL SERVICE INTEGRATIONS

### Discord OAuth Integration

**Files**: `src/lib/discord.ts`, `src/pages/api/auth/*.ts`
**Purpose**: Primary authentication mechanism and community management.

### Codeforces Integration

**Files**: `src/lib/codeforces.ts`, `src/pages/api/codeforces/*.ts`, `src/trpc/routers/codeforces.ts`
**Purpose**: Competitive programming progress tracking and performance ranking.

**Flows**:
1. **Account Link**: User authenticated via Codeforces OpenID Connect.
2. **Contest Sync**: Admin pulls contests from a configured Group ID via `contest.list` API.
3. **Submission Sync**: Automated/Manual pull of student attempts via `contest.status` with `asGym=true`.
4. **Ranking Calculation**: 
   - Primary: Best points per problem.
   - Tie-breaker 1: Total Penalty (time from contest start).
   - Tie-breaker 2: Failed attempts (WA, RE, TLE, MLE).

### Google Workspace Gmail API

**Files**: `src/lib/email.ts`, `src/lib/email-templates.ts`
**Purpose**: Send enrollment confirmation, approval/rejection, and notification emails.

### Turso/LibSQL Database

**Purpose**: Primary persistent data storage with SQLite compatibility.

---

## 6. AUTHENTICATION & AUTHORIZATION SYSTEM

### Multi-OAuth Support
The system manages primary authentication through Discord and auxiliary identity verification through Codeforces for the ranking system.

### Role-Based Access Control (RBAC)
- **student**, **docente**, **admin**, **sudo**.

---

## 10. KEY FILES TO UNDERSTAND

| File                            | Purpose                                 |
| ------------------------------- | --------------------------------------- |
| `src/db/schema.ts`              | Database schema definitions (15 tables) |
| `src/lib/auth.ts`               | Session management & RBAC helpers       |
| `src/lib/discord.ts`            | Discord OAuth & API integration         |
| `src/lib/codeforces.ts`         | Codeforces API & Signature utility      |
| `src/trpc/routers/codeforces.ts`| Ranking logic & Sync procedures         |
| `src/trpc/index.ts`             | API router registry                     |
| `src/pages/api/codeforces/*`    | Codeforces OAuth handlers               |
```
