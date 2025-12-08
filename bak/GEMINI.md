# GEMINI.md

## Core Philosophy
1.  **Follow Standards**: Adhere to established conventions (e.g., standard Tailwind classes, RESTful API patterns) to ensure maintainability and consistency.
2.  **Simplicity**: Strive for the simplest code implementation that fully meets the requirement. Avoid over-engineering.
3.  **Review**: Regularly review code and decisions to remove redundancy and ensure quality.

## Project Overview

This is a modern, full-stack personal tech blog built with a **Headless Architecture**. 
It consists of a **.NET 10 Web API** backend and a **Next.js 15** frontend (BFF Pattern).

### Key Technologies:

*   **Backend:** .NET 10, ASP.NET Core Web API, Entity Framework Core (SQLite), Cloudflare R2 Storage.
*   **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
*   **Authentication:** 
    *   **Backend**: JWT (JSON Web Tokens).
    *   **Frontend**: HttpOnly Cookie (Secure storage), Middleware Proxy (Token Injection).
    *   **Flow**: Login -> Next.js Route Handler sets Cookie -> Middleware reads Cookie & adds Authorization header -> Backend validates Token.

## Architecture: BFF (Backend for Frontend)

The system uses Next.js as a secure intermediate layer.

1.  **Client (Browser)**: Does not store tokens. Communicates with Next.js Routes (`/api/backend/*`).
2.  **Next.js Server**:
    *   **Server Components**: Fetch data directly from backend (Docker network) using `lib/data.ts` (manually injecting cookies).
    *   **Middleware (`middleware.ts`)**: Intercepts requests to `/api/backend/*`, reads `token` from HttpOnly Cookie, injects `Authorization: Bearer <token>` header, and rewrites to Backend API.
    *   **Route Handlers (`/api/auth/*`)**: Handle Login (set cookie), Logout (clear cookie), Me (read cookie).
3.  **Backend (.NET)**: Pure API provider. Validates standard Bearer Token.

### 1. Backend (.NET API)
*   **Role**: Pure API provider.
*   **Internal URL**: `http://backend:8080` (Docker Network).
*   **Auth**: Validates JWT tokens via `[Authorize]`.
*   **Key Controllers**:
    *   `PostsApiController`: CRUD for posts. Supports `includeHidden` for Admins.
    *   `TagsController`: Only returns tags for *visible* posts to public users.

### 2. Frontend (Next.js Client)
*   **Location**: `/client` directory.
*   **Public URL**: `http://localhost:3000`.
*   **Proxy**: 
    *   `next.config.ts`: Rewrites `/api/backend/*` -> `http://backend:8080/api/*`.
    *   `middleware.ts`: Injects Auth Header.
*   **State Management**: `AuthContext` syncs user profile (username, role, avatar) but *never* touches the token.
*   **Route Groups**:
    *   `(public)`: Visitor facing pages (Home, Post Detail). Uses `lib/data.ts` for SSR with Auth support.
    *   `(admin)`: Protected Admin Dashboard. Redirects to login if no cookie.
    *   `(auth)`: Login page.

## Development Workflows

### Running the Project (Docker)
**CRITICAL RULE**: Since this project runs in Docker with complex networking and cookies, **always use Docker Compose**.

1.  **Apply Changes**: `docker compose up -d --build`
2.  **View Logs**: `docker compose logs -f`

### Authentication Logic Update (2025-12-08)
*   **Old**: LocalStorage Token (Insecure XSS risk).
*   **New**: HttpOnly Cookie + BFF Proxy.
    *   **Login**: POST `/api/auth/login` (Next.js Handler) -> Proxy to Backend -> Set-Cookie.
    *   **API Calls (Client)**: `fetch('/api/backend/posts')` -> Browser sends Cookie -> Middleware adds Header -> Backend.
    *   **API Calls (Server)**: `getPost(id)` in `lib/data.ts` -> `cookies().get('token')` -> Add Header manually -> Backend.

## Recent Major Changes
*   **2025-12-08**:
    *   **Architecture Overhaul**: Migrated to BFF pattern with HttpOnly Cookie Auth.
    *   **Directory Structure**: Organized into `(public)`, `(admin)`, `(auth)` Route Groups.
    *   **Performance**: Converted Home Page to Server Component with direct backend fetching (no client waterfalls).
    *   **Security Fixes**: Fixed Tag leakage (hidden posts' tags showing) and Admin Draft Preview (404 issue).
    *   **UX**: Added Custom 404 Page (`not-found.tsx`).
*   **2025-12-06**: Added RSS Feed, Dark Mode, Gallery, Tags System.

## Database Schema
*   **Post**: `Id`, `Title`, `Content`, `CategoryId`, `UserId`, `IsHidden`, `CreateTime`.
*   **User**: `Id`, `Username`, `PasswordHash`, `Role`, `AvatarUrl`.
*   **Tag**: `Id`, `Name`.
*   **PostTag**: `PostId`, `TagId`.