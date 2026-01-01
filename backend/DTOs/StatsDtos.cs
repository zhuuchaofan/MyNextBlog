// ============================================================================
// DTOs/StatsDtos.cs - 统计相关数据传输对象
// ============================================================================
// 此文件定义了统计模块使用的 DTO，遵循不可变 record 类型设计。
//
// **使用场景**:
//   - SiteStatsDto: 公开 API，返回给首页 Pulse 组件
//   - AdminDashboardDto: 管理员仪表盘统计数据

namespace MyNextBlog.DTOs;

/// <summary>
/// 公开统计 DTO (首页 Pulse 组件)
/// </summary>
/// <param name="Visits">累计访问量</param>
/// <param name="PostsCount">公开文章数</param>
/// <param name="CommentsCount">评论总数</param>
/// <param name="RunningDays">网站运行天数</param>
public record SiteStatsDto(
    int Visits,
    int PostsCount,
    int CommentsCount,
    int RunningDays
);

/// <summary>
/// 管理员仪表盘统计 DTO
/// </summary>
/// <param name="Posts">文章统计（总数/已发布/草稿）</param>
/// <param name="Comments">评论总数</param>
/// <param name="Categories">分类总数</param>
/// <param name="Tags">标签总数</param>
/// <param name="Series">系列总数</param>
public record AdminDashboardDto(
    PostStatsDto Posts,
    int Comments,
    int Categories,
    int Tags,
    int Series
);

/// <summary>
/// 文章统计子 DTO
/// </summary>
/// <param name="Total">总数（不含软删除）</param>
/// <param name="Published">已发布（公开）</param>
/// <param name="Draft">草稿（隐藏）</param>
public record PostStatsDto(
    int Total,
    int Published,
    int Draft
);
