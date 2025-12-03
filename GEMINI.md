# GEMINI.md

## Project Overview

This is a .NET 10 web application that functions as a personal tech blog. The project is built using ASP.NET Core MVC, Entity Framework Core for database interaction, and is configured to use a SQLite database. It includes features for managing blog posts, categories, and user authentication. The frontend is built with Bootstrap.

### Key Technologies:

*   **Backend:** C# with .NET 10, ASP.NET Core MVC
*   **Database:** Entity Framework Core with SQLite
*   **Authentication:** Cookie-based authentication
*   **Frontend:** Bootstrap, Razor Views
*   **Other Libraries:**
    *   `Markdig`: For rendering Markdown content.
    *   `BCrypt.Net-Next`: For password hashing.

### Architecture:

*   **MVC Pattern:** The application follows the Model-View-Controller (MVC) pattern.
*   **Repository/Service Pattern:** A `PostService` is used to abstract the data access logic from the controllers.
*   **Database Context:** `AppDbContext` manages the connection to the database and the mapping of models to tables.
*   **Models:** The `Post`, `Comment`, `User`, and `Category` models define the data structure.

## Detailed Feature Specifications

### 1. User System & Authentication
*   **Registration Logic**:
    *   Open to public registration.
    *   **Role Assignment**: The **first registered user** is automatically assigned the **"Admin"** role. All subsequent users are assigned the **"User"** role.
    *   **Security**: Passwords are hashed using `BCrypt.Net-Next` before storage.
*   **Login/Logout**: 
    *   Uses Cookie-based authentication (`MyCookieAuth` scheme).
    *   Supports `returnUrl` to redirect users back to their previous page after login.

### 2. Blog Post Management (Admin Only)
*   **CRUD Operations**: Admin users can Create, Read, Update, and Delete blog posts.
*   **Writing Experience**:
    *   **Markdown Editor**: Post content is written in Markdown and rendered using `Markdig` (with Advanced Extensions).
    *   **Paste-to-Upload**: The editor supports pasting image data directly from the clipboard. The system intercepts the paste event, uploads the image to `wwwroot/uploads` via an API, and inserts the corresponding Markdown image syntax (`![](/uploads/...)`) at the cursor position.
*   **Organization**: Posts can be categorized. Categories are managed via the database seeded or created (currently read-only in UI based on `PostService` methods seen).

### 3. Public Interactions
*   **Viewing Posts**: 
    *   The Index page displays a list of posts, sorted by creation time (newest first).
    *   Detail pages show the full rendered Markdown content.
*   **Comments**: 
    *   The system supports a commenting feature on post detail pages.
    *   Guest commenting is allowed; if no name is provided, it defaults to "匿名访客" (Anonymous Visitor).

### 4. Technical Architecture Details
*   **Service Layer**: Business logic is encapsulated in `PostService` (Scoped lifetime), which handles all interactions with `AppDbContext`.
*   **API Endpoints**: `UploadController` provides a RESTful API endpoint (`POST /api/upload`) specifically for handling async image uploads from the frontend.
*   **Frontend Logic**: `site.js` contains the custom logic for handling the clipboard paste events and performing the Fetch API calls for image uploading.
*   **Next.js Frontend (Client)**:
    *   Located in `/client` directory.
    *   Tech Stack: Next.js 15 (App Router), Tailwind CSS v4, shadcn/ui.
    *   **Proxy Configuration**: Uses `next.config.ts` rewrites (`/api/backend/*` -> `http://localhost:5095/api/*`) to solve localhost connectivity issues for external devices (mobile/Safari).
    *   **SSR/ISR**: Uses Server Components for data fetching.

## Building and Running the Project

To build and run this project, you will need the .NET 10 SDK installed.

1.  **Restore Dependencies:**
    ```bash
    dotnet restore
    ```

2.  **Apply Migrations:**
    This project uses Entity Framework Core migrations to manage the database schema. To create or update the database, run the following command:
    ```bash
    dotnet ef database update
    ```

3.  **Run the Application:**
    ```bash
    dotnet run
    ```
    The application will be available at `https://localhost:5001` or `http://localhost:5000` by default.

## Development Conventions

*   **Routing:** The application uses the default MVC routing convention: `{controller=Home}/{action=Index}/{id?}`.
*   **Authentication:** Access to certain actions may require authentication. The application is configured to redirect unauthenticated users to the `/Account/Login` page.
*   **Styling:** The project uses Bootstrap for styling. Custom styles can be added to `wwwroot/css/site.css`.
*   **Database:** The application is configured to use a SQLite database named `blog.db` in the project root. The connection string can be modified in `appsettings.json`.
