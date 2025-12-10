using System;

namespace MyNextBlog.DTOs;

public record LoginDto(string Username, string Password);

public record AuthResponseDto(string Token, DateTime Expiration, string Username, string Role);
