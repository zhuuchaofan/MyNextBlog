# GEMINI.md

## Project Overview

This is a modern, full-stack personal tech blog built with a **Headless Architecture**. 
It consists of a **.NET 10 Web API** backend and a **Next.js 15** frontend.

### Key Technologies:

*   **Backend:** .NET 10, ASP.NET Core Web API, Entity Framework Core (SQLite), Cloudflare R2 Storage.
*   **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui.
*   **Authentication:** JWT (JSON Web Tokens) for API/Client, BCrypt for hashing.

## Architecture Status: Headless (Separated)

The project has successfully migrated from a traditional MVC architecture to a Headless architecture.

### 1. Backend (.NET API)
*   **Role**: Pure API provider. Serves JSON data to the Next.js frontend.
*   **Port**: Default `5095` (http) / `7153` (https).
*   **Auth**: Validates JWT tokens via `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`.
*   **Key Controllers**:
    *   `PostsApiController`: CRUD for posts. Supports pagination, filtering, and hidden posts (for admins).
    *   `AuthController`: Handles login and JWT generation.
    *   `UploadController`: Handles image uploads to R2. Supports JWT auth.
    *   `CommentsController` & `CategoriesController`.
    *   `TagsController`: Handles popular tags.
    *   `GalleryController`: Handles image gallery filtering.
*   **CORS**: Configured to allow `http://localhost:3000`.

### 2. Frontend (Next.js Client)
*   **Location**: `/client` directory.
*   **Role**: Handles all UI, routing, and user interaction (Public & Admin).
*   **Port**: `3000`.
*   **Proxy**: Uses `next.config.ts` rewrites (`/api/backend/*` -> `http://localhost:5095/api/*`) to allow cross-device access (e.g., mobile testing) and avoid CORS issues in some scenarios.
*   **State Management**: `AuthContext` manages user session and JWT token in `localStorage`.
*   **Key Features**:
    *   **Public**: Home, Post Detail (SSR + Markdown + TOC), Archive, About, Category Filter, Gallery, Search.
    *   **Admin**: Protected Dashboard (`/admin`), Markdown Editor (with Paste-to-Upload + Compression), Post Management (Edit/Delete with Dialogs + Pagination).
    *   **UI Libs**: `shadcn/ui`, `sonner`, `lucide-react`, `react-photo-album`, `yet-another-react-lightbox`, `browser-image-compression`.

## Development Workflows

### Running the Project
1.  Start Backend: `dotnet run`
2.  Start Frontend: `cd client && npm run dev`

### Authentication Logic
*   **Login**: `POST /api/backend/auth/login` -> Get Token -> Store in Context/LocalStorage.
*   **API Calls**: Attach `Authorization: Bearer <token>` header.
*   **Protection**:
    *   **Backend**: `[Authorize(Roles = "Admin")]` on critical endpoints.
    *   **Frontend**: `useAuth()` hook checks user role; redirects to `/login` if unauthorized.

## Recent Major Changes
*   **2025-12-05**:
    *   **Tags System**: Implemented full `Tag` entity (Many-to-Many with Post), backend API, and frontend input/display logic.
    *   **Gallery**: Added `/gallery` page with Masonry layout, powered by `GalleryController` filtering "Cat" related content.
    *   **Image Optimization**: Implemented client-side image compression (WebP, Max 1MB) before upload.
    *   **UI/UX Polish**: Fixed mobile layout overflows, added pagination (Home/Admin), improved Markdown excerpt generation, and unified global assets (constants.ts).
    *   **Search**: Added global search dialog and dedicated search results page with tag filtering.
*   **2025-12-04**: Completed Admin Dashboard in Next.js. Implemented Post CRUD, Markdown Editor with image upload, and full JWT integration. Replaced native alerts with `sonner` toasts and `alert-dialog`.
*   **2025-12-03**: Initialized Next.js project. Implemented Public views (Home, Post, Comments). Configured API Proxy.

## Database Schema
*   **Post**: `Id`, `Title`, `Content`, `CategoryId` (nullable), `UserId`, `IsHidden`, `CreateTime`.
*   **Category**: `Id`, `Name`.
*   **Tag**: `Id`, `Name`.
*   **PostTag**: Junction table (`PostId`, `TagId`).
*   **User**: `Id`, `Username`, `PasswordHash`, `Role` ("Admin" or "User").
*   **Comment**: `Id`, `PostId`, `Content`, `GuestName`, `CreateTime`.
*   **ImageAsset**: `Id`, `Url`, `StorageKey`, `PostId` (for GC).
