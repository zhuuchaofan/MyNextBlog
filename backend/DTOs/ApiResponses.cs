// ============================================================================
// DTOs/ApiResponses.cs - 通用 API 响应类型
// ============================================================================
// 此文件定义了用于 Swagger 文档生成的标准响应包装类型。
//
// **用途**:
//   - 为 [ProducesResponseType] 标注提供类型参数
//   - 让 Swagger UI 显示准确的响应 Schema
//   - 支持 openapi-typescript 生成完整的前端类型
//
// **注意**: 这些类型主要用于文档，现有的匿名类型响应无需重构

namespace MyNextBlog.DTOs;

// ============================================================================
// 通用响应包装器
// ============================================================================

/// <summary>
/// 标准 API 成功响应
/// </summary>
/// <typeparam name="T">数据类型</typeparam>
public record ApiResponse<T>(
    bool Success,
    T? Data,
    string? Message = null
);

/// <summary>
/// 标准 API 错误响应
/// </summary>
public record ApiErrorResponse(
    bool Success,
    string Message
)
{
    /// <summary>
    /// 创建失败响应
    /// </summary>
    public static ApiErrorResponse Fail(string message) => new(false, message);
}

// ============================================================================
// 分页响应
// ============================================================================

/// <summary>
/// 分页响应包装器
/// </summary>
/// <typeparam name="T">列表项类型</typeparam>
public record PagedApiResponse<T>(
    bool Success,
    IEnumerable<T> Data,
    PaginationMeta Meta
);

/// <summary>
/// 分页元数据
/// </summary>
public record PaginationMeta(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    bool HasMore
);

// ============================================================================
// 简单响应类型 (用于 ProducesResponseType)
// ============================================================================

/// <summary>
/// 简单成功响应（无数据）
/// </summary>
public record SuccessResponse(
    bool Success,
    string? Message = null
);

/// <summary>
/// 上传响应
/// </summary>
public record UploadResponse(
    string Url
);

