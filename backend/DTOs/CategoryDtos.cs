using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.DTOs;

public record CreateCategoryDto(
    [Required(ErrorMessage = "分类名称不能为空")]
    [StringLength(50, ErrorMessage = "分类名称不能超过50个字符")]
    string Name
);
