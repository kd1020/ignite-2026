# ⚡ IGNITE 2026

> **The Competitive Campus Tournament Platform & Operations Controller**  
> *"Your Next Chapter Starts Here. Not Just An Event. Your Origin Story."*

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-F04444?style=for-the-badge)](#)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started (Developer Quickstart)](#-getting-started-developer-quickstart)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Execution](#installation--local-execution)
  - [Zero-Config Demo Mode vs. Connected Backend](#zero-config-demo-mode-vs-connected-backend)
- [Database Setup & Supabase Configuration](#-database-setup--supabase-configuration)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Database Migration & SQL Schema](#database-migration--sql-schema)
  - [Creating Your First Admin Account](#creating-your-first-admin-account)
- [How to Use the Website (Developer & Admin Guide)](#-how-to-use-the-website-developer--admin-guide)
  - [Public Participant Portal](#1-public-participant-portal)
  - [Administrative Controller Portal](#2-administrative-controller-portal)
- [Tournament Mechanics & Scoring Algorithms](#-tournament-mechanics--scoring-algorithms)
  - [Round 1: The Gauntlet](#round-1-the-gauntlet)
  - [Round 2: The Hit List](#round-2-the-hit-list)
  - [Round 3: The Power Play](#round-3-the-power-play)
- [How to Modify the Codebase](#-how-to-modify-the-codebase)
  - [Updating Tournament Content & Zones](#1-updating-tournament-content--zones)
  - [Modifying the Design System (Theme & Colors)](#2-modifying-the-design-system-theme--colors)
  - [Adjusting Scoring Formulas](#3-adjusting-scoring-formulas)
  - [Adding a New Admin Module / View](#4-adding-a-new-admin-module--view)
  - [Customizing Registration Validation](#5-customizing-registration-validation)
- [Security, RLS & Data Protection](#-security-rls--data-protection)
- [Deployment Guide](#-deployment-guide)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🌟 Overview

**IGNITE 2026** is a full-stack tournament platform created for a high-intensity, multi-stage campus competition. Built with a vibrant pop-art / comic-book aesthetic (hard drop-shadows, bold comic typography, halftone overlays, and high-contrast colorways), the system provides both a public engagement website and a secure administrative command center.

### Core Capabilities:
1. **Public Showcase & Team Registration**: Responsive landing page with animated background video, detailed round breakdowns, dynamic team roster registration with Indian mobile validation, and live leaderboard rankings.
2. **Zero-Config Demo Fallback**: Works immediately out-of-the-box using mock seed data and simulated network responses when no database credentials are provided.
3. **Enterprise PostgreSQL Backend**: Powered by Supabase with Row Level Security (RLS), column-level data masking (protecting participant contact details), automated calculation triggers, and immutable audit logging.
4. **Operations Controller (Admin Portal)**: Role-gated dashboard (`super_admin`, `scorekeeper`, `referee`) for managing teams, scoring Round 1 zones in real time, managing Round 2 head-to-head duels, adjusting global tournament parameters, and reviewing security audit trails.

---

## 🏗 Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                  │
│  React 18.3 (SPA) • Vite 5.4 • Vanilla CSS (Tokens & Comic Aesthetics) │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌──────────────────────────┐
       │   Public Web Portal    │      │   Admin Controller (/admin)│
       │  - Hero Video          │      │  - Dashboard & KPIs      │
       │  - Rounds Breakdown    │      │  - Teams & Rosters Mgr   │
       │  - Squad Registration  │      │  - R1 Gauntlet Scoring   │
       │  - Live Standings Grid │      │  - R2 1v1 Duels Engine   │
       └────────────┬───────────┘      │  - Standings Inspector   │
                    │                  │  - Event Configuration   │
                    │                  │  - Immutable Audit Log   │
                    │                  └─────────────┬────────────┘
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SERVICES & STATE LAYER                          │
│   AuthContext.jsx • api.js (Dual Mode) • publicService • adminService  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE / POSTGRESQL                          │
│   - Supabase Auth (Email / Password)                                   │
│   - RLS Policies & Column Grants (Phone Number Masking)                │
│   - Stored Procedures: fn_correct_round1_score, fn_record_round2_result│
│   - Triggers: fn_calculate_round1_points, fn_validate_round2_match     │
│   - Views: public_leaderboard, public_teams, public_fixtures           │
│   - Tables: teams, team_members, round1_scores, round2_fixtures,       │
│             round2_matches, event_settings, audit_logs, admin_users    │
└────────────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [React 18](https://react.dev/) | Component architecture, hooks, and native state management |
| **Tooling & Bundler** | [Vite 5](https://vitejs.dev/) | Instant Hot Module Replacement (HMR) and optimized build pipeline |
| **Styling** | Vanilla CSS (CSS3) | Design token system in `variables.css`, responsive layout, custom comic borders and shadows |
| **Typography** | Google Fonts | `Bangers` (display hero titles), `Bungee` (badges & headings), `Space Grotesk` (clean body text) |
| **Routing** | Hash / History API | Lightweight client-side router in `App.jsx` supporting `/admin`, `#admin`, and root `/` |
| **Database & Auth** | [Supabase](https://supabase.com/) | Managed PostgreSQL 15+, JWT Auth, Realtime-ready, Row-Level Security |
| **Hosting & Rewrite** | Vercel / Static | Configured with `vercel.json` SPA catch-all rewrites |

---

## 📁 Project Directory Structure

```text
ignite-2026/
├── public/
│   └── video.mp4                     # Background video asset for Hero section
├── src/
│   ├── admin/                        # Administrative Operations Portal
│   │   ├── pages/
│   │   │   ├── AdminLogin.jsx        # Admin credential authentication view
│   │   │   ├── AdminLogin.css
│   │   │   ├── DashboardOverview.jsx # Operations KPI counters & status
│   │   │   ├── DashboardOverview.css
│   │   │   ├── TeamsManager.jsx      # Team approval, check-in & ID assignment
│   │   │   ├── TeamsManager.css
│   │   │   ├── Round1Scoring.jsx     # Live Gauntlet zone scoring & audit corrections
│   │   │   ├── Round1Scoring.css
│   │   │   ├── Round2Matches.jsx     # Hit List 1v1 match recording & point deltas
│   │   │   ├── Round2Matches.css
│   │   │   ├── LeaderboardManager.jsx# Standings monitor & rank verification
│   │   │   ├── LeaderboardManager.css
│   │   │   ├── EventSettings.jsx     # Tournament parameters & toggle controls
│   │   │   ├── EventSettings.css
│   │   │   ├── AuditLogViewer.jsx    # Immutable database audit trail viewer
│   │   │   └── AuditLogViewer.css
│   │   ├── AdminLayout.jsx           # Sidebar navigation, topbar & auth protection
│   │   └── AdminLayout.css
│   ├── components/                   # Public Landing Page Components
│   │   ├── Navbar.jsx / .css         # Responsive sticky header & mobile drawer
│   │   ├── Hero.jsx / .css           # Video background, sticker tags & CTA
│   │   ├── EventIntro.jsx / .css     # "This is IGNITE" narrative panel
│   │   ├── RoundOverview.jsx / .css  # 3-card tournament overview grid
│   │   ├── RoundDetails.jsx / .css   # Deep dives: 8 zones, formula & duels
│   │   ├── Registration.jsx / .css   # Public team registration form with validation
│   │   ├── Leaderboard.jsx / .css    # Searchable & sortable live standings table
│   │   └── Footer.jsx / .css         # Marquee ticker tape, quick links & credits
│   ├── context/
│   │   └── AuthContext.jsx           # Supabase session, admin profile & login/logout
│   ├── data/
│   │   ├── eventData.js              # Source of truth for rules, zones & copy
│   │   └── leaderboardData.js        # Fallback demo teams and table metadata
│   ├── lib/
│   │   └── supabaseClient.js         # Supabase client instantiation & config check
│   ├── services/
│   │   ├── api.js                    # Facade service with automated demo fallback
│   │   ├── publicService.js          # Direct Supabase queries for public actions
│   │   └── adminService.js           # Privileged Supabase RPCs and admin queries
│   ├── styles/
│   │   ├── variables.css             # Design tokens: palette, shadows, comic borders
│   │   └── global.css                # Global CSS resets, badges, buttons, panels
│   ├── utils/
│   │   └── validation.js             # Indian phone number normalizer & form checks
│   ├── App.jsx                       # Master router between public site & admin
│   ├── App.css
│   └── main.jsx                      # App root wrapped in AuthProvider
├── supabase/
│   └── migrations/
│       └── 20260101000000_ignite_schema.sql # Complete PostgreSQL schema & RLS
├── .env.example                      # Template for Supabase credentials
├── index.html                        # HTML5 shell, favicon SVG & Google Fonts
├── package.json                      # Project dependencies & scripts
├── vercel.json                       # Vercel deployment rewrite rules
└── vite.config.js                    # Vite bundler configuration (port 3000)
```

---

## 🚀 Getting Started (Developer Quickstart)

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (packaged with Node.js)
- *(Optional)* A [Supabase](https://supabase.com/) project if running with the live database.

### Installation & Local Execution

1. **Clone the repository and enter directory**:
   ```bash
   git clone <repository-url>
   cd ignite-2026
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the application in your browser**:
   - **Public Website**: [http://localhost:3000](http://localhost:3000)
   - **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin) *(or click the **Admin** link in the navigation bar)*

5. **Other npm scripts**:
   ```bash
   npm run build      # Compile production bundle into dist/
   npm run preview    # Locally test the production build
   ```

---

### Zero-Config Demo Mode vs. Connected Backend

The application incorporates an intelligent **Graceful Fallback Mechanism** in `src/services/api.js`:

| Feature | Zero-Config Demo Mode (No `.env`) | Connected Backend (Supabase Configured) |
| :--- | :--- | :--- |
| **Setup Needed** | **None** — Just `npm run dev` | Create `.env` + run migration SQL |
| **Team Registration** | Simulates submission and generates `IGN-2026-XXX` reference ID | Inserts into `public.teams` & `public.team_members` |
| **Leaderboard** | Displays static 10 demo teams from `leaderboardData.js` | Fetches live rankings from `public_leaderboard` view |
| **Admin Login** | Blocked until credentials exist in Supabase | Authenticates against `auth.users` + `public.admin_users` |
| **Scoring & Duels** | Inactive | Real-time calculation triggers, stored procedures & audit logging |

---

## 🗄 Database Setup & Supabase Configuration

To enable the full administrative controller, real squad registrations, and live scoring, connect the app to a Supabase project.

### Environment Variables (.env)

1. Create a `.env` file in the root directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Retrieve your project credentials from **Supabase Dashboard** ➔ **Project Settings** ➔ **API**:
   ```ini
   # ====================================================================
   # IGNITE 2026: SUPABASE CLIENT CONFIGURATION
   # ====================================================================
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> [!CAUTION]
> Only provide the **anon public** key in `VITE_SUPABASE_ANON_KEY`. **NEVER** expose your Supabase `service_role` secret in frontend `.env` files.

---

### Database Migration & SQL Schema

1. Open your **Supabase Dashboard** ➔ **SQL Editor**.
2. Open the migration file: [`supabase/migrations/20260101000000_ignite_schema.sql`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/supabase/migrations/20260101000000_ignite_schema.sql).
3. Paste the entire SQL content and click **Run**.

This migration script establishes:
- **Enums**: `team_registration_status`, `zone_code` (A–H), `verification_status`, `match_result_status`, `admin_role`.
- **Tables**: `admin_users`, `event_settings`, `teams`, `team_members`, `round1_scores`, `round2_fixtures`, `round2_matches`, `audit_logs`.
- **Triggers**:
  - `trg_calculate_round1_points`: Computes Round 1 points automatically before INSERT/UPDATE.
  - `trg_validate_round2_match`: Enforces valid fixture teams and automatically assigns the loser when a winner is declared.
- **Stored Procedures**:
  - `fn_correct_round1_score`: Privileged score updates requiring a minimum 5-character audit reason.
  - `fn_record_round2_result`: Privileged duel outcome recording with audit trail insertion.
- **Masked Public Views**:
  - `public_leaderboard`: Aggregated R1 scores + R2 deltas with `DENSE_RANK()`.
  - `public_teams`: Safe public team rosters without phone numbers or admin notes.
  - `public_fixtures`: 1v1 match fixtures and completed outcomes.
- **Row Level Security (RLS)**: Strict isolation ensuring anonymous users can only submit registrations and view masked public views, while only verified administrators can modify match records.

---

### Creating Your First Admin Account

Because the admin portal checks both Supabase Auth and the `public.admin_users` table, follow these two steps to set up an admin:

1. **Create the user in Supabase Auth**:
   - Go to **Supabase Dashboard** ➔ **Authentication** ➔ **Users** ➔ **Add User**.
   - Enter an email (e.g. `admin@ignite.com`) and password.
   - Copy the newly generated **User UID** (UUID).

2. **Grant Admin Privileges in PostgreSQL**:
   - Open the **SQL Editor** and run:
     ```sql
     INSERT INTO public.admin_users (id, email, full_name, role, is_active)
     VALUES (
       'PASTE-USER-UID-HERE',
       'admin@ignite.com',
       'Tournament Director',
       'super_admin',
       true
     );
     ```

You can now navigate to `http://localhost:3000/admin` and sign in.

---

## 🎮 How to Use the Website (Developer & Admin Guide)

### 1. Public Participant Portal

The public website is designed as a single continuous experience:
- **Hero Section (`#hero`)**: High-energy presentation with autoplaying background video (`/video.mp4`), issue badges, and primary "ENTER NOW" button.
- **Event Intro (`#intro`)**: Mission statement and briefing.
- **Tournament Matrix (`#rounds`)**: Quick-glance cards summarizing Round 1 (The Gauntlet), Round 2 (The Hit List), and Round 3 (The Power Play).
- **Deep Dive Specifications (`#gauntlet-details`, `#hitlist-details`, `#powerplay-details`)**:
  - Visual 8-zone breakdown (Zones Alpha through Hotel).
  - Explicit positional scoring formula: `Score = (M - k + 1) × 1,000`.
  - Round 2 duel rules: Top 30 teams, 4 duel fixtures, $\pm30,000$ point swings.
- **Squad Registration (`#register`)**:
  - Squad name (min 3 characters).
  - Leader full name (min 2 characters).
  - Leader mobile number: Validated against Indian telecom formats (supports `+91`, `91`, leading `0`, or direct 10 digits starting with 6–9).
  - Dynamic squad member slots: Supports 1 to 5 members (add/remove inputs).
  - On submit: Returns a verification reference code.
- **Live Leaderboard Grid (`#leaderboard`)**:
  - Live search filter by team name or team ID.
  - Sorting options: Total Points, R1 Score, R2 Delta, or Rank.
  - Visual badges distinguishing top contenders.

---

### 2. Administrative Controller Portal

Access via `/admin` or `#admin`. If unauthenticated, the portal prompts for admin credentials.

```
┌────────────────────────────────────────────────────────────────────────┐
│  IGNITE 2026 // ADMIN CONTROLLER       [SUPER ADMIN] [LOGOUT] [SITE ↗]│
├──────────────┬─────────────────────────────────────────────────────────┤
│ 📊 OVERVIEW  │  OPERATIONS KPI CARDS                                  │
│              │  Total Teams | Approved | Pending | R1 Complete %       │
│ 👥 TEAMS     │  Filter by status, search, approve/reject teams,        │
│              │  assign official check-in IDs (e.g. IGN-001)            │
│ ⏱ ROUND 1   │  Select Zone (A–H), pick team, enter finishing rank k,  │
│   (GAUNTLET) │  instant score preview, correct scores with audit reason│
│ ⚔ ROUND 2   │  Manage 4 duel slots, record match winner,              │
│   (HIT LIST) │  automatic loser deduction (-30K) and winner add (+30K) │
│ 🏆 STANDINGS │  Live verified leaderboard inspector with tie checks    │
│ 📜 AUDIT LOG │  Immutable security log of all admin operations & diffs │
│ ⚙ SETTINGS  │  Toggle registration open/closed, max teams limit,      │
│              │  announcement banner message, prize pool text           │
└──────────────┴─────────────────────────────────────────────────────────┘
```

#### Admin Modules Explained:

1. **Dashboard Overview**:
   - Visual KPI stats: Total Teams Registered, Approved Squads, Pending Reviews, Total Squad Members, Round 1 Score Completion %, Completed Fixtures.
   - Quick-action shortcuts and recent audit activity feed.

2. **Teams & Rosters Manager**:
   - Filter teams by status (`all`, `pending`, `approved`, `rejected`, `disqualified`).
   - Search across squad name, assigned team number, and leader contact.
   - **Review & Status Modal**: Change status with a mandatory audit reason.
   - **Assign Team ID**: Issue an official identifier (e.g. `IGN-001`) upon physical campus check-in.
   - **Roster Inspector**: View all individual team members.

3. **Round 1 (The Gauntlet) Scoring**:
   - Filter by Zone: Zone Alpha (A) through Zone Hotel (H).
   - Enter new scores: Select approved team, choose zone, enter finishing rank $k$, select verification status (`verified`, `unverified`, `disqualified`, `did_not_finish`), and set zone capacity $M$ (default 12).
   - **Live Formula Preview**: Shows exact points that will be awarded before submitting.
   - **Score Correction Modal**: Modify existing scores via PostgreSQL RPC `fn_correct_round1_score` requiring an audit justification.

4. **Round 2 (The Hit List) Matches**:
   - Filter by duel slot (Duels 1, 2, 3, or 4).
   - Record duel outcomes: Choose winning team; the system automatically designates the losing team and commits $\pm30,000$ point adjustments via `fn_record_round2_result`.

5. **Tournament Standings (Leaderboard Manager)**:
   - Real-time view of computed rankings, tie-breaker occurrences, and points breakdown.

6. **Immutable Audit Trail (`AuditLogViewer`)**:
   - Chronological log of every admin action (`TEAM_STATUS_UPDATE`, `TEAM_NUMBER_ASSIGNED`, `SCORE_CORRECTION_R1`, `MATCH_RESULT_RECORDED_R2`, `EVENT_SETTING_UPDATE`).
   - Expandable inspect tool showing the operator ID, timestamp, justification, and JSON state diff (`previous_values` vs. `new_values`). Enforced as append-only in the database.

7. **Event Settings**:
   - Toggle squad registration open/close.
   - Adjust maximum allowed tournament teams.
   - Update live announcement banner text.
   - Customize prize pool messaging.

---

## 🎯 Tournament Mechanics & Scoring Algorithms

### Round 1: The Gauntlet
- **Format**: All squads cycle through 8 multi-disciplinary zones (**A** through **H**).
- **Time Window**: Strict 8-minute window per zone.
- **Scoring Formula**:
  $$\text{Score} = (M - k + 1) \times 1,000$$
  - $M$: Maximum number of teams assigned to that zone (standard default: 12).
  - $k$: Verified finishing position of the team in that zone ($1 \le k \le M$).
- **Zero Points Condition**: Any team that fails to complete or verify their task within the 8-minute window receives **0 points** for that zone.
- **Database Trigger**: Automatically executed by PostgreSQL trigger `trg_calculate_round1_points`.

---

### Round 2: The Hit List
- **Qualification**: Only the **Top 30 teams** on the Round 1 leaderboard advance to the Hit List grid.
- **Format**: 4 head-to-head (1v1) duel matches per team across assigned zones.
- **Point Swings**:
  - **Match Win**: $+30,000\text{ points}$
  - **Match Loss**: $-30,000\text{ points}$
- **Combined Score**:
  $$\text{Combined Score} = \sum(\text{Round 1 Zone Points}) + \sum(\text{Round 2 Duel Deltas})$$
- **Tie-Breaker Rule**: In the event of equal combined scores, higher Round 1 cumulative score wins the tie-break, followed by alphabetical squad name.

---

### Round 3: The Power Play
- **Format**: Championship stage highlighting entrepreneurial strategy and high-stakes campus leadership. Details revealed to finalists at the event briefing.

---

## 🛠 How to Modify the Codebase

### 1. Updating Tournament Content & Zones
All copy, zone definitions, instructions, and round taglines are centralized in:
👉 [`src/data/eventData.js`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/data/eventData.js)

- **Change Zone Names or Icons**: Update the `zones` array inside `ROUNDS_DATA[0].details.zones`.
- **Change Round Durations or Taglines**: Edit the respective object in `ROUNDS_DATA`.
- **Change Event Title & Hero Messaging**: Edit `EVENT_INFO`.

---

### 2. Modifying the Design System (Theme & Colors)
Design tokens are centralized in:
👉 [`src/styles/variables.css`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/styles/variables.css)

```css
:root {
  /* Brand Palette */
  --bg-color: #FFF8EE;             /* Cream parchment background */
  --color-primary-red: #F04444;    /* Electric comic red */
  --color-yellow: #FFD84D;         /* High-contrast yellow */
  --color-cyan: #42DDF5;           /* Cyber cyan */
  --color-electric-blue: #2855E8;  /* Duel blue */
  --color-black: #171717;          /* Outline ink */
  
  /* Comic Shadows & Borders */
  --border-thick: 3.5px solid var(--color-black);
  --shadow-md: 5px 5px 0px var(--color-black);
  --shadow-xl: 12px 12px 0px var(--color-black);
}
```
Global utility classes (such as `.comic-panel`, `.comic-badge`, `.comic-btn`, `.comic-input`) are located in [`src/styles/global.css`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/styles/global.css).

---

### 3. Adjusting Scoring Formulas

If tournament rules change:
1. **Frontend Visual Formula**: Update `ROUNDS_DATA[0].details.scoring` in `src/data/eventData.js`.
2. **Frontend Admin Live Preview**: Modify `livePreviewScore` in [`src/admin/pages/Round1Scoring.jsx`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/admin/pages/Round1Scoring.jsx).
3. **Backend Database Trigger**: Modify `public.fn_calculate_round1_points()` in [`supabase/migrations/20260101000000_ignite_schema.sql`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/supabase/migrations/20260101000000_ignite_schema.sql) and execute the updated function in your Supabase SQL Editor:
   ```sql
   CREATE OR REPLACE FUNCTION public.fn_calculate_round1_points()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.verification_status = 'verified' AND NEW.finishing_position IS NOT NULL THEN
       -- Modify calculation formula here:
       NEW.awarded_points := (NEW.max_teams_m - NEW.finishing_position + 1) * 1000;
     ELSE
       NEW.awarded_points := 0;
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```

---

### 4. Adding a New Admin Module / View

To add a new administrative panel (e.g., "Volunteers Manager"):
1. **Create the View**: Add `src/admin/pages/VolunteersManager.jsx` and `VolunteersManager.css`.
2. **Register in Layout**:
   - Open [`src/admin/AdminLayout.jsx`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/admin/AdminLayout.jsx).
   - Add your entry to `navItems`:
     ```javascript
     { id: 'volunteers', label: 'VOLUNTEERS', icon: '🤝' }
     ```
   - Import your component and render it conditionally:
     ```jsx
     {currentTab === 'volunteers' && <VolunteersManager />}
     ```
3. **Add Database Queries**: Place privileged Supabase calls inside [`src/services/adminService.js`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/services/adminService.js).

---

### 5. Customizing Registration Validation

Validation rules for squad submissions reside in:
👉 [`src/utils/validation.js`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/src/utils/validation.js)

- **Modify Mobile Regex**: Adjust `validateIndianMobile()` to support international prefixes or different formats.
- **Add Fields (e.g. College Name, Email)**:
  1. Add the state in `src/components/Registration.jsx`.
  2. Add the rule in `validateRegistrationForm()` inside `validation.js`.
  3. Add the column to `teams` table in SQL and update `registerTeamPublic()` in `src/services/publicService.js`.

---

## 🔒 Security, RLS & Data Protection

The system is built to safely expose public tournament information without leaking sensitive participant PII:

- **Phone Number Masking**:
  `public.teams` table contains leader phone numbers. The database schema issues:
  ```sql
  REVOKE SELECT ON public.teams FROM anon;
  GRANT SELECT (id, team_number, team_name, registration_status, created_at, updated_at) ON public.teams TO anon;
  ```
  Anonymous public users can never query phone numbers or admin operational notes.
- **Public Views with Security Invoker**:
  `public_leaderboard` and `public_teams` views expose only aggregate points, squad names, and ranks.
- **Immutable Audit Logging**:
  Table `public.audit_logs` has strict policies allowing only `INSERT` and `SELECT`. No `UPDATE` or `DELETE` policies exist, guaranteeing an immutable historical trail of all administrative score edits.

---

## 🌐 Deployment Guide

### Deploying to Vercel (Recommended)

1. **Push your code** to GitHub, GitLab, or Bitbucket.
2. **Import project** in [Vercel](https://vercel.com/new).
3. **Configure Environment Variables** in the Vercel Project Settings:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Anon API key
4. **Deploy**:
   The included [`vercel.json`](file:///c:/Users/shres/OneDrive/Desktop/Projects/ignite-2026/vercel.json) handles client-side routing rewrites so direct navigation to `/admin` works seamlessly without 404 errors.

### Manual Static Build (Any Web Host / Nginx / Netlify)

1. Generate the production build:
   ```bash
   npm run build
   ```
2. The optimized output is written to `dist/`.
3. Configure your server to route all traffic to `index.html` (Single Page Application fallback).

---

## ❓ Troubleshooting & FAQ

#### 1. Why does the leaderboard show "DEMO LEADERBOARD"?
If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not set in `.env`, the application automatically uses mock data from `src/data/leaderboardData.js`. Once valid Supabase credentials and migrations are applied, it switches to live PostgreSQL data.

#### 2. How do I switch between the public website and the admin panel?
- Click the **Admin** link in the top navigation bar or footer.
- Or navigate directly to `http://localhost:3000/admin` (or `http://localhost:3000/#admin`).
- From the admin top bar, click **VISIT PUBLIC SITE ↗** to return to the public view.

#### 3. Why can't I log into the admin dashboard?
Ensure both steps were completed:
1. The user was created in **Supabase Auth** (`auth.users`).
2. An active record with the exact same UUID was inserted into `public.admin_users` with `is_active = true`.

#### 4. The video in the hero section isn't playing.
Ensure `public/video.mp4` exists. If video playback is blocked by browser battery-saver settings or fails to load, `Hero.jsx` automatically falls back to a stylized high-energy comic background pattern.

---

## 📜 License & Credits

- **Event**: IGNITE 2026
- **Stack**: React 18, Vite, Supabase, PostgreSQL, Vanilla CSS
- Designed and engineered for high-performance competitive operations.
