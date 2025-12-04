# 部署与排错日志 (2025-12-04)

## 🚀 今日成果
1.  **Docker 化改造**: 完成了前后端的 `Dockerfile` 编写和 `docker-compose.yml` 编排。
2.  **生产环境部署**: 成功在 Debian 服务器上部署了 `.NET 10` 后端和 `Next.js 15` 前端。
3.  **功能验证**: 
    *   容器成功启动并运行。
    *   前端页面可正常访问。
    *   解决了数据库挂载权限问题。
    *   解决了 JWT 密钥配置问题。

## 🐛 遇到的问题与解决方案

### 1. Docker 构建找不到文件
*   **现象**: `failed to calculate checksum of ref ... "/package.json": not found`.
*   **原因**: `.gitignore` 配置错误，导致 `client/package.json` 等关键文件没有提交到 Git，服务器拉取代码后 `client` 目录不完整。
*   **解决**: 使用 `git add -f` 强制添加被忽略的文件并提交。

### 2. 后端 500 错误 (SQLite 只读)
*   **现象**: 登录时报 500 错误，日志无详细信息（初步推测）。
*   **原因**: Docker 挂载的 `./data` 目录权限不足，导致 SQLite 无法创建 `.db-wal` 临时文件。
*   **解决**: 在宿主机运行 `chmod -R 777 ./data` 赋予读写权限。

### 3. 后端 500 错误 (JWT Key 缺失)
*   **现象**: 解决权限后依然 500。
*   **原因**: 生产环境未读取 `appsettings.Development.json`，且未在环境变量中配置 `JwtSettings:SecretKey`，导致密钥为空抛出异常。
*   **解决**: 在 `docker-compose.yml` 中显式注入 `JwtSettings__SecretKey` 等环境变量。

### 4. 前端 500 错误 (API 代理失败)
*   **现象**: 点击登录，前端报错 `ECONNREFUSED`，提示 `Failed to proxy http://localhost:5095/...`。
*   **原因**: Next.js 在 Docker 容器内运行时，未能正确读取 `BACKEND_URL` 环境变量，回退到了默认值 `localhost:5095`。而在 Docker 网络中，后端地址应为 `http://backend:8080`。
*   **解决 (待验证)**: 修改 `next.config.ts`，将默认回退地址改为 Docker 内部地址 `http://backend:8080`，并强制重建容器。

## 📅 明日计划 (Next Steps)
1.  **验证代理修复**: 确认修改 `next.config.ts` 后，前端能否正确连接后端。
2.  **HTTPS/Cloudflare**: 确认 Cloudflare Tunnel 配置正确指向本地 3000 端口。
3.  **全流程测试**: 在生产环境完整走一遍“登录 -> 写文章 -> 发布”流程。

---
*记录人: Gemini CLI*
