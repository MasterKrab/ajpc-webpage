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
│   ├── lib/                 # Utility libraries (auth, email, Discord, etc.)
│   ├── pages/               # Astro page routes (public, admin, dashboard)
│   │   ├── api/            # API endpoints
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── dashboard/      # Role-based dashboards
│   │   └── auth/           # Authentication pages
│   ├── styles/              # CSS stylesheets
│   ├── trpc/                # tRPC API routes and procedures
│   │   ├── routers/        # API endpoint logic
│   │   │   ├── admin/      # Admin operations
│   │   │   ├── docente/    # Teacher operations
│   │   │   └── user/       # User operations
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

- **OAuth Provider**: Discord OAuth 2.0 (Arctic 3.7.0)
- **Session Management**: HMAC-based JWT tokens stored in HTTP-only cookies
- **Authorization**: Role-based access control (student, docente, admin, sudo)

### External Services

- **Email**: Google Workspace Gmail API
- **Authentication**: JWT signing (jose 6.1.3)
- **Discord Integration**: Discord API v10 (member management, roles, guilds)

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
```

**Key User Attributes**:

- Discord-centric authentication (no password-based login)
- Role-based access control with 4 tiers
- OAuth token storage for Discord API operations
- Display name and email are optional but required for course enrollment

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
createdAt: timestamp
updatedAt: timestamp
```

**Key Course Attributes**:

- Curriculum levels for skill-based learning paths
- Schedule management with multiple time slots
- Discord community integration (auto-invite students to guild + role assignment)
- Capacity management for each course

### Related Tables

**Table: `enrollments`** (Bridges Users and Courses)

```
id: text (Primary Key)
userId: text (Foreign Key → users.id, NOT NULL)
courseId: text (Foreign Key → courses.id, NOT NULL)
sectionId: text (Foreign Key → sections.id, NULLABLE)
fullName: text (NOT NULL) - Student full name
email: text (NOT NULL) - Contact email
age: integer (NOT NULL) - Student age (12-21 range)
gender: text (NOT NULL)
schoolYear: text (NOT NULL) - Academic level (e.g., "10th Grade")
schoolName: text - Name of the school
schoolType: text - School category
region: text - Geographic region (Chile-specific)
commune: text - Municipality (Chile-specific)
previousExperience: text - Prior programming experience
motivation: text - Why student wants to enroll
selectedSchedules: json - Array of chosen time slots
status: text enum['pending', 'approved', 'rejected'] (Default: 'pending')
adminNotes: text - Internal notes from admin
feedback: text - Feedback for student
notifiedAt: timestamp - When student was notified
createdAt: timestamp
updatedAt: timestamp
```

**Table: `sections`** (Course groupings/parallel classes)

```
id: text (Primary Key)
courseId: text (Foreign Key → courses.id, NOT NULL)
name: text (NOT NULL) - Section identifier (e.g., "Parallel A")
createdAt: timestamp
updatedAt: timestamp
```

**Table: `sectionDocentes`** (Many-to-many: Sections ↔ Teachers)

```
sectionId: text (Foreign Key → sections.id)
teacherId: text (Foreign Key → users.id)
Primary Key: (sectionId, teacherId)
```

**Table: `modules`** (Course content units)

```
id: text (Primary Key)
courseId: text (Foreign Key → courses.id, NOT NULL)
title: text (NOT NULL)
description: text
createdAt: timestamp
updatedAt: timestamp
```

**Table: `moduleMaterials`** (Course resources)

```
id: text (Primary Key)
moduleId: text (Foreign Key → modules.id, NOT NULL)
title: text (NOT NULL)
url: text (NOT NULL)
type: text (Default: 'link') - link, document, video, etc.
createdAt: timestamp
```

**Table: `attendance`** (Attendance tracking)

```
id: text (Primary Key)
moduleId: text (Foreign Key → modules.id, NOT NULL)
studentId: text (Foreign Key → users.id, NOT NULL)
sectionId: text (Foreign Key → sections.id, NOT NULL)
status: text enum['present', 'absent', 'late', 'excused'] (Default: 'present')
createdAt: timestamp
updatedAt: timestamp
```

**Table: `studentObservations`** (Teacher notes on students)

