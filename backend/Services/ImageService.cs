using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;
using Microsoft.Extensions.Logging;

namespace MyNextBlog.Services;

/// <summary>
/// 图片资源管理服务
/// 负责跟踪图片的生命周期：上传记录 -> 关联文章 -> 清理废弃图片
/// </summary>
public class ImageService(AppDbContext context, IStorageService storageService, ILogger<ImageService> logger) : IImageService
{
    /// <summary>
    /// 记录新上传的图片
    /// </summary>
    /// <param name="url">图片的公开访问 URL</param>
    /// <param name="storageKey">云存储中的唯一 Key (用于后续删除)</param>
    /// <param name="width">图片宽度</param>
    /// <param name="height">图片高度</param>
    /// <remarks>
    /// 此时图片处于"游离"状态 (PostId = null)，如果在一定时间内未被任何文章引用，
    /// 将被 CleanupOrphanedImagesAsync 任务清除。
    /// </remarks>
    public async Task RecordImageAsync(string url, string storageKey, int width, int height)
    {
        var asset = new ImageAsset
        {
            Url = url,
            StorageKey = storageKey,
            UploadTime = DateTime.UtcNow,
            PostId = null,
            Width = width,
            Height = height
        };
        context.ImageAssets.Add(asset);
        await context.SaveChangesAsync();
    }

    /// <summary>
    /// 扫描文章内容，关联引用的图片
    /// </summary>
    /// <param name="postId">文章 ID</param>
    /// <param name="content">文章的 Markdown 内容</param>
    public async Task AssociateImagesAsync(int postId, string content)
    {
        if (string.IsNullOrEmpty(content)) return;

        // 优化策略：只查询最近 7 天内上传且尚未关联文章的图片。
        // 假设：作者不会引用一张 1 年前上传但一直没用过的"僵尸"图片。
        // 收益：避免全表扫描，提升保存文章时的性能。
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
        var pendingImages = await context.ImageAssets
            .Where(i => i.PostId == null && i.UploadTime > sevenDaysAgo)
            .ToListAsync();

        bool hasChanges = false;

        foreach (var image in pendingImages)
        {
            // 简单的字符串匹配：如果文章内容包含图片的 URL，说明这张图被用到了
            if (content.Contains(image.Url))
            {
                image.PostId = postId;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// 删除某篇文章下的所有图片资源
    /// </summary>
    /// <remarks>
    /// 这是一个"彻底删除"操作：既删除数据库记录，也通过 API 删除云端的物理文件。
    /// </remarks>
    public async Task DeleteImagesForPostAsync(int postId)
    {
        // 1. 找出所有属于该文章的图片
        var images = await context.ImageAssets
            .Where(i => i.PostId == postId)
            .ToListAsync();

        foreach (var image in images)
        {
            // 2. 尝试从 R2 对象存储中删除文件
            try 
            {
                await storageService.DeleteAsync(image.StorageKey);
            }
            catch (Exception ex)
            {
                // 如果云端删除失败（比如网络波动），记录日志但不阻断后续流程
                logger.LogWarning(ex, "Failed to delete R2 object {StorageKey}", image.StorageKey);
            }
            
            // 3. 从数据库移除记录
            context.ImageAssets.Remove(image);
        }

        await context.SaveChangesAsync();
    }

    /// <summary>
    /// 定时任务：清理僵尸图片
    /// </summary>
    /// <returns>被清理的图片数量</returns>
    /// <remarks>
    /// "僵尸图片"定义：上传超过 24 小时，但 PostId 仍为 null (未被任何文章引用)。
    /// 这种情况通常发生在用户上传了图片但最终取消了发布，或者是编辑时的废弃草稿。
    /// </remarks>
    public async Task<int> CleanupOrphanedImagesAsync()
    {
        var threshold = DateTime.UtcNow.AddHours(-24);

        var orphans = await context.ImageAssets
            .Where(i => i.PostId == null && i.UploadTime < threshold)
            .ToListAsync();

        int deletedCount = 0;
        foreach (var image in orphans)
        {
            try
            {
                await storageService.DeleteAsync(image.StorageKey);
                context.ImageAssets.Remove(image);
                deletedCount++;
            }
            catch (Exception ex)
            {
                // 忽略个别删除失败，留给下次任务处理
                logger.LogWarning(ex, "Failed to cleanup orphaned image {StorageKey}", image.StorageKey);
            }
        }

        await context.SaveChangesAsync();
        return deletedCount;
    }
}
