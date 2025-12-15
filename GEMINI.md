# GEMINI.md

## Core Philosophy
1.  **Follow Standards**: Adhere to established conventions (e.g., standard Tailwind classes, RESTful API patterns, Clean Architecture) to ensure maintainability and consistency.
2.  **Simplicity**: Strive for the simplest code implementation that fully meets the requirement. Avoid over-engineering. "Thin Controllers, Rich Services."
3.  **Review**: Regularly review code and decisions to remove redundancy and ensure quality.

## Project Overview

MyTechBlog is a modern, full-stack personal tech blog built with a **Headless Architecture**.
It consists of a **.NET 10 Web API** backend and a **Next.js 15** frontend, utilizing the **BFF (Backend for Frontend)** pattern for security.

### Key Technologies:

*   **Backend:** .NET 10 Preview, ASP.NET Core Web API, Entity Framework Core (SQLite), Cloudflare R2 Storage.
*   **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
*   **Authentication:**
    *   **Backend**: JWT (JSON Web Tokens) with BCrypt hashing.
    *   **Frontend**: HttpOnly Cookie (Secure storage), Middleware Proxy (Token Injection).
*   **Infrastructure**: Docker Compose, Cloudflare R2.

## Architecture & Patterns

### 1. Backend (.NET API)
*   **Layered Architecture**: `Controllers` -> `Services` -> `Data/Models`.
*   **Thin Controllers**: Controllers should only handle HTTP concerns (request parsing, response formatting). Business logic MUST be in Services.
    *   *Refactored (2025-12-15)*: `CommentsController`, `AccountController`, and `AuthController` have been stripped of logic.
*   **Rich Services**: Services encapsulate business rules, validation, and data access.
    *   `UserService`: Handles profile updates, avatar uploads.
    *   `CommentService`: Handles spam checks, XSS sanitization, notifications.
    *   `AuthService`: Handles registration, login, token generation.
*   **Data Access**:
    *   Use `AsNoTracking()` for read-only queries.
    *   Use `DTOs` (Data Transfer Objects) for all API I/O. **Never expose Entity Models directly.**
    *   **DTO Convention**: Use `record` types for DTOs (e.g., `public record LoginDto(...)`).

### 2. Frontend (Next.js Client)
*   **App Router**: Uses the `/app` directory structure with Route Groups (`(public)`, `(admin)`, `(auth)`).
*   **BFF Pattern**:
    *   **Client**: Never sees the JWT. Authenticates via `/api/auth/login` (Next.js Route Handler).
    *   **Middleware**: Intercepts requests to `/api/backend/*`, injects the `Authorization: Bearer <token>` header from the HttpOnly cookie, and proxies to the .NET backend.
*   **UI/UX Design**:
    *   **Style**: "Bento Grid" modern aesthetic.
    *   **Components**: `BackgroundGrid` (global subtle grid), frosted glass cards (`bg-white/80 backdrop-blur-sm`), consistent border/shadow usage.
    *   **Libraries**: `lucide-react` for icons, `shadcn/ui` for components.

## Development Workflows

### Running the Project
**CRITICAL RULE**: Always use Docker Compose to ensure network and environment consistency.

```bash
docker compose up -d --build
```

### Backend Development
*   **Location**: `/backend`
*   **Build**: `dotnet build`
*   **Run**: `dotnet watch run` (for hot reload during dev)
*   **Migrations**: Use `dotnet ef migrations add <Name>` (ensure correct startup project).

### Frontend Development
*   **Location**: `/frontend`
*   **Build**: `npm run build`
*   **Run**: `npm run dev`

## Recent Context & Changes (Dec 2025)

1.  **Backend Refactoring**:
    *   **Comments**: Moved XSS/Spam logic to `CommentService`. Added nested comments and parent ID support.
    *   **Auth**: Implemented `RegisterAsync` in `AuthService`.
    *   **User**: Created `UserService` to handle profile logic.
2.  **Frontend Redesign**:
    *   **About Page**: Completely redesigned with a Bento Grid layout, Timeline, and Skill Tree.
    *   **Home Page**: Updated article cards to match the Bento style (frosted glass, borders).
    *   **Global UI**: Added `BackgroundGrid` component to `layout.tsx` for a unified visual theme.
3.  **Documentation**:
    *   Updated `README.md` and `constants.ts` to reflect the latest project state and the author's real-world timeline (Fujitsu migration experience).

## Common Tasks Checklist

*   **New API Endpoint**:
    1.  Define DTO `record`.
    2.  Add method to `IService` interface.
    3.  Implement logic in `Service`.
    4.  Add endpoint to `Controller` (call service, return DTO).
*   **New UI Page**:
    1.  Create `page.tsx` in `app`.
    2.  Use `BackgroundGrid` (already in layout).
    3.  Use `Card` components with `backdrop-blur` styles for content.
