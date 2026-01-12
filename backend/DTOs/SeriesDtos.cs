// ============================================================================
// DTOs/SeriesDtos.cs - 文章系列相关数据传输对象
// ============================================================================
// 此文件定义了文章系列模块的 DTO，用于组织相关文章。
//
// **DTO 用途**:
//   - `SeriesDto`: 系列信息响应 (含文章数)
//   - `CreateSeriesDto` / `UpdateSeriesDto`: 系列 CRUD 请求

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 系列信息响应 DTO
/// </summary>
/// <param name="Id">系列 ID</param>
/// <param name="Name">系列名称</param>
/// <param name="Description">系列描述</param>
/// <param name="PostCount">公开文章数</param>
/// <param name="HiddenPostCount">隐藏文章数</param>
public record SeriesDto(
    int Id,
    string Name,
    string? Description,
    int PostCount,
    int HiddenPostCount = 0
);

public record CreateSeriesDto(
    [Required(ErrorMessage = "系列名称不能为空")]
    [StringLength(30, ErrorMessage = "系列名称不能超过30个字符")]
    string Name,
    
    [StringLength(100, ErrorMessage = "描述不能超过100个字符")]
    string? Description
);

public record UpdateSeriesDto(
    [Required(ErrorMessage = "系列名称不能为空")]
    [StringLength(30, ErrorMessage = "系列名称不能超过30个字符")]
    string Name,
    
    [StringLength(100, ErrorMessage = "描述不能超过100个字符")]
    string? Description
);
