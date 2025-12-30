using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record SeriesDto(
    int Id,
    string Name,
    string? Description,
    int PostCount
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