```
id: text (Primary Key)
studentId: text (Foreign Key → users.id, NOT NULL)
teacherId: text (Foreign Key → users.id, NOT NULL)
courseId: text (Foreign Key → courses.id, NOT NULL)
observation: text (NOT NULL) - Teacher's comment
createdAt: timestamp
```

**Table: `inviteCodes`** (Role-based invite system)

```
code: text (Primary Key)
role: text enum['student', 'docente', 'admin'] (NOT NULL)
createdBy: text (Foreign Key → users.id, NOT NULL)
usedBy: text (Foreign Key → users.id, NULLABLE)
createdAt: timestamp
usedAt: timestamp
maxUses: integer (Default: 1)
uses: integer (Default: 0) - Current usage count
```

**Table: `inviteUsages`** (Track multiple uses per code)

```
id: text (Primary Key)
inviteCode: text (Foreign Key → inviteCodes.code)
userId: text (Foreign Key → users.id)
usedAt: timestamp
```

**Table: `emailTemplates`** (Customizable email templates)

```
id: text (Primary Key) - 'received', 'approved', 'rejected'
subject: text (NOT NULL)
body: text (NOT NULL) - HTML content with {{placeholders}}
signature: text (Default: 'Sistema de Notificaciones')
updatedAt: timestamp
```

**Table: `settings`** (System configuration)

```
key: text (Primary Key) - e.g., 'allow_account_deletion'
value: text (NOT NULL) - JSON string or simple value
updatedAt: timestamp
```

---

## 4. API ARCHITECTURE (tRPC)

### API Organization

tRPC provides end-to-end type safety. All procedures are organized by namespace:

#### Public Routers

- **user**: User profile operations
  - `getProfile` - Get current user
  - `updateProfile` - Update name and email
  - `deleteAccount` - Delete user account (if enabled)

- **enrollment**: Course enrollment operations
  - `list` - Get user's enrollments
  - `create` - Enroll in a course with validation

#### Admin Routers (`/admin/*`)

Protected by `adminProcedure` (requires admin or sudo role)

- **courses**: Course management
  - `list` - Paginated course list
  - `create` - Create new course
  - `update` - Update course details
  - `delete` - Remove course
  - `getById` - Get course details with stats

- **users**: User management
  - `list` - Paginated user list with filtering
  - `exportAll` - Export all users (for CSV)
  - `updateRole` - Change user role

- **enrollments**: Enrollment approval workflow
  - `list` - Paginated enrollments by course
  - `approve` - Accept student enrollment (triggers Discord invite + email)
  - `reject` - Deny enrollment (sends feedback email)
  - `getStats` - Enrollment statistics per course

- **sections**: Parallel class management
  - `create` - Create course section
  - `list` - List sections for a course
  - `updateTeachers` - Assign teachers to section
  - `delete` - Remove section

- **invites**: Invite code management
  - `generate` - Create invite code with role
  - `list` - View all invite codes
  - `revoke` - Disable an invite code
  - `getUsageStats` - Track code usage

- **templates**: Email template customization
  - `list` - View all templates
  - `update` - Edit template content

- **settings**: System configuration
  - `get` - Retrieve setting value
  - `set` - Update setting

- **notifications**: Send system notifications
  - (Various notification procedures)

- **massEmail**: Bulk email operations
  - `sendToRole` - Email by user role
  - `sendToEnrollment` - Email enrolled students

- **discord**: Discord guild/role management
  - `syncMemberRoles` - Sync Discord roles for course
  - `createRole` - Create new Discord role
  - Various member management operations

#### Teacher/Docente Routers (`/docente/*`)

Protected by `teacherProcedure` (requires docente, admin, or sudo role)

- **sections**: View assigned sections
- **students**: View enrolled students in sections
- **modules**: Create and manage course modules
- **attendance**: Record attendance
- **observations**: Add student observation notes

### Procedure Types

1. **publicProcedure** - No authentication required
2. **protectedProcedure** - Requires authenticated user (any role)
3. **adminProcedure** - Requires admin or sudo role
4. **teacherProcedure** - Requires docente, admin, or sudo role
5. **sudoProcedure** - Requires sudo role only

### Request/Response Validation

All inputs are validated with Zod schemas:

- User inputs are validated before database operations
- Type-safe responses via Drizzle ORM
- Error handling with tRPCError codes (FORBIDDEN, BAD_REQUEST, CONFLICT, etc.)

---

## 5. EXTERNAL SERVICE INTEGRATIONS

### Discord OAuth Integration

**Purpose**: Primary authentication mechanism

**Files**: `src/lib/discord.ts`, `src/pages/api/auth/*.ts`

**Flow**:

1. User clicks "Login with Discord"
2. User redirected to Discord OAuth authorization URL (scopes: `identify`, `email`, `guilds.join`)
3. Discord redirects back to `/api/auth/callback` with authorization code
4. Backend exchanges code for access token and fetches user info
5. User record created/updated in database
6. Session token created and stored in HTTP-only cookie

**Key Functions**:

- `addMemberToGuild()` - Invite approved students to course Discord server with role
- `removeMemberFromGuild()` - Kick students from server if enrollment rejected
- `updateMemberNickname()` - Set Discord display name
- `getGuildRoles()`, `createGuildRole()` - Manage course roles
- `addRoleToMember()`, `removeRoleFromMember()` - Assign Discord roles

**Discord Permissions Required**:

- MANAGE_GUILD_EXPRESSIONS (create roles)
- MANAGE_MEMBERS (add/remove members)
- MANAGE_ROLES (modify roles)

### Google Workspace Gmail API

**Purpose**: Send enrollment confirmation, approval/rejection, and notification emails

**Files**: `src/lib/email.ts`, `src/lib/email-templates.ts`

**Auth Method**: Service Account with JWT bearer flow

- Service account key stored in `GOOGLE_SERVICE_ACCOUNT_KEY` env var
- Generates short-lived access tokens using OAuth 2.0 JWT bearer grant
- Tokens cached and refreshed as needed

**Email Features**:

- Customizable templates with HTML content
- Variable substitution: `{{name}}`, `{{courseName}}`, etc.
- Custom email signature per template
- All emails sent from configured `GOOGLE_SENDER_EMAIL`

### Turso/LibSQL Database

**Purpose**: Primary persistent data storage

**Connection**:

- Cloud database with SQLite compatibility
- Connection via HTTPS with authentication token
- Credentials: `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`

**Schema Management**:

- Drizzle ORM for type-safe schema definition
- Migrations tracked in `drizzle/` directory
- `drizzle-kit` CLI for schema generation and migrations

---

## 6. AUTHENTICATION & AUTHORIZATION SYSTEM

### Session Management

**File**: `src/lib/auth.ts`

**Mechanism**:

- HMAC-SHA256 signed JWT using `SESSION_SECRET` (min 32 characters)
- Format: `{userId}.{hmac_signature}`
- Stored in HTTP-only, Secure (production), SameSite=Lax cookie
- 30-day expiration

**Functions**:

- `createSession()` - Generate and set session cookie
- `validateSession()` - Verify session token and fetch user
- `deleteSession()` - Clear session on logout

### Middleware Authentication

**File**: `src/middleware.ts`

**Flow**:

1. Every request validated by Astro middleware
2. Session token extracted from cookies
3. Session signature verified with `SESSION_SECRET`
4. User record loaded from database
5. User injected into `locals.user` for route handlers

### Role-Based Access Control (RBAC)

**Roles**:

- **student** - Can enroll in courses, view own enrollments
- **docente** (teacher) - Can manage sections, record attendance, add observations
- **admin** - Full access to admin panel (courses, users, enrollments, templates, etc.)
- **sudo** - Super admin (cannot delete own account via UI, system override)

**Authorization Helpers** (`src/lib/auth.ts`):

```typescript
hasRole(user, 'admin', 'sudo') // Check if user has any of listed roles
isAdmin(user) // Shorthand: admin or sudo
isTeacher(user) // Shorthand: docente, admin, or sudo
```

---

## 7. KEY WORKFLOWS

### Student Enrollment Flow

1. Student logs in via Discord OAuth
2. Updates profile (name, email required)
3. Fills enrollment form:
   - Personal info (age, gender, school year)
   - School details (name, type, region, commune)
   - Experience/motivation
   - Schedule selection
   - Accepts terms & conduct agreement
