# 🐛 问题集锦 - MyNextBlog 项目

> 本文档记录项目开发过程中遇到的重要问题、根因分析和解决方案，供未来参考。

---

## 问题 #1：React Hydration 错误导致页面崩溃

### 📅 发现时间

2025-12-28

### 🔍 问题描述

**现象**：

- 访问 `/admin/settings/content`（内容配置页面）后点击刷新按钮
- 或点击导航栏链接（首页、归档、猫咪相册、关于铲屎官）
- 页面显示：`Application error: a client-side exception has occurred`

**控制台错误**：

```
Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node':
The node to be removed is not a child of this node.
    at react-dom-client.production.js:10132
```

### 🎯 根因分析

**罪魁祸首**：`TwemojiProvider` 组件

**问题机制**：

1. `TwemojiProvider` 使用 `twemoji.parse(document.body)` **直接修改 DOM**
2. 它将所有 emoji 字符（如 🏡、📚）替换为 `<img>` 标签

```html
<!-- 替换前 (React 期望的 DOM) -->
<span>🏡</span>

<!-- 替换后 (实际 DOM) -->
<span><img class="twemoji" src="..." alt="🏡" /></span>
```

3. React 的虚拟 DOM 与实际 DOM 不再匹配
4. 当用户导航或页面刷新时，React 尝试卸载组件
5. React 调用 `removeChild()` 时，发现节点已被 Twemoji 修改
6. 💥 **崩溃！**

**额外的问题**：`MutationObserver` 监听 DOM 变化并持续调用 `twemoji.parse()`，加剧了问题的严重性。

### 💡 解决方案

**采用保守策略**：

```typescript
// frontend/components/TwemojiProvider.tsx

"use client";

import { useEffect, useRef } from "react";
import twemoji from "@twemoji/api";

export default function TwemojiProvider() {
  const hasParsed = useRef(false);

  useEffect(() => {
    // 确保只执行一次
    if (hasParsed.current) return;
    hasParsed.current = true;

    // 使用 requestAnimationFrame 延迟到下一帧执行
    // 确保 React 的 hydration 已经完成
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        twemoji.parse(document.body, {
          folder: "svg",
          ext: ".svg",
          className: "twemoji",
        });
      });
    });
  }, []);

  return null;
}
```

**关键改进**：

| 旧版本                           | 新版本                                |
| :------------------------------- | :------------------------------------ |
| 立即执行 `twemoji.parse()`       | 使用双重 `requestAnimationFrame` 延迟 |
| 使用 `MutationObserver` 持续监听 | **移除** MutationObserver             |
| 每次 DOM 变化都重新解析          | 只在首次挂载时解析一次                |

**限制**：

- 动态加载的内容（如"加载更多"按钮加载的新文章）中的 emoji 不会自动转换
- 如需转换，可在特定组件中手动调用 `twemoji.parse(element)`

### 📚 经验教训

1. **不要在 React 应用中直接修改 DOM**：React 依赖虚拟 DOM 与实际 DOM 的一致性
2. **MutationObserver + DOM 修改 = 灾难**：会导致无限循环或 hydration 错误
3. **使用 `requestAnimationFrame` 延迟 DOM 操作**：确保在 React 渲染周期之外执行
4. **第三方库的整合需要谨慎**：特别是那些直接操作 DOM 的库

---

## 问题 #2：归档页面文章计数不准确

### 📅 发现时间

2025-12-28

### 🔍 问题描述

**现象**：

- 归档页面显示 "共收录 **10** 篇技术与生活随笔"
- 但实际公开文章有 **11** 篇
- 首页的 "文章总数 11" 显示正确
- 管理后台的 "已发布 11 篇" 显示正确

### 🎯 根因分析

**问题位置**：`PostService.GetAllPostsAsync()` 的缓存逻辑

**缓存 Key 设计缺陷**：

```csharp
// 旧代码 (错误)
string cacheKey = $"{AllPostsCacheKey}_{includeHidden}";
// 结果: "all_posts_public_False"
```

**问题**：缓存 key 不包含 `pageSize`！

**发生的情况**：

```
1. 首页请求:  GET /api/posts?page=1&pageSize=10
   → 缓存 key: "all_posts_public_False"
   → 缓存内容: 10 篇文章

2. 归档请求: GET /api/posts?page=1&pageSize=100
   → 缓存 key: "all_posts_public_False" (相同!)
   → 命中缓存，返回: 10 篇文章 ← 错误!
```

