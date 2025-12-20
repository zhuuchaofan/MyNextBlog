import { MetadataRoute } from 'next'
import { getPostsForSitemap } from '@/lib/data'
import { SITE_CONFIG } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. 获取所有公开文章
  const posts = await getPostsForSitemap()
  const baseUrl = SITE_CONFIG.url

  // 2. 定义静态路由
  const staticRoutes = [
    '',
    '/about',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 3. 生成文章动态路由
  const postRoutes = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.id}`,
    // createTime 是后端返回的字符串，如果需要更精确的 lastModified，
    // 理想情况下后端应该返回 updateTime。这里暂用 createTime。
    lastModified: new Date(post.createTime),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...postRoutes]
}
