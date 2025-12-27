import RSS from 'rss';
import { SITE_CONFIG } from '@/lib/constants';

// 强制动态渲染，保证获取最新文章
export const dynamic = 'force-dynamic';

// 获取站点配置
async function getSiteContent(key: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  try {
    const res = await fetch(`${backendUrl}/api/site-content/${key}`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data.value : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  // 获取作者配置
  const authorJson = await getSiteContent('about_author');
  let author = {
    name: SITE_CONFIG.author,
    avatar: SITE_CONFIG.avatar,
  };
  if (authorJson) {
    try {
      author = JSON.parse(authorJson);
    } catch { /* 使用默认值 */ }
  }

  const feed = new RSS({
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    site_url: SITE_CONFIG.url,
    feed_url: `${SITE_CONFIG.url}/feed.xml`,
    copyright: `Copyright ${new Date().getFullYear()} ${author.name}`,
    language: 'zh-CN',
    pubDate: new Date(),
    image_url: author.avatar, 
  });

  try {
    // 获取最新的 20 篇文章
    const res = await fetch(`${backendUrl}/api/posts?page=1&pageSize=20`, {
      next: { revalidate: 3600 } // Next.js 缓存 1 小时
    });
    
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        json.data.forEach((post: any) => {
          feed.item({
            title: post.title,
            description: post.excerpt || '点击阅读全文...',
            url: `${SITE_CONFIG.url}/posts/${post.id}`,
            guid: `${SITE_CONFIG.url}/posts/${post.id}`,
            author: post.authorName || author.name,
            date: new Date(post.createTime),
            categories: post.categoryName ? [post.categoryName] : [],
          });
        });
      }
    }
  } catch (error) {
    console.error('RSS Generation Error:', error);
  }

  const xml = feed.xml({ indent: true });
  // 注入 XSL 样式表声明，让浏览器渲染出漂亮的页面
  const xmlWithStyle = xml.replace(
    '<?xml version="1.0" encoding="UTF-8"?>', 
    '<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="/rss-style.xsl"?>'
  );

  return new Response(xmlWithStyle, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      // CDN 缓存控制
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400', 
    },
  });
}
