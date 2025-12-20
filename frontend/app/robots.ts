import { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // 禁止爬取后台和 API
    },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`, // 指向生成的 sitemap
  }
}
