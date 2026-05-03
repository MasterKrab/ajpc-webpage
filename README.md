# AJPC Webpage

Welcome to the **Academia Juvenil Programación Competitiva (AJPC) Webpage** project. This is a full-stack web application designed to manage courses, student enrollments, attendance, and provide a comprehensive platform for the competitive programming academy.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture and Codebase](#architecture-and-codebase)
- [Setup and Installation](#setup-and-installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **User Authentication:** Secure login via Discord OAuth 2.0.
- **Role-Based Access Control (RBAC):** Differentiated access for students, teachers (`docente`), administrators, and super administrators (`sudo`).
- **Course Management:** Administrators can create, update, and delete courses, including defining levels, schedules, and capacity.
- **Section Management:** Organize courses into parallel sections, assign teachers, and manage student groups.
- **Student Enrollment:** A detailed enrollment process with personal, academic, and motivational information, including schedule preferences.
- **Enrollment Workflow:** Admin review and approval/rejection of student applications, with automated Discord integration and email notifications.
- **Attendance Tracking:** Teachers can record and manage student attendance for modules.
- **Module & Material Management:** Create course modules and attach various learning materials (links, documents, videos).
- **Student Observations:** Teachers can add private observation notes for students within their assigned courses.
- **Invite System:** Generate role-specific invite codes for easy onboarding of new users.
- **Email Notifications:** Customizable email templates for enrollment status updates, general announcements, and more, powered by Google Workspace Gmail API.
- **Discord Integration:** Automatic addition/removal of students to course-specific Discord guilds and role assignments upon enrollment approval/rejection.
- **System Settings:** Admin control over various application settings.
- **Responsive Design:** Optimized for various devices and screen sizes.

## Technologies Used

This project leverages a modern and robust technology stack:

- **Framework:** [Astro](https://astro.build/) (v5.x) - For fast content delivery, static site generation (SSG), and server-side rendering (SSR) with Islands Architecture.
- **UI Library:** [Svelte](https://svelte.dev/) (v5.x) - For building highly reactive and efficient user interface components.
- **API Layer:** [tRPC](https://trpc.io/) (v11.x) - For building type-safe APIs, ensuring end-to-end type safety between frontend and backend.
- **Database:** [Turso](https://turso.tech/) / [LibSQL](https://libsql.org/) - A SQLite-compatible distributed database.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/) (v0.45.x) - A TypeScript-first ORM for database schema definition and querying.
- **Authentication:** [Arctic](https://arctic.js.org/) (v1.x) - For Discord OAuth 2.0 integration and session management.
- **Validation:** [Zod](https://zod.dev/) (v3.x) - For schema validation throughout the application.
- **Styling:** Custom CSS with a focus on modern, clean aesthetics.
- **Deployment:** Optimized for [Vercel](https://vercel.com/) and [Cloudflare Workers](https://workers.cloudflare.com/).

## Architecture and Codebase

For a detailed understanding of the application's overall architecture, component interactions, and key codebase areas, please refer to the following documents:

- [**Codebase Analysis**](CODEBASE_ANALYSIS.md): Detailed breakdown of the project structure, database schema, API design, external integrations, authentication system, and key workflows.

## Setup and Installation

To get a local development environment up and running, follow these steps:

### Prerequisites

- Node.js (v18.x or later)
- pnpm (recommended package manager)
- Git
- A Discord Application for OAuth2 (Client ID, Client Secret, Redirect URI)
- A Turso/LibSQL database instance (URL, Auth Token)
- A Google Cloud Project with Gmail API enabled and a Service Account Key for sending emails.
- A Discord Bot Token for advanced Discord guild management (optional, but recommended for full functionality).

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/ajpc-webpage.git
cd ajpc-webpage
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root of the project by copying `.env.example` and filling in the required values:

```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:

```ini
# Discord OAuth
DISCORD_CLIENT_ID="YOUR_DISCORD_CLIENT_ID"
DISCORD_CLIENT_SECRET="YOUR_DISCORD_CLIENT_SECRET"
DISCORD_REDIRECT_URI="http://localhost:4321/api/auth/callback" # Update for production

# Database
TURSO_DATABASE_URL="YOUR_TURSO_DATABASE_URL"
TURSO_AUTH_TOKEN="YOUR_TURSO_AUTH_TOKEN"

# Session
SESSION_SECRET="A_LONG_RANDOM_STRING_MIN_32_CHARS_FOR_HMAC_SIGNING"

# Email (Google Workspace Gmail API)
GOOGLE_SERVICE_ACCOUNT_KEY="YOUR_GOOGLE_SERVICE_ACCOUNT_KEY_JSON_AS_STRING" # Entire JSON key as a single-line string
GOOGLE_SENDER_EMAIL="your-sender-email@example.com"
GOOGLE_SENDER_NAME="AJPC Notifications" # Optional

# Discord Bot (for managing guild members and roles)
DISCORD_BOT_TOKEN="YOUR_DISCORD_BOT_TOKEN" # Required for Discord integration features
```

**Note:** The `GOOGLE_SERVICE_ACCOUNT_KEY` should be the entire JSON content of your service account key file, escaped to fit on a single line. For example, `{ "type": "service_account", ... }`.

### 4. Run Database Migrations

Apply the Drizzle ORM migrations to your Turso database:

```bash
pnpm drizzle-kit push:libsql
```

### 5. Seed Initial Data (Optional)

If you want to populate your database with some initial data (e.g., for testing), you can run the seed script:

```bash
pnpm run seed
```

## Running the Application

### Development Server

To start the local development server:

```bash
pnpm run dev
```

The application will be accessible at `http://localhost:4321`.

### Build for Production

To build the application for production:

```bash
pnpm run build
```

This will generate the production-ready assets in the `./dist/` directory. If deploying to Cloudflare, use `pnpm run build:cf`.

### Preview Production Build

To preview the production build locally:

```bash
pnpm run preview
```

## Project Structure

```
/
├── public/                  # Static assets served directly
├── src/
│   ├── assets/              # Images, icons, and other static content
│   ├── components/          # Reusable Astro and Svelte UI components
│   ├── constants/           # Application-wide constants
│   ├── db/                  # Drizzle ORM schema and database connection
│   ├── layouts/             # Astro layout components
│   ├── lib/                 # Core utility functions (auth, email, Discord, etc.)
│   ├── pages/               # Astro routes (public, admin, dashboard, API)
│   ├── styles/              # Global CSS stylesheets
│   ├── trpc/                # tRPC API router definitions and client setup
│   ├── types/               # Custom TypeScript type definitions
│   └── utils/               # General utility functions
├── drizzle/                 # Drizzle ORM migrations and snapshots
├── astro.config.mjs        # Astro framework configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Project dependencies and scripts
└── .env.example            # Example environment variables
```

For a more detailed breakdown of the project structure, refer to the [Codebase Analysis](CODEBASE_ANALYSIS.md).

## License

[Specify your project's license here, e.g., MIT License.](LICENSE.md) (If applicable)
