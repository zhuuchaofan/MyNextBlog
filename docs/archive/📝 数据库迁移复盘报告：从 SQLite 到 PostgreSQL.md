# 📝 数据库迁移复盘报告：从 SQLite 到 PostgreSQL

文档日期: 2025-12-23

当前状态: ⏸️ 已暂停 (代码回滚至 SQLite，PostgreSQL 容器保留)

执行人: MyNextBlog Dev Team

## 1. 🎯 迁移目标

将 MyNextBlog 项目的底层存储从轻量级 SQLite 迁移至企业级 PostgreSQL，旨在解决以下痛点：

- 提升高并发下的写入性能。
- 利用 PostgreSQL 强大的 JSONB 和全文检索功能。
- 为未来容器化和集群部署做准备。

------

## 2. ✅ 已完成工作 (Milestones)

### 2.1 项目审计 (Pre-Migration Audit)

在开始迁移前，对现有代码和数据库结构进行了全面审计：

| **审计维度**   | **结果**     | **说明**                                                     |
| -------------- | ------------ | ------------------------------------------------------------ |
| **数据类型**   | ✅ 无风险     | 全部使用标准通用类型，无生僻类型                             |
| **硬编码 SQL** | ⚠️ **1处**    | `DatabaseBackupService.cs` 中使用了 SQLite 专属的 `VACUUM INTO` |
| **主键策略**   | ✅ 无风险     | EF Core 自动处理自增主键                                     |
| **时间处理**   | ⚠️ **需调整** | PostgreSQL 对时间精度要求严格，需开启 `Npgsql.EnableLegacyTimestampBehavior` |
| **字符串搜索** | ⚠️ **需调整** | PG 的 `LIKE` 默认区分大小写，需注意 `ILIKE` 或转换逻辑       |

### 2.2 基础设施搭建

成功部署了 PostgreSQL Docker 容器，且与宿主机环境隔离良好。

- **容器名**: `mynextblog-db`
- **端口映射**: `5433:5432` (宿主机 5433 -> 容器 5432)
- **状态**: Healthy (Up)
- **持久化**: Volume `mytechblog_pg_data` 已挂载

### 2.3 Schema 迁移 (结构同步)

EF Core 成功在 PostgreSQL 中创建了完整的数据库结构（11 张表）：

- `Categories`, `Tags`, `Series`, `Users`, `UserProfiles`
- `Posts`, `Comments`, `ImageAssets`, `PostLikes`, `PostTag`
- `__EFMigrationsHistory`

------

## 3. ❌ 遇到的阻碍 (Roadblocks)

在数据迁移（Data Migration）阶段遇到严重阻碍，导致部分核心数据未能导入。

### 3.1 失败现象

- **Posts (文章表)**: 0/28 条成功 (❌ 失败)
- **Comments (评论表)**: 0/6 条成功 (❌ 失败)
- **ImageAssets**: 0/34 条成功 (❌ 失败)
- **关联表**: 因主表缺失，外键约束导致关联表插入失败。

### 3.2 根因分析

1. **布尔值类型不兼容**: SQLite 使用 `0/1` 存储布尔值，而 PostgreSQL 强校验 `true/false`。
2. **CSV 导入缺陷**: 简单的 CSV 导出/导入无法处理列顺序不一致和特殊字符转义。
3. **列定义差异**: SQLite 遗留了 `GitHubId` 列，而新生成的 PG Schema 中已移除该列，导致字段对不齐。
4. **标识符大小写**: PostgreSQL 对未引用的表名/列名默认转小写，导致 SQL 语句报错（需使用双引号 `"Posts"`）。

------

## 4. 📁 当前系统状态 (Snapshot)

### 4.1 数据库层 (Hybrid)

- **SQLite (生产中)**: 代码已回滚，继续使用 `./data/blog.db`，业务未受影响。
- **PostgreSQL (待命)**: 容器 `mynextblog-db` 保持运行，端口 `5433` 开放，部分基础表（Tags, Categories）已有数据。

### 4.2 代码层

- 所有涉及 `Npgsql` 的改动（`.csproj`, `Program.cs`, `docker-compose.yml`）已暂时撤销。
- `Migrations` 文件夹已清空/重置，等待下一次生成。

------

## 5. 🔧 下一步行动计划 (Action Plan)

### 5.1 阶段一：环境准备

