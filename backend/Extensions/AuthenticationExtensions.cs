using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace MyNextBlog.Extensions;

/// <summary>
/// JWT 身份认证配置扩展方法
/// </summary>
public static class AuthenticationExtensions
{
    /// <summary>
    /// 配置 JWT Bearer Token 认证
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        var jwtSettings = configuration.GetSection("JwtSettings");
        
        services.AddAuthentication(options =>
        {
            options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!)),
                RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                NameClaimType = System.Security.Claims.ClaimTypes.Name
            };
        });

        return services;
    }
}
