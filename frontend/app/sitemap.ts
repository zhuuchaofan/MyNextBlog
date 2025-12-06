import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nextblog.zhuchaofan.online';
const backendBaseUrl = process.env.BACKEND_URL || 'http://backend:8080'; // Internal Docker URL for SSR fetch

interface Post {
  id: number;
  createTime: string;
}

async function fetchAllPosts(): Promise<Post[]> {
  try {
    // Assuming backend endpoint /api/posts can return all public posts,
    // or a sufficiently large pageSize can fetch them.
    const res = await fetch(`${backendBaseUrl}/api/posts?pageSize=9999`, {
      cache: 'no-store' // Ensure fresh data for sitemap generation
    });
    
    if (!res.ok) {
      console.error(`Failed to fetch posts for sitemap: ${res.status} ${res.statusText}`);
      return [];
    }
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data)) {
      console.error('Invalid response format for posts:', json);
      return [];
    }
    return json.data.map((post: any) => ({
      id: post.id,
      createTime: post.createTime,
    }));
  } catch (error) {
    console.error('Error fetching posts for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await fetchAllPosts();

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/posts/${post.id}`,
    lastModified: new Date(post.createTime),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${siteUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [...staticRoutes, ...postRoutes];
}
