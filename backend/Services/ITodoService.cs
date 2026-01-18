// Services/ITodoService.cs
// 待办任务服务接口

using MyNextBlog.DTOs;

namespace MyNextBlog.Services;

/// <summary>
/// 待办任务服务接口
/// </summary>
public interface ITodoService
{
    /// <summary>
    /// 获取所有待办任务
    /// </summary>
    Task<List<TodoTaskDto>> GetAllAsync();
    
    /// <summary>
    /// 获取单个任务
    /// </summary>
    Task<TodoTaskDto?> GetByIdAsync(int id);
    
    /// <summary>
    /// 创建任务
    /// </summary>
    Task<TodoTaskDto> CreateAsync(CreateTodoDto dto);
    
    /// <summary>
    /// 更新任务
    /// </summary>
    Task<TodoTaskDto?> UpdateAsync(int id, UpdateTodoDto dto);
    
    /// <summary>
    /// 删除任务
    /// </summary>
    Task<bool> DeleteAsync(int id);
    
    /// <summary>
    /// 移动任务到新阶段（拖拽跨列）
    /// </summary>
    Task<bool> MoveAsync(int id, MoveTodoDto dto);
    
    /// <summary>
    /// 批量更新排序（拖拽重排）
    /// </summary>
    Task<bool> BatchUpdateSortAsync(BatchUpdateTodoSortDto dto);
}