4. Enrollment created with status = `pending`
5. Confirmation email sent
6. Admin reviews and approves/rejects:
   - **Approved**: Student added to Discord guild + role assigned, email sent
   - **Rejected**: Student receives feedback email
7. Student can view enrollment status in dashboard

### Course Management Flow (Admin)

1. Create course with:
   - Level (beginner/intermediate/advanced)
   - Schedule slots
   - Capacity limit
   - Discord guild & role IDs
2. Create sections (parallel classes)
3. Assign teachers to sections
4. Review and approve enrollments
5. Create modules and add materials
6. Track attendance per module
7. Export reports

### Teacher Operations Flow

1. View assigned sections and students
2. Record attendance per module
3. Add observation notes about students
4. View student lists and details

---

## 8. DEPLOYMENT & ENVIRONMENT

### Environment Variables Required

```
# Discord OAuth
DISCORD_CLIENT_ID          - Discord app client ID
DISCORD_CLIENT_SECRET      - Discord app secret
DISCORD_REDIRECT_URI       - Callback URL (e.g., https://domain.com/api/auth/callback)

# Database
TURSO_DATABASE_URL         - libsql://db.turso.io
TURSO_AUTH_TOKEN           - Authentication token

# Session
SESSION_SECRET             - Min 32 random characters for HMAC signing

# Email
GOOGLE_SERVICE_ACCOUNT_KEY - JSON service account key (as string)
GOOGLE_SENDER_EMAIL        - Gmail address with API access
GOOGLE_SENDER_NAME         - Display name for emails (optional)

# Discord Bot (for member management)
DISCORD_BOT_TOKEN          - Bot token (required for guild operations)
```

### Deployment Targets

- **Vercel** (default) - `npm run build`
- **Cloudflare** - `npm run build:cf`
- Both support serverless/edge runtime via adapters

---

## 9. SUMMARY: USER-COURSE RELATIONSHIP

### Data Model Relationship

```
users (1) ──→ (many) enrollments (many) ←─ (1) courses
        └────→ (many) sections
        └────→ (many) inviteCodes (as creator/user)
        └────→ (many) studentObservations (as student/teacher)
        └────→ (many) attendance (as student)
        └────→ (many) sectionDocentes (as teacher)

courses ──→ (many) enrollments
        ──→ (many) sections
        ──→ (many) modules
        ──→ (many) studentObservations
```

### Key Relationship Details

1. **User → Enrollment → Course**: Users enroll in courses through enrollments, tracking:
   - Application status (pending/approved/rejected)
   - Personal/school information
   - Schedule preferences
   - Communication history

2. **Course → Sections**: Courses are divided into parallel sections with:
   - Different teachers per section
   - Separate student groups
   - Individual attendance tracking

3. **User → Section** (via sectionDocentes): Teachers assigned to sections
   - Multiple teachers can teach same section
   - One teacher can teach multiple sections

4. **Student → Attendance → Module**: Track which students attended which lessons
   - Attendance status (present/absent/late/excused)
   - Linked to specific modules and sections

5. **User → StudentObservations**: Teachers write notes about students
   - Scoped to specific course
   - Bidirectional relationship (student ID, teacher ID)

### Discord Synchronization

- Approved enrollments → User added to course's Discord guild
- Course Discord role assigned automatically
- Discord webhook can notify when enrollments change
- Members removed from guild if enrollment rejected

---

## 10. KEY FILES TO UNDERSTAND

| File                            | Purpose                                 |
| ------------------------------- | --------------------------------------- |
| `src/db/schema.ts`              | Database schema definitions (13 tables) |
| `src/lib/auth.ts`               | Session management & RBAC helpers       |
| `src/lib/discord.ts`            | Discord OAuth & API integration         |
| `src/lib/email.ts`              | Google Gmail API email sending          |
| `src/trpc/index.ts`             | API router registry                     |
| `src/trpc/context.ts`           | tRPC context setup                      |
| `src/pages/api/auth/*.ts`       | OAuth callback handling                 |
| `src/trpc/routers/admin/*.ts`   | Admin procedures                        |
| `src/trpc/routers/docente/*.ts` | Teacher procedures                      |
| `astro.config.mjs`              | Framework configuration                 |
| `drizzle.config.ts`             | ORM configuration                       |
