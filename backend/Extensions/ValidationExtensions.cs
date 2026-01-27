// ============================================================================
// Extensions/ValidationExtensions.cs - DTO 验证扩展方法
// ============================================================================
// 提供统一的防御性验证机制，确保 Service 层能验证绕过 Controller 的 DTO
//
// **使用方式**:
//   dto.ValidateAndThrow();  // 验证失败时抛出 ValidationException
//
// **背景**:
//   C# record 主构造函数的 Data Annotations 默认对 Validator.ValidateObject 不可见，
//   必须使用 [property:] 前缀。此扩展方法统一验证逻辑，简化 Service 层代码。

using System.ComponentModel.DataAnnotations;

namespace MyNextBlog.Extensions;

/// <summary>
/// DTO 验证扩展方法
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// 验证 DTO 对象，失败时抛出 ValidationException
    /// </summary>
    /// <typeparam name="T">DTO 类型</typeparam>
    /// <param name="dto">待验证的 DTO 对象</param>
    /// <exception cref="ValidationException">验证失败时抛出</exception>
    public static void ValidateAndThrow<T>(this T dto) where T : class
    {
        ArgumentNullException.ThrowIfNull(dto);
        Validator.ValidateObject(dto, new ValidationContext(dto), validateAllProperties: true);
    }

    /// <summary>
    /// 尝试验证 DTO 对象，返回验证结果
    /// </summary>
    /// <typeparam name="T">DTO 类型</typeparam>
    /// <param name="dto">待验证的 DTO 对象</param>
    /// <param name="results">验证错误列表</param>
    /// <returns>验证是否通过</returns>
    public static bool TryValidate<T>(this T dto, out ICollection<ValidationResult> results) where T : class
    {
        ArgumentNullException.ThrowIfNull(dto);
        results = new List<ValidationResult>();
        return Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);
    }
}
