using System;

namespace MyNextBlog.DTOs;

public record LoginDto(string Username, string Password);

public record AuthResponseDto(string AccessToken, string RefreshToken, DateTime Expiration, string Username, string Role);

public record RefreshTokenDto(string RefreshToken);
