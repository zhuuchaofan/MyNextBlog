# AI Context for MyNextBlog

> **Role**: You are an expert Full-Stack Developer acting as a maintainer for this project.
> **Goal**: Read this document to understand the project's architecture, conventions, and current state before making any changes.

---

## 1. Project Identity

- **Name**: MyNextBlog
- **Type**: Headless Technical Blog System
- **Architecture**: Monorepo with decoupled Frontend (Next.js) and Backend (.NET API).
- **Core Philosophy**: High performance, engineering quality, SEO-friendly, Mobile-first.

## 2. Tech Stack

### Backend (`/backend`)

- **Framework**: .NET 10 (Preview) / ASP.NET Core Web API
- **Language**: C# 13
- **Database**: PostgreSQL (Entity Framework Core 8.0 + Npgsql)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Logging**: Serilog (Console + Rolling File in `/logs`)
- **Docs**: Swagger (Swashbuckle)

### Frontend (`/frontend`)

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui, lucide-react
- **Markdown**: react-markdown, rehype-highlight, remark-gfm
- **State**: Context API (`AuthContext`) + LocalStorage

### DevOps

- **Containerization**: Docker, Docker Compose
- **Proxy**: Cloudflare Tunnel (Production)

---

## 3. Key Architecture & Mechanisms

### 🆔 Authentication & User

- **Method**: JWT (Stateless). Headers: `Authorization: Bearer <token>`
- **Roles**: `Admin` (Can create/edit/delete), `User` (Can comment/update profile).
- **Avatar**:
  - Priority: Custom User Upload (`User.AvatarUrl`).
  - Fallback: DiceBear API based on username seed.
  - **Implementation**: `AccountApiController` handles uploads -> R2 -> DB Update.

### 📡 API & Data Flow (CRITICAL)

- **Pattern**: **DTO Pattern is STRICTLY ENFORCED.**
  - Controllers MUST NOT return Database Entities (`Post`, `User`).
  - Controllers MUST return DTOs (`PostSummaryDto`, `PostDetailDto`) defined in `backend/DTOs`.
  - Mapping logic resides in `backend/Extensions`.
- **Fields**: API returns **camelCase** JSON. Frontend interfaces in `lib/api.ts` must match (e.g., `categoryName`, `authorName`).

### 💾 Data & Backup

- **Persistence**: PostgreSQL database with Docker volume mount at `data/postgres`.
- **Backup**: A hosted service `DatabaseBackupService` runs daily (24h) to upload database snapshot to Cloudflare R2 `backups/` folder.

### 📝 Content Management

- **Format**: Markdown.
- **Images**: Uploaded to R2 via `UploadController` or `AccountController`.
- **Excerpt**: Generated backend-side via `MarkdownHelper` (Regex-based cleaning).
- **Search**: Server-side filtering in `PostService`.

---

## 4. Directory Structure Key

- `backend/`
  - `Controllers/Api/`: JSON APIs (e.g., `PostsApiController`, `AccountApiController`).
  - `DTOs/`: Data Transfer Objects (Records).
  - `Models/`: EF Core Database Entities.
  - `Services/`: Business Logic (`PostService`, `R2StorageService`).
  - `Extensions/`: DTO Mappings.
- `frontend/`
  - `app/`: Next.js Pages (`page.tsx`, `layout.tsx`).
  - `components/`: Reusable UI (`Navbar`, `MarkdownRenderer`).
  - `lib/`: Utilities & API clients (`api.ts`, `constants.ts`).
  - `context/`: Global state (`AuthContext`).

---

## 5. Development Rules (Conventions)

1.  **No Entities in API**: Always create a DTO if one doesn't exist for the response.
2.  **Mobile First**: Always verify UI on mobile viewport. Use `overflow-x-auto` for tables.
3.  **Explicit Includes**: In `PostService`, always `.Include()` related data (`Category`, `User`, `Tags`) to avoid nulls.
4.  **Logging**: Use `_logger.LogInformation()` in backend; Serilog handles the rest.
5.  **Accessibility**: Ensure `aria-label` on buttons/links and sufficient color contrast.

---

## 6. Recent Changes (as of 2025-12-06)

