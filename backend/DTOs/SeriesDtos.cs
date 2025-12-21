using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record SeriesDto(
    int Id,
    string Name,
    string? Description,
    int PostCount
);

public record CreateSeriesDto(
    [Required(ErrorMessage = "系列名称不能为空")] string Name,
    string? Description
);

public record UpdateSeriesDto(
    [Required(ErrorMessage = "系列名称不能为空")] string Name,
    string? Description
);
