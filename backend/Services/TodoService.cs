// Services/TodoService.cs
// 待办任务服务实现 - 支持 Epic → Story → Task 三层结构

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MyNextBlog.Data;
using MyNextBlog.DTOs;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务服务
/// </summary>
public class TodoService(
    AppDbContext context,
    ILogger<TodoService> logger) : ITodoService
{
    // 有效值列表
    private static readonly string[] ValidStages = ["todo", "in_progress", "done"];
    private static readonly string[] ValidPriorities = ["low", "medium", "high"];
    private static readonly string[] ValidTaskTypes = ["epic", "story", "task"];

    /// <inheritdoc />
    public async Task<List<TodoTaskDto>> GetAllAsync()
    {
        // 只返回顶级任务（ParentId = null），并嵌套子任务
        var topLevelTasks = await context.TodoTasks
            .AsNoTracking()
            .Where(t => t.ParentId == null)
            .Include(t => t.Children)
                .ThenInclude(c => c.Children)  // 第三层
            .OrderBy(t => t.Stage)
            .ThenBy(t => t.SortOrder)
            .ToListAsync();
        
        return topLevelTasks.Select(MapToDtoWithChildren).ToList();
    }

    /// <inheritdoc />
    public async Task<TodoTaskDto?> GetByIdAsync(int id)
    {
        var task = await context.TodoTasks
            .AsNoTracking()
            .Include(t => t.Children)
                .ThenInclude(c => c.Children)
            .FirstOrDefaultAsync(t => t.Id == id);
        
        return task is null ? null : MapToDtoWithChildren(task);
    }

    /// <inheritdoc />
    public async Task<TodoTaskDto> CreateAsync(CreateTodoDto dto)
    {
        // 验证日期
        ValidateDates(dto.StartDate, dto.DueDate);
        
        // 验证层级深度
        if (dto.ParentId.HasValue)
        {
            var parent = await context.TodoTasks
                .Include(t => t.Parent)
                    .ThenInclude(p => p!.Parent)
                .FirstOrDefaultAsync(t => t.Id == dto.ParentId.Value);
            
            if (parent is null)
                throw new ArgumentException("父任务不存在");
            
            // 计算父任务深度
            var parentDepth = 1;
            if (parent.ParentId.HasValue) parentDepth = 2;
            if (parent.Parent?.ParentId.HasValue == true) parentDepth = 3;
            
            if (parentDepth >= 3)
                throw new ArgumentException("最多支持 3 层任务结构");
        }
        
        // 计算新任务的排序顺序
        var maxOrder = await context.TodoTasks
            .Where(t => t.Stage == dto.Stage && t.ParentId == dto.ParentId)
            .MaxAsync(t => (int?)t.SortOrder) ?? -1;
        
        var task = new TodoTask
        {
            Title = dto.Title,
            Description = dto.Description,
            TaskType = ValidTaskTypes.Contains(dto.TaskType) ? dto.TaskType : "task",
            Stage = ValidStages.Contains(dto.Stage) ? dto.Stage : "todo",
            Priority = ValidPriorities.Contains(dto.Priority) ? dto.Priority : "medium",
            ParentId = dto.ParentId,
            SortOrder = maxOrder + 1,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            ReminderEnabled = dto.ReminderEnabled,
            ReminderDays = dto.ReminderDays,
            SentReminderDays = null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        context.TodoTasks.Add(task);
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已创建: {Id} - {Title} (类型: {Type})", task.Id, task.Title, task.TaskType);
        return MapToDto(task);
    }

    /// <inheritdoc />
    public async Task<TodoTaskDto?> UpdateAsync(int id, UpdateTodoDto dto)
    {
        var task = await context.TodoTasks.FindAsync(id);
        if (task is null) return null;
        
        // 验证日期
        var startDate = dto.StartDate ?? task.StartDate;
        var dueDate = dto.DueDate ?? task.DueDate;
        ValidateDates(startDate, dueDate);
        
        // 更新字段
        if (dto.Title is not null) task.Title = dto.Title;
        if (dto.Description is not null) task.Description = dto.Description;
        if (dto.TaskType is not null && ValidTaskTypes.Contains(dto.TaskType)) task.TaskType = dto.TaskType;
        if (dto.Stage is not null && ValidStages.Contains(dto.Stage)) task.Stage = dto.Stage;
        if (dto.Priority is not null && ValidPriorities.Contains(dto.Priority)) task.Priority = dto.Priority;
        if (dto.StartDate is not null) task.StartDate = dto.StartDate;
        if (dto.DueDate is not null) task.DueDate = dto.DueDate;
        
        if (dto.ReminderEnabled is not null)
        {
            task.ReminderEnabled = dto.ReminderEnabled.Value;
            // 如果重新开启提醒，重置已发送状态
            if (dto.ReminderEnabled.Value) task.SentReminderDays = null;
        }
        if (dto.ReminderDays is not null) task.ReminderDays = dto.ReminderDays;
        
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已更新: {Id} - {Title}", task.Id, task.Title);
        return MapToDto(task);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int id)
    {
        var task = await context.TodoTasks
            .Include(t => t.Children)
                .ThenInclude(c => c.Children)
            .FirstOrDefaultAsync(t => t.Id == id);
        
        if (task is null) return false;
        
        // 级联删除所有子任务
        DeleteTaskRecursive(task);
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已删除 (含子任务): {Id} - {Title}", task.Id, task.Title);
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> MoveAsync(int id, MoveTodoDto dto)
    {
        if (!ValidStages.Contains(dto.NewStage)) return false;
        
        var task = await context.TodoTasks.FindAsync(id);
        if (task is null) return false;
        
        task.Stage = dto.NewStage;
        task.SortOrder = dto.NewSortOrder;
        task.UpdatedAt = DateTime.UtcNow;
        
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已移动: {Id} -> {Stage}", task.Id, dto.NewStage);
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> BatchUpdateSortAsync(BatchUpdateTodoSortDto dto)
    {
        if (dto.Items.Count == 0) return true;
        
        var ids = dto.Items.Select(i => i.Id).ToList();
        var tasks = await context.TodoTasks
            .Where(t => ids.Contains(t.Id))
            .ToListAsync();
        
        foreach (var item in dto.Items)
        {
            var task = tasks.FirstOrDefault(t => t.Id == item.Id);
            if (task is null) continue;
            
            if (ValidStages.Contains(item.Stage))
            {
                task.Stage = item.Stage;
            }
            task.SortOrder = item.SortOrder;
            task.UpdatedAt = DateTime.UtcNow;
        }
        
        await context.SaveChangesAsync();
        
        logger.LogInformation("批量更新任务排序: {Count} 个任务", dto.Items.Count);
        return true;
    }

    // === 私有方法 ===

    /// <summary>
    /// 递归删除任务及其子任务
    /// </summary>
    private void DeleteTaskRecursive(TodoTask task)
    {
        foreach (var child in task.Children.ToList())
        {
            DeleteTaskRecursive(child);
        }
        context.TodoTasks.Remove(task);
    }

    /// <summary>
    /// 验证日期逻辑
    /// </summary>
    private static void ValidateDates(DateTime? startDate, DateTime? dueDate)
    {
        if (startDate.HasValue && dueDate.HasValue && dueDate < startDate)
        {
            throw new ArgumentException("截止日期不能早于开始日期");
        }
    }

    /// <summary>
    /// 映射实体到 DTO (不含子任务)
    /// </summary>
    private static TodoTaskDto MapToDto(TodoTask task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.TaskType,
        task.Stage,
        task.Priority,
        task.SortOrder,
        task.StartDate,
        task.DueDate,
        task.ParentId,
        task.ReminderEnabled,
        task.ReminderDays,
        task.SentReminderDays,
        task.CreatedAt,
        task.UpdatedAt,
        null  // 不含子任务
    );

    /// <summary>
    /// 映射实体到 DTO (含嵌套子任务)
    /// </summary>
    private static TodoTaskDto MapToDtoWithChildren(TodoTask task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.TaskType,
        task.Stage,
        task.Priority,
        task.SortOrder,
        task.StartDate,
        task.DueDate,
        task.ParentId,
        task.ReminderEnabled,
        task.ReminderDays,
        task.SentReminderDays,
        task.CreatedAt,
        task.UpdatedAt,
        task.Children.Count > 0 
            ? task.Children.OrderBy(c => c.SortOrder).Select(MapToDtoWithChildren).ToList() 
            : null
    );
}
