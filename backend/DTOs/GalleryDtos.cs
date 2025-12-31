// ============================================================================
// DTOs/GalleryDtos.cs - 图库相关数据传输对象
// ============================================================================
// 此文件定义了图库模块的 DTO，用于瀑布流图片展示。
//
// **DTO 用途**:
//   - `GalleryImageDto`: 单张图片信息 (含宽高用于瀑布流布局)
//   - `GalleryResponseDto`: 分页响应包装

// `namespace` 声明了当前文件中的代码所属的命名空间
namespace MyNextBlog.DTOs;

/// <summary>
/// 图库单张图片 DTO
/// </summary>
public record GalleryImageDto(
    int Id,
    string Src,
    string Alt,
    int Width,
    int Height
);

public record GalleryResponseDto(
    bool Success,
    List<GalleryImageDto> Data,
    object Meta
);
