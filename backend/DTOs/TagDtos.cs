// ============================================================================
// DTOs/TagDtos.cs - 标签相关数据传输对象
// ============================================================================
// 此文件定义了文章标签模块的 DTO。

// `using` 语句用于导入必要的命名空间
using System.ComponentModel.DataAnnotations;  // 数据注解，用于输入验证

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 创建标签请求 DTO
/// </summary>
public record CreateTagDto(
    [Required(ErrorMessage = "标签名称不能为空")]
    [StringLength(20, ErrorMessage = "标签名称不能超过20个字符")]
    string Name
);

/// <summary>
/// 更新标签请求 DTO
/// </summary>
public record UpdateTagDto(
    [Required(ErrorMessage = "标签名称不能为空")]
    [StringLength(20, ErrorMessage = "标签名称不能超过20个字符")]
    string Name
);

/// <summary>
/// 标签返回 DTO（用于 Service 层返回，防止 Entity 泄露）
/// </summary>
/// <param name="Id">标签 ID</param>
/// <param name="Name">标签名称</param>
/// <param name="PostCount">公开文章数</param>
/// <param name="HiddenPostCount">隐藏文章数（管理后台使用）</param>
public record TagDto(int Id, string Name, int PostCount = 0, int HiddenPostCount = 0);
