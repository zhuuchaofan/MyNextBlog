# === 基础镜像 ===
FROM public.ecr.aws/docker/library/node:20-alpine AS base

# === 依赖安装阶段 ===
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制 package.json (上下文已是 client 目录)
COPY package.json package-lock.json* ./
RUN npm ci

# === 构建阶段 ===
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# 构建镜像时后端服务尚未运行；使用本地地址让 Server Component 数据预取快速降级。
# 运行阶段会由 docker-compose 注入真实的 BACKEND_URL=http://backend:8080。
ENV BACKEND_URL=http://127.0.0.1:8080
RUN npm run build

# === 运行阶段 ===
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
