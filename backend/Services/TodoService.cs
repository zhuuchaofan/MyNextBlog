// Services/TodoService.cs
// 待办任务服务实现

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
    // 有效阶段列表
    private static readonly string[] ValidStages = ["todo", "in_progress", "done"];
    private static readonly string[] ValidPriorities = ["low", "medium", "high"];

    /// <inheritdoc />
    public async Task<List<TodoTaskDto>> GetAllAsync()
    {
        return await context.TodoTasks
            .AsNoTracking()
            .OrderBy(t => t.Stage)
            .ThenBy(t => t.SortOrder)
            .Select(t => MapToDto(t))
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<TodoTaskDto?> GetByIdAsync(int id)
    {
        var task = await context.TodoTasks
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
        
        return task is null ? null : MapToDto(task);
    }

    /// <inheritdoc />
    public async Task<TodoTaskDto> CreateAsync(CreateTodoDto dto)
    {
        // 验证日期
        ValidateDates(dto.StartDate, dto.DueDate);
        
        // 计算新任务的排序顺序（放在该阶段最后）
        var maxOrder = await context.TodoTasks
            .Where(t => t.Stage == dto.Stage)
            .MaxAsync(t => (int?)t.SortOrder) ?? -1;
        
        var task = new TodoTask
        {
            Title = dto.Title,
            Description = dto.Description,
            Stage = ValidStages.Contains(dto.Stage) ? dto.Stage : "todo",
            Priority = ValidPriorities.Contains(dto.Priority) ? dto.Priority : "medium",
            SortOrder = maxOrder + 1,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            ReminderEnabled = dto.ReminderEnabled,
            ReminderTime = dto.ReminderTime,
            ReminderSent = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        
        context.TodoTasks.Add(task);
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已创建: {Id} - {Title}", task.Id, task.Title);
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
        if (dto.Stage is not null && ValidStages.Contains(dto.Stage)) task.Stage = dto.Stage;
        if (dto.Priority is not null && ValidPriorities.Contains(dto.Priority)) task.Priority = dto.Priority;
        if (dto.StartDate is not null) task.StartDate = dto.StartDate;
        if (dto.DueDate is not null) task.DueDate = dto.DueDate;
        
        if (dto.ReminderEnabled is not null)
        {
            task.ReminderEnabled = dto.ReminderEnabled.Value;
            // 如果重新开启提醒，重置发送状态
            if (dto.ReminderEnabled.Value) task.ReminderSent = false;
        }
        if (dto.ReminderTime is not null) task.ReminderTime = dto.ReminderTime;
        
        task.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已更新: {Id} - {Title}", task.Id, task.Title);
        return MapToDto(task);
    }

    /// <inheritdoc />
    public async Task<bool> DeleteAsync(int id)
    {
        var task = await context.TodoTasks.FindAsync(id);
        if (task is null) return false;
        
        context.TodoTasks.Remove(task);
        await context.SaveChangesAsync();
        
        logger.LogInformation("待办任务已删除: {Id} - {Title}", task.Id, task.Title);
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
    /// 映射实体到 DTO
    /// </summary>
    private static TodoTaskDto MapToDto(TodoTask task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.Stage,
        task.Priority,
        task.SortOrder,
        task.StartDate,
        task.DueDate,
        task.ReminderEnabled,
        task.ReminderTime,
        task.ReminderSent,
        task.CreatedAt,
        task.UpdatedAt
    );
}