1. **恢复代码变更**:
   - 修改 `docker-compose.yml` 添加 `db` 服务。
   - 替换 Nuget 包为 `Npgsql.EntityFrameworkCore.PostgreSQL`.
   - 修改 `Program.cs` 启用 `UseNpgsql` 和 `LegacyTimestampBehavior`.
2. **重构备份服务**:
   - 废弃 `VACUUM INTO`，改写 `DatabaseBackupService.cs` 适配 `pg_dump`。

### 5.2 阶段二：数据迁移 (推荐方案)

方案 A：使用 pgloader (推荐，自动化程度高)

适合在 WSL 或 Linux 环境下执行，能自动处理 Schema 差异和类型转换。

Bash

```
# 安装
apt-get install pgloader

# 执行迁移 (一行命令)
pgloader sqlite:///path/to/blog.db postgresql://blog_admin:MySecureBlogDB2024!@localhost:5433/my_blog
```

方案 B：Python ETL 脚本 (高可控性)

使用 Pandas 进行清洗，解决布尔值转换问题。

Python

```
import pandas as pd
import sqlite3
from sqlalchemy import create_engine

# 1. 提取
sqlite_conn = sqlite3.connect('./data/blog.db')
df = pd.read_sql('SELECT * FROM Posts', sqlite_conn)

# 2. 转换 (清洗核心逻辑)
df['IsHidden'] = df['IsHidden'].astype(bool) # 解决 0/1 -> true/false
# df.drop(columns=['GitHubId'], inplace=True) # 解决多余列问题

# 3. 加载
pg_engine = create_engine('postgresql://blog_admin:MySecureBlogDB2024!@localhost:5433/my_blog')
df.to_sql('Posts', pg_engine, if_exists='append', index=False)
```

### 5.3 阶段三：收尾工作 (必须执行)

迁移后必须重置自增序列，否则新插入数据会报错 `duplicate key value violates unique constraint`。

SQL

```
-- 针对所有自增表执行
SELECT setval(pg_get_serial_sequence('"Posts"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Posts";
SELECT setval(pg_get_serial_sequence('"Users"', 'Id'), coalesce(max("Id"),0) + 1, false) FROM "Users";
```

------

## 6. 🔑 配置备忘录 (Secrets)

| **服务**       | **主机**    | **端口** | **数据库** | **用户名**   | **密码**              |
| -------------- | ----------- | -------- | ---------- | ------------ | --------------------- |
| **PostgreSQL** | `localhost` | `5433`   | `my_blog`  | `blog_admin` | `MySecureBlogDB2024!` |
| **SQLite**     | 本地文件    | -        | -          | -            | `./data/blog.db`      |

------

### 💡 专家视角的补充思考

为了帮您在这一步走得更稳，我补充了三个维度的思考：

**1. 企业级实战 (Production Ready)**

- **停机窗口 (Downtime Window)**: 在真实企业中，这种数据结构异构的迁移通常需要“停机维护”。不要试图在用户还在写入 SQLite 时进行迁移。
- **双写策略 (Double Write)**: 如果数据量极大（TB级），通常会采用“双写”策略：新代码同时写入 SQLite 和 PG，后台慢慢导历史数据，校验一致后再切读。
- **验证脚本**: 迁移完成后，不要只看行数。写一个脚本比对核心业务指标（如：文章总阅读数、用户总积分）在两个库是否一致。

**2. 关联生态 (Ecosystem)**

- **pgloader**: 这是本场景下的“黄金搭档”。它就是专门为了把 MySQL/SQLite 迁移到 PG 而生的，能够自动处理大部分类型映射问题，甚至能直接读取 SQLite 文件生成 PG schema。
- **Navicat / DBeaver**: 如果不想写代码，这些收费/高级版的 GUI 工具通常带有“数据传输”功能，支持异构数据库的向导式迁移。

**3. 避坑与演进 (Pitfalls)**

- **时间与时区**: SQLite 存时间通常是字符串，没有任何时区概念。PostgreSQL 的 `timestamptz` 对时区非常敏感。迁移后，请务必检查一下存进去的时间是 UTC 还是 Local Time，否则前端显示会乱。
- **序列（Sequence）炸弹**: 这是新手最容易遗漏的。数据导进去了，看着没问题，结果用户一发新文章就报错 500。一定要执行上面的 `setval` 语句！

