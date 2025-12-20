namespace MyNextBlog.Helpers;

public static class EmailTemplateBuilder
{
    private const string BaseStyle = "font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px; background-color: #ffffff;";
    private const string FooterStyle = "margin-top: 30px; font-size: 12px; color: #6a737d; text-align: center;";

    public static string BuildAdminSpamNotification(string postTitle, string guestName, string content, string appUrl)
    {
        return $@"
            <div style='{BaseStyle}'>
                <div style='border-bottom: 2px solid #d73a49; padding-bottom: 15px; margin-bottom: 20px;'>
                    <h2 style='margin: 0; color: #d73a49; font-size: 20px;'>⚠️ 新评论需审核</h2>
                </div>
                <div style='color: #24292e; line-height: 1.6;'>
                    <p><strong>文章：</strong> {postTitle}</p>
                    <p><strong>用户：</strong> {guestName}</p>
                    <div style='background-color: #fffbdd; border-left: 4px solid #d73a49; padding: 15px; margin: 15px 0; color: #586069;'>
                        {content}
                    </div>
                </div>
                <div style='margin-top: 25px; text-align: center;'>
                    <a href='{appUrl}/admin/comments' style='display: inline-block; background-color: #d73a49; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>前往后台审核</a>
                </div>
                <div style='{FooterStyle}'>
                    © MyNextBlog Automated System
                </div>
            </div>";
    }

    public static string BuildNewCommentNotification(string postTitle, string content, string guestName, int postId, int commentId, string appUrl)
    {
        return $@"
            <div style='{BaseStyle}'>
                <div style='border-bottom: 2px solid #0366d6; padding-bottom: 15px; margin-bottom: 20px;'>
                    <h2 style='margin: 0; color: #0366d6; font-size: 20px;'>New Comment Notification</h2>
                </div>
                <div style='color: #24292e; line-height: 1.6;'>
                    <p>您的文章 <strong>{postTitle}</strong> 收到了新的评论：</p>
                    <div style='background-color: #f6f8fa; border-left: 4px solid #0366d6; padding: 15px; margin: 15px 0; color: #586069;'>
                        {content}
                    </div>
                    <p style='font-size: 14px; color: #586069;'>By: <strong>{guestName}</strong></p>
                </div>
                <div style='margin-top: 25px; text-align: center;'>
                    <a href='{appUrl}/posts/{postId}#comment-{commentId}' style='display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>查看详情</a>
                </div>
                <div style='{FooterStyle}'>
                    © MyNextBlog Automated System
                </div>
            </div>";
    }

    public static string BuildReplyNotification(string recipientName, string postTitle, string content, string guestName, int postId, int commentId, string appUrl)
    {
        return $@"
            <div style='{BaseStyle}'>
                <div style='border-bottom: 2px solid #28a745; padding-bottom: 15px; margin-bottom: 20px;'>
                    <h2 style='margin: 0; color: #28a745; font-size: 20px;'>New Reply</h2>
                </div>
                <div style='color: #24292e; line-height: 1.6;'>
                    <p>亲爱的 <strong>{recipientName}</strong>，</p>
                    <p>您在文章 <strong>{postTitle}</strong> 下的评论有了新的回复：</p>
                    <div style='background-color: #f6f8fa; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; color: #586069;'>
                        {content}
                    </div>
                    <p style='font-size: 14px; color: #586069;'>By: <strong>{guestName}</strong></p>
                </div>
                <div style='margin-top: 25px; text-align: center;'>
                    <a href='{appUrl}/posts/{postId}#comment-{commentId}' style='display: inline-block; background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;'>回复</a>
                </div>
                <div style='{FooterStyle}'>
                    © MyNextBlog Automated System
                </div>
            </div>";
    }
}
