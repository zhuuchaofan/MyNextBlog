namespace MyNextBlog.DTOs;

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
