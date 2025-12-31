// ============================================================================
// DTOs/CategoryDtos.cs - 分类相关数据传输对象
// ============================================================================
// 此文件定义了文章分类模块的 DTO。

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 创建分类请求 DTO
/// </summary>
public record CreateCategoryDto(
    [Required(ErrorMessage = "分类名称不能为空")]
    [StringLength(50, ErrorMessage = "分类名称不能超过50个字符")]
    string Name
);
