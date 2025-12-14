# 评论系统后续改进计划 (Phase P1 & P2)

我们已经完成了最紧急的安全修复 (P0)。接下来的重点是提升互动性和管理能力。

## P1: 核心体验提升 (Core Experience)
**目标**：让评论区“活”起来，支持盖楼回复，并解决长列表加载问题。

### 1. 后端改造 (Backend)
*   **数据库模型更新**:
    *   修改 `Comment` 模型，添加 `int? ParentId` 字段（指向父评论 ID）。
    *   执行数据库迁移 (`AddCommentParentId`)。
*   **DTO & API 更新**:
    *   更新 `CommentDto`，增加 `ParentId` 和 `Children` (嵌套结构) 或保持扁平结构让前端组装。通常推荐返回**扁平列表**，由前端处理树状结构，这样分页更容易处理。
    *   修改 `GetComments` 接口，支持按 `ParentId` 筛选或一次性拉取。
    *   修改 `CreateComment` 接口，支持接收 `ParentId` 参数。

### 2. 前端改造 (Frontend)
*   **分页逻辑优化**:
    *   废弃 `pageSize=100` 的硬编码。
    *   实现“加载更多”按钮：点击后请求下一页数据 (`page=2`)，并将新数据追加到当前列表末尾。
*   **UI 组件重构**:
    *   **支持嵌套显示**: 创建 `CommentItem` 组件，根据 `ParentId` 缩进显示子评论，或者使用两层结构（一级评论 + 子评论区）。
    *   **回复交互**: 在每条评论下添加“回复”按钮。点击后，输入框上方显示“回复 @某某”，提交时带上 `ParentId`。

---

## P2: 管理与审核 (Management)
**目标**：赋予管理员控制权，防止垃圾内容泛滥。

### 1. 后端改造 (Backend)
*   **审核状态**:
    *   `Comment` 模型添加 `bool IsApproved` 字段（默认为 `true`，开启审核模式后默认为 `false`）。
    *   普通 `GetComments` 接口只返回 `IsApproved=true` 的评论。
*   **管理接口**:
    *   `GET /api/comments/admin`: 获取所有评论（含未审核）。
    *   `PATCH /api/comments/{id}/approve`: 审核通过。
    *   `DELETE /api/comments/{id}`: 删除违规评论。

### 2. 前端改造 (Frontend)
*   **管理后台**:
    *   在 Admin Dashboard 增加“评论管理”页面。
    *   列表显示：待审核评论高亮显示。
    *   操作列：通过、删除按钮。

---

## 预估工作量
*   **P1 后端**: 约 1 小时 (模型修改、迁移、逻辑更新)
*   **P1 前端**: 约 2-3 小时 (UI重构较复杂，特别是递归渲染和交互细节)
*   **P2 全栈**: 约 2 小时 (相对标准的 CRUD)