### 💡 解决方案

**1. 修复缓存 key，包含 `pageSize`**：

```csharp
// backend/Services/PostService.cs

// 🔧 修复：缓存 key 必须包含 pageSize
string cacheKey = $"{AllPostsCacheKey}_{includeHidden}_{pageSize}";
// 结果: "all_posts_public_False_10" 或 "all_posts_public_False_100"
```

**2. 更新缓存清除逻辑**：

```csharp
// 常用的 pageSize 值（用于缓存清除）
private static readonly int[] CommonPageSizes = [10, 20, 50, 100];

/// <summary>
/// 清除所有文章列表相关的缓存
/// </summary>
private void InvalidatePostListCache()
{
    foreach (var pageSize in CommonPageSizes)
    {
        cache.Remove($"{AllPostsCacheKey}_False_{pageSize}");
        cache.Remove($"{AllPostsCacheKey}_True_{pageSize}");
    }
}
```

**3. 替换所有旧的缓存清除调用**：

```csharp
// 旧代码
cache.Remove($"{AllPostsCacheKey}_False");
cache.Remove($"{AllPostsCacheKey}_True");

// 新代码
InvalidatePostListCache();
```

### 📚 经验教训

1. **缓存 key 必须包含所有影响结果的参数**：`pageSize`、`page`、`includeHidden` 等
2. **缓存策略需要仔细设计**：考虑所有可能的请求组合
3. **预定义常用值可以简化缓存管理**：`CommonPageSizes = [10, 20, 50, 100]`
4. **抽取辅助方法减少重复代码**：`InvalidatePostListCache()`

---

## 问题 #3：API 代理配置导致 404 错误 (历史问题)

### 📅 发现时间

2025-12-27 (已修复)

### 🔍 问题描述

这是导致问题 #1 最初被怀疑的原因，但后来确认是独立问题。

**现象**：

- 某些页面在客户端请求后端 API 时返回 404
- 前端尝试解析 404 HTML 页面为 JSON，导致崩溃

### 🎯 根因分析

**Next.js 的 rewrite 规则不完整**：

```typescript
// 旧配置 (不完整)
async rewrites() {
  return [
    {
      source: '/api/backend/:path*',
      destination: 'http://backend:8080/api/:path*',
    },
  ];
}
```

**问题**：只有 `/api/backend/*` 的请求会被代理，但某些 Server-Side 代码直接使用 `/api/posts` 等路径。

### 💡 解决方案

**添加通用 API 代理规则**：

```typescript
// frontend/next.config.ts

async rewrites() {
  return [
    {
      source: '/api/backend/:path*',
      destination: `${process.env.BACKEND_URL || 'http://backend:8080'}/api/:path*`,
    },
    // 🔧 通用 API 代理规则
    // 将所有 /api/* 请求转发到后端，但排除 Next.js 自己的 Route Handlers
    {
      source: '/api/:path((?!auth|admin|backend).*)*',
      destination: `${process.env.BACKEND_URL || 'http://backend:8080'}/api/:path*`,
    },
  ];
}
```

**排除的路径**：

- `/api/auth/*` - Next.js 认证路由
- `/api/admin/*` - Next.js 管理路由
- `/api/backend/*` - 已在上面处理

---

## 🔧 涉及的文件修改清单

| 文件                                      | 修改类型    | 说明                                                   |
| :---------------------------------------- | :---------- | :----------------------------------------------------- |
| `frontend/components/TwemojiProvider.tsx` | 重构        | 移除 MutationObserver，只执行一次解析                  |
| `backend/Services/PostService.cs`         | 修复        | 缓存 key 增加 pageSize，添加 InvalidatePostListCache() |
| `frontend/next.config.ts`                 | 修复 (历史) | 添加通用 API 代理规则                                  |

---

## 📋 测试检查清单

### Twemoji 修复验证

- [ ] 访问 `/admin/settings/content`
- [ ] 点击刷新按钮 → 页面正常加载
- [ ] 点击导航栏链接 → 正常跳转
- [ ] Emoji 正常显示为 Twemoji 样式

### 归档计数修复验证

- [ ] 访问 `/archive`
- [ ] 确认显示的文章数量与实际公开文章数一致
- [ ] 发布新文章后，归档页面数量正确更新

---

_最后更新：2025-12-28_
