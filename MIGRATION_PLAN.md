# Architecture 2.0 Migration Plan

> 本文档记录了将 MyNextBlog 升级为 PostgreSQL + Redis 架构的详细操作步骤。
> 预计耗时: 30-60 分钟
> 难度: 低 (Low)

## 0. 准备工作

确保本地代码已提交 git，且 Docker 环境正常运行。

## 1. 后端改造 (.NET)

### 1.1 安装 NuGet 包

进入 `backend` 目录，安装 PostgreSQL 和 Redis 的官方驱动包：

```bash
cd backend
# 1. PostgreSQL 驱动
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL

# 2. Redis 缓存驱动
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis
```

### 1.2 修改数据库配置

打开 `backend/Program.cs`，进行如下替换：

**Step A: 替换数据库上下文**

```csharp
// [删除] 旧的 SQLite 配置
// builder.Services.AddDbContext<AppDbContext>(options =>
//     options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// [新增] PostgreSQL 配置
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**Step B: 替换缓存服务**

```csharp
// [删除] 旧的内存缓存
// builder.Services.AddMemoryCache();

// [新增] Redis 分布式缓存
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
    options.InstanceName = "MyBlog_";
});
```

### 1.3 更新连接字符串

修改 `backend/appsettings.json` (注意：这是本地开发配置，Docker 部署时会被环境变量覆盖)：

```json
{
  "ConnectionStrings": {
    // Host=localhost 假设你在 docker compose 外部运行 dotnet run，否则如果都在容器里应用 db
    "DefaultConnection": "Host=localhost;Port=5432;Database=myblog;Username=postgres;Password=your_secure_password"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  }
}
```

### 1.4 生成新的迁移文件

由于 SQLite 和 Postgres 类型系统不同，需要重建 Migrations。

```bash
# 1. 此时请确保删除了 backend/Migrations 目录
rm -rf Migrations

# 2. 生成新的 PostgreSQL 初始迁移
dotnet ef migrations add Initial_Postgres
```

---

## 2. 基础设施编排 (Docker)

修改项目根目录下的 `docker-compose.yml`，添加 Postgres 和 Redis 服务。

```yaml
services:
  backend:
    environment:
      # 指向容器内的服务名 db 和 redis
      - ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=myblog;Username=postgres;Password=your_secure_password
      - Redis__ConnectionString=redis:6379
    depends_on:
      - db
      - redis

  # [新增] PostgreSQL
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: myblog
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # [新增] Redis
  redis:
    image: redis:alpine
    restart: always
    ports:
      - "6379:6379"
```

---

## 3. 数据迁移 (策略)

由于数据库引擎变更，旧的 `blog.db` (SQLite) 文件无法直接使用。有三种策略：

1.  **全新开始 (推荐)**:

    - 启动后，系统会自动创建表结构。
    - `DataSeeder` 会自动创建初始管理员和分类。
    - 适合：如果你不在意旧文章，或者旧文章很少。

2.  **重新录入**:

    - 利用现有的后台 API，手动把旧文章复制粘贴进去。

3.  **使用转换工具 (高级)**:
    - 使用 `pgloader` 工具将 SQLite 数据导入 Postgres。
    - 命令示例：
      ```bash
      pgloader sqlite://./data/blog.db postgresql://postgres:password@localhost/myblog
      ```

---

## 4. 验证

1. 启动服务: `docker compose up -d --build`
2. 检查日志: `docker compose logs -f backend` 确认无数据库连接错误。
3. 检查 Redis: 进入容器使用 `redis-cli monitor` 查看是否有缓存写入。
