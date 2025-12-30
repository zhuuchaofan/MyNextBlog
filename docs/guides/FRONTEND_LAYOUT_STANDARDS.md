# 前端页面布局一致性规范

> 本规范定义了 MyNextBlog 前端项目的页面布局标准，确保所有页面在不同设备上保持一致的视觉体验。

**最后更新**: 2025-12-30

---

## 1. 容器 (Container) 规范

### 1.1 Admin 页面

```tsx
// 标准 Admin 页面容器
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-{size}">
```

| 页面类型      | max-w 值    | 示例                      |
| ------------- | ----------- | ------------------------- |
| 仪表盘/列表页 | `max-w-6xl` | Dashboard, Posts 列表     |
| 设置页/编辑页 | `max-w-4xl` | Settings, Email Templates |
| 表单页        | `max-w-5xl` | 新建文章                  |
| 简单表单      | `max-w-2xl` | 新建计划                  |

### 1.2 Public 页面

```tsx
// 标准 Public 页面容器
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-{size}">
```

| 页面类型    | max-w 值    | 示例              |
| ----------- | ----------- | ----------------- |
| 首页/主列表 | `max-w-6xl` | 首页              |
| 文章详情    | `max-w-7xl` | 文章页 (含侧边栏) |
| 内容列表    | `max-w-5xl` | 归档、搜索        |
| 单列内容    | `max-w-4xl` | 系列文章、关于    |

---

## 2. 响应式 Padding 规范

### 2.1 断点说明

| 断点     | 宽度     | 设备   | 使用的是     |
| -------- | -------- | ------ | ------------ |
| (无前缀) | < 640px  | iPhone | **基础样式** |
| `sm:`    | ≥ 640px  | 平板   | 增强样式     |
| `md:`    | ≥ 768px  | iPad   | 多列布局     |
| `lg:`    | ≥ 1024px | 笔记本 | 完整布局     |

### 2.2 Padding 层级

```tsx
// 水平 Padding (必须使用)
className = "px-4 sm:px-6 lg:px-8";
// 16px → 24px → 32px

// 垂直 Padding (Admin 页面)
className = "py-6 sm:py-8";
// 24px → 32px

// 垂直 Padding (Public 页面)
className = "py-8 sm:py-12";
// 32px → 48px
```

---

## 3. 间距 (Gap) 规范

### 3.1 Flex 布局

```tsx
// 紧凑间距 (Header 内元素)
className = "gap-1 sm:gap-2"; // 4px → 8px

// 标准间距 (表单元素)
className = "gap-2 sm:gap-3"; // 8px → 12px

// 宽松间距 (Section)
className = "gap-4 sm:gap-6"; // 16px → 24px
```

### 3.2 Grid 布局

```tsx
// 卡片网格
className = "gap-3 sm:gap-4"; // 12px → 16px

// 表单网格
className = "gap-2 sm:gap-3"; // 8px → 12px
```

---

## 4. 网格列数规范

### 4.1 默认模式 (推荐)

```tsx
// 移动端单列，平板及以上双列
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
```

### 4.2 保持移动端双列 (慎用)

```tsx
// 仅当内容极简时使用
<div className="grid grid-cols-2 gap-2 sm:gap-3">
  <div className="min-w-0"><!-- 必须添加 min-w-0 --></div>
  <div className="min-w-0"><!-- 必须添加 min-w-0 --></div>
</div>
```

---

## 5. 标题与文本约束

### 5.1 页面标题

```tsx
// Header 内的页面标题
<h1 className="text-xl sm:text-2xl font-bold">标题</h1>

// 区块标题
<h2 className="text-lg sm:text-xl font-semibold">标题</h2>
```

### 5.2 可能超长的标题

```tsx
// 使用 truncate + max-w 约束
<h1 className="truncate max-w-[140px] sm:max-w-[280px] lg:max-w-md">
  很长的标题...
</h1>
```

---

## 6. 按钮规范

### 6.1 返回按钮

```tsx
// 移动端仅图标，桌面端图标+文字
<Button
  variant="ghost"
  size="icon"
  onClick={() => router.back()}
  className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
>
  <ChevronLeft className="w-4 h-4" />
  <span className="sr-only">返回</span>
</Button>
```

### 6.2 操作按钮

```tsx
// 移动端全宽，桌面端自适应
<Button className="w-full sm:w-auto">
  <Plus className="w-4 h-4 mr-2" />
  新建
</Button>
```

---

## 7. 下拉菜单约束

```tsx
// 自适应宽度 + 上下限约束
<SelectTrigger className="w-auto min-w-[4rem] max-w-[5.5rem] sm:w-28 sm:max-w-none">
```

---

## 8. Header 布局模板

```tsx
// Admin 页面 Header 标准模板
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
  <div className="flex items-center gap-2 sm:gap-4">
    {/* 返回按钮 */}
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
    >
      <ChevronLeft className="w-4 h-4" />
    </Button>
    <div>
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        页面标题
      </h1>
      <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
        页面描述
      </p>
    </div>
  </div>
  <Button className="w-full sm:w-auto">操作按钮</Button>
</div>
```

---

## 9. 骨架屏规范

```tsx
// 加载状态容器保持与主内容一致
if (isLoading) {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="animate-pulse space-y-4 sm:space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
          <div className="h-48 bg-gray-200 dark:bg-zinc-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
```

---

## 10. 快速检查清单

创建新页面时，检查以下项：

- [ ] 容器使用 `px-4 sm:px-6 lg:px-8`
- [ ] 垂直 padding 使用响应式 (`py-6 sm:py-8` 或 `py-8 sm:py-12`)
- [ ] 返回按钮使用 `size="icon"` 模式
- [ ] 网格使用 `grid-cols-1 sm:grid-cols-2`
- [ ] 标题使用响应式字号 (`text-xl sm:text-2xl`)
- [ ] 间距使用响应式 (`gap-2 sm:gap-3`)
- [ ] 骨架屏容器样式与主内容一致
