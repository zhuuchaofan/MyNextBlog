# AI Context for MyNextBlog

> **Role**: You are an expert Full-Stack Developer acting as a maintainer for this project.
> **Goal**: Read this document to understand the project's architecture, conventions, and current state before making any changes.

---

## 1. Project Identity
*   **Name**: MyNextBlog
*   **Type**: Headless Technical Blog System
*   **Architecture**: Monorepo with decoupled Frontend (Next.js) and Backend (.NET API).
*   **Core Philosophy**: High performance, engineering quality, SEO-friendly, Mobile-first.

## 2. Tech Stack
### Backend (`/backend`)
*   **Framework**: .NET 10 (Preview) / ASP.NET Core Web API
*   **Language**: C# 13
*   **Database**: SQLite (Entity Framework Core 8.0)
*   **Storage**: Cloudflare R2 (S3-compatible)
*   **Logging**: Serilog (Console + Rolling File in `/logs`)
*   **Docs**: Swagger (Swashbuckle)

### Frontend (`/frontend`)
*   **Framework**: Next.js 15 (App Router, React 19)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS v4, shadcn/ui, lucide-react
*   **Markdown**: react-markdown, rehype-highlight, remark-gfm
*   **State**: Context API (`AuthContext`) + LocalStorage

### DevOps
*   **Containerization**: Docker, Docker Compose
*   **Proxy**: Cloudflare Tunnel (Production)

---

## 3. Key Architecture & Mechanisms

### 🆔 Authentication & User
*   **Method**: JWT (Stateless). Headers: `Authorization: Bearer <token>`
*   **Roles**: `Admin` (Can create/edit/delete), `User` (Can comment/update profile).
*   **Avatar**:
    *   Priority: Custom User Upload (`User.AvatarUrl`).
    *   Fallback: DiceBear API based on username seed.
    *   **Implementation**: `AccountApiController` handles uploads -> R2 -> DB Update.

### 📡 API & Data Flow (CRITICAL)
*   **Pattern**: **DTO Pattern is STRICTLY ENFORCED.**
    *   Controllers MUST NOT return Database Entities (`Post`, `User`).
    *   Controllers MUST return DTOs (`PostSummaryDto`, `PostDetailDto`) defined in `backend/DTOs`.
    *   Mapping logic resides in `backend/Extensions`.
*   **Fields**: API returns **camelCase** JSON. Frontend interfaces in `lib/api.ts` must match (e.g., `categoryName`, `authorName`).

### 💾 Data & Backup
*   **Persistence**: `data/blog.db` mounted via Docker volume.
*   **Backup**: A hosted service `DatabaseBackupService` runs daily (24h) to upload `blog.db` snapshot to Cloudflare R2 `backups/` folder.

### 📝 Content Management
*   **Format**: Markdown.
*   **Images**: Uploaded to R2 via `UploadController` or `AccountController`.
*   **Excerpt**: Generated backend-side via `MarkdownHelper` (Regex-based cleaning).
*   **Search**: Server-side filtering in `PostService`.

---

## 4. Directory Structure Key
*   `backend/`
    *   `Controllers/Api/`: JSON APIs (e.g., `PostsApiController`, `AccountApiController`).
    *   `DTOs/`: Data Transfer Objects (Records).
    *   `Models/`: EF Core Database Entities.
    *   `Services/`: Business Logic (`PostService`, `R2StorageService`).
    *   `Extensions/`: DTO Mappings.
*   `frontend/`
    *   `app/`: Next.js Pages (`page.tsx`, `layout.tsx`).
    *   `components/`: Reusable UI (`Navbar`, `MarkdownRenderer`).
    *   `lib/`: Utilities & API clients (`api.ts`, `constants.ts`).
    *   `context/`: Global state (`AuthContext`).

---

## 5. Development Rules (Conventions)

1.  **No Entities in API**: Always create a DTO if one doesn't exist for the response.
2.  **Mobile First**: Always verify UI on mobile viewport. Use `overflow-x-auto` for tables.
3.  **Explicit Includes**: In `PostService`, always `.Include()` related data (`Category`, `User`, `Tags`) to avoid nulls.
4.  **Logging**: Use `_logger.LogInformation()` in backend; Serilog handles the rest.
5.  **Accessibility**: Ensure `aria-label` on buttons/links and sufficient color contrast.

---

## 6. Recent Changes (as of 2025-12-06)
*   [x] **Feature**: Implemented RSS Feed (`/feed.xml`).
*   [x] **Feature**: Added Dark Mode support (Theme Toggle, Tailwind `dark:` styles).
*   [x] **Fix**: Corrected Docker container timezone to `Asia/Shanghai`.
*   [x] **Fix**: Resolved Comment API 500 error (Removed `UserManager` dependency) and User Avatar display issue.
*   [x] **Refactor**: Converted `PostsApiController` to use DTOs (`PostSummaryDto`).
*   [x] **Feature**: Added User Settings page & Avatar Upload.

## 7. Immediate Roadmap
*   [x] **RSS/Atom Feed**: Generate `feed.xml` in Next.js.
*   [x] **Dark Mode**: Toggle via `next-themes`.
*   [ ] **Testing**: Add xUnit (Backend) and Playwright (Frontend).
*   [ ] **Admin Features**: Add "Drafts" status management.
