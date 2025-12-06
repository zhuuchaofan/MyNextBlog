using Microsoft.EntityFrameworkCore;
using MyNextBlog.Data;
using MyNextBlog.Models;

namespace MyNextBlog.Services;

public class ImageService : IImageService
{
    private readonly AppDbContext _context;
    private readonly IStorageService _storageService;

    public ImageService(AppDbContext context, IStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    public async Task RecordImageAsync(string url, string storageKey)
    {
        var asset = new ImageAsset
        {
            Url = url,
            StorageKey = storageKey,
            UploadTime = DateTime.Now,
            PostId = null
        };
        _context.ImageAssets.Add(asset);
        await _context.SaveChangesAsync();
    }

    public async Task AssociateImagesAsync(int postId, string content)
    {
        if (string.IsNullOrEmpty(content)) return;

        // 1. 查找所有尚未关联文章的图片 (PostId == null)
        // 优化：只查最近上传的，避免全表扫描。比如查最近7天的。
        var pendingImages = await _context.ImageAssets
            .Where(i => i.PostId == null)
            .ToListAsync();

        bool hasChanges = false;

        foreach (var image in pendingImages)
        {
            // 2. 检查图片 URL 是否出现在文章内容中
            // 简单的字符串包含检查通常就足够了，因为 URL 是唯一的
            if (content.Contains(image.Url))
            {
                image.PostId = postId;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteImagesForPostAsync(int postId)
    {
        // 1. 找出所有属于该文章的图片
        var images = await _context.ImageAssets
            .Where(i => i.PostId == postId)
            .ToListAsync();

        foreach (var image in images)
        {
            // 2. 从 R2 删除物理文件
            try 
            {
                await _storageService.DeleteAsync(image.StorageKey);
            }
            catch (Exception ex)
            {
                // 记录日志，但不阻断流程
                Console.WriteLine($"Failed to delete R2 object {image.StorageKey}: {ex.Message}");
            }
            
            // 3. 标记数据库记录为待删除 (或者直接从 Context 移除)
            _context.ImageAssets.Remove(image);
        }

        await _context.SaveChangesAsync();
    }

    public async Task<int> CleanupOrphanedImagesAsync()
    {
        // 定义过期时间：24小时前
        var threshold = DateTime.Now.AddHours(-24);

        // 找出所有 PostId 为空 且 上传时间早于 24小时前的图片
        var orphans = await _context.ImageAssets
            .Where(i => i.PostId == null && i.UploadTime < threshold)
            .ToListAsync();

        int deletedCount = 0;
        foreach (var image in orphans)
        {
            try
            {
                await _storageService.DeleteAsync(image.StorageKey);
                _context.ImageAssets.Remove(image);
                deletedCount++;
            }
            catch (Exception)
            {
                // 忽略错误，下次再试
            }
        }

        await _context.SaveChangesAsync();
        return deletedCount;
    }
}