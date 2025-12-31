import { Metadata } from 'next';
import Link from 'next/link';
import { Library, BookOpen, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// 获取所有系列
async function getAllSeries() {
  const baseUrl = process.env.BACKEND_URL || 'http://backend:8080';
  
  try {
    const res = await fetch(`${baseUrl}/api/series`, {
      next: { revalidate: 60 } // ISR 缓存 60 秒
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.success) return [];
    return json.data;
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: '系列文章',
  description: '按系列浏览博客文章，系统性地学习知识',
};

interface Series {
  id: number;
  name: string;
  description?: string;
  postCount: number;
  coverImage?: string;
}

export default async function SeriesListPage() {
  const seriesList = await getAllSeries() as Series[];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl mb-4">
          <Library className="w-8 h-8 text-orange-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          系列文章
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          按主题整理的系列文章，帮助你系统性地学习和理解相关知识
        </p>
      </div>

      {/* Series Grid */}
      {seriesList.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无系列文章</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <Link key={series.id} href={`/series/${series.id}`}>
              <Card className="group h-full border border-gray-100 dark:border-zinc-800 hover:border-orange-200 dark:hover:border-orange-800/50 hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                          {series.name}
                        </h2>
                      </div>
                      
                      {series.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                          {series.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-medium">
                          {series.postCount} 篇文章
                        </Badge>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