- [x] **Feature**: Implemented RSS Feed (`/feed.xml`).
- [x] **Feature**: Added Dark Mode support (Theme Toggle, Tailwind `dark:` styles).
- [x] **Fix**: Corrected Docker container timezone to `Asia/Shanghai`.
- [x] **Fix**: Resolved Comment API 500 error (Removed `UserManager` dependency) and User Avatar display issue.
- [x] **Refactor**: Converted `PostsApiController` to use DTOs (`PostSummaryDto`).
- [x] **Feature**: Added User Settings page & Avatar Upload.

## 7. Immediate Roadmap

- [x] **RSS/Atom Feed**: Generate `feed.xml` in Next.js.
- [x] **Dark Mode**: Toggle via `next-themes`.
- [x] **Admin Features**: Add "Drafts" status management and toggle visibility.
- [ ] **Testing**: (Cancelled due to .NET Preview environment issues).
- [ ] **Admin Features**: Dashboard statistics (Post count, Comment count).

---

## 8. Architectural Review & Future Improvements (as of 2025-10)

This section outlines observations and potential areas for architectural refinement and future enhancements.

### 8.1 High Priority / Major Improvement Areas

1.  **Reliance on .NET 10 Preview**:

    - **Observation**: The backend currently targets .NET 10 Preview.
    - **Concern**: Using a preview version in a "production-ready" (even personal) project introduces significant risks including potential instability, undetected bugs, performance regressions, and breaking changes in future releases. This can lead to increased maintenance overhead and unexpected issues.
    - **Recommendation**: Strongly consider upgrading to a stable, officially released version of .NET (e.g., .NET 8 LTS or the next stable release if .NET 10 stabilizes soon) for improved stability and long-term support.

2.  **Lack of Automated Testing (Backend & Frontend)**:
    - **Observation**: Automated unit and integration tests are currently not implemented (backend unit test setup was attempted but halted due to environment issues).
    - **Concern**: Absence of automated tests increases the risk of regressions, makes refactoring difficult and time-consuming, and significantly slows down future feature development as manual testing becomes the primary verification method.
    - **Recommendation**: Prioritize implementing automated tests for critical business logic (backend services) and key user flows (frontend UI). Revisit backend unit testing when a stable .NET environment is available, and consider Playwright/Cypress for frontend integration tests.

### 8.2 Medium Priority / Design Refinement Areas

1.  **Service Layer's Awareness of User Roles (`isAdmin`)**:

    - **Observation**: In `PostService.GetAllPostsAsync(includeHidden: isAdmin)`, the service layer receives `isAdmin` directly.
    - **Concern**: From a strict Separation of Concerns (SoC) perspective, the service layer should ideally be agnostic to the caller's role. It should only execute the task it's given (e.g., "get posts including hidden ones" or "get only visible posts"). The decision of _whether_ to include hidden posts should be made at the authorization/controller level.
    - **Recommendation**: While functional, a slightly cleaner approach would be for the controller to determine the `includeHidden` flag based on user roles/policies and pass a fully formed query parameter object to the service.

2.  **Manual Frontend API Client Maintenance**:

    - **Observation**: Frontend API client (`frontend/lib/api.ts`) interfaces and `fetch` calls are manually written and maintained based on backend DTOs.
    - **Concern**: This manual process is prone to human error and can lead to inconsistencies between frontend expectations and backend API contracts, especially as APIs evolve.
    - **Recommendation**: Explore integrating automated API client generation tools (e.g., NSwag for .NET + TypeScript) to generate client code from the backend's OpenAPI (Swagger) specification. This ensures type safety and reduces manual synchronization effort.

3.  **Timezone Handling in Database**:
    - **Observation**: Currently, `DateTime.Now` is used, and the Docker container's timezone is set to `Asia/Shanghai`.
    - **Concern**: While effective for a single-region blog, a more universally robust practice for `DateTime` handling is to store all dates in **UTC** in the database. Conversion to local time (or specific timezones) should happen at the presentation layer (frontend) or just before display.
    - **Recommendation**: For current scope, it's acceptable. For future global scalability, storing UTC is preferred.

### 8.3 Potential Optimization / UI/UX Enhancements

1.  **More Flexible Styling/Theming System**:
    - **Observation**: Dark mode relies heavily on direct `dark:` Tailwind classes.
    - **Recommendation**: For greater flexibility and easier customization (e.g., allowing users to choose different color themes), consider using CSS Variables to define theme-dependent colors. Tailwind can then read from these CSS variables, making global theme changes simpler and more maintainable.

---

This architectural review aims to guide future development and ensure the project's long-term health and maintainability.
