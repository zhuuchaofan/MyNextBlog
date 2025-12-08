import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Folder } from "lucide-react";

interface Post {
  id: number;
  title: string;
  excerpt: string;
  createTime: string;
  author: string;
  category: string;
  categoryId: number;
  coverImage?: string;
}

// 获取分类下的文章和分类详情
async function getCategoryData(categoryId: string) {
  const baseUrl = process.env.BACKEND_URL || 'http://localhost:5095';
  const postsUrl = `${baseUrl}/api/posts?categoryId=${categoryId}`;
  const categoryUrl = `${baseUrl}/api/categories/${categoryId}`;
  
  try {
    const [postsRes, categoryRes] = await Promise.all([
      fetch(postsUrl, { next: { revalidate: 60 } }),
      fetch(categoryUrl, { next: { revalidate: 60 } })
    ]);
    
    let posts: Post[] = [];
    let categoryName = `分类 ${categoryId}`;

    if (postsRes.ok) {
      const postsJson = await postsRes.json();
      if (postsJson.success) posts = postsJson.data;
    } else {
      console.error(`Fetch posts failed: ${postsRes.status} for URL: ${postsUrl}`);
    }

    if (categoryRes.ok) {
      const categoryJson = await categoryRes.json();
      if (categoryJson.success) categoryName = categoryJson.data.name;
    } else {
       // 如果获取分类详情失败，但获取到了文章，尝试从文章中提取分类名
       if (posts.length > 0) categoryName = posts[0].category;
       console.error(`Fetch category failed: ${categoryRes.status} for URL: ${categoryUrl}`);
    }

    return { posts, categoryName };
  } catch (error) {
    console.error(`Fetch category data error`, error);
    return { posts: [], categoryName: 'Unknown' };
  }
}

export default async function CategoryPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const { posts, categoryName } = await getCategoryData(resolvedParams.id);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8">
      {/* Header */}
      <div className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
          <Folder className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
          <p className="text-gray-500">收录了 {posts.length} 篇文章</p>
        </div>
      </div>

      {/* Post List */}
      <div className="grid gap-6">
        {posts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-400">该分类下暂时没有文章 🍂</p>
            <Link href="/">
              <Button variant="link" className="mt-2 text-orange-600">返回首页</Button>
            </Link>
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow border-gray-100 group">
              <div className="flex flex-col md:flex-row">
                  {post.coverImage && (
                    <div className="md:w-48 h-48 md:h-auto bg-gray-100 relative overflow-hidden group-hover:cursor-pointer">
                      <Link href={`/posts/${post.id}`} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-orange-600 border-orange-200">{post.category}</Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(post.createTime).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-xl md:text-2xl transition-colors">
                        <Link href={`/posts/${post.id}`} className="hover:text-orange-600 hover:underline decoration-orange-300 underline-offset-4 cursor-pointer">
                          {post.title}
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-gray-600 line-clamp-2 md:line-clamp-3">
                        {post.excerpt}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Link href={`/posts/${post.id}`}>
                        <Button variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-0 cursor-pointer">
                          阅读全文 <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
