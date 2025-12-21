import Link from "next/link";
import { SeriesInfo } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeriesNavigationProps {
  seriesInfo?: SeriesInfo;
}

export function SeriesNavigation({ seriesInfo }: SeriesNavigationProps) {
  if (!seriesInfo) return null;

  return (
    <Card className="my-8 overflow-hidden border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              <span className="font-semibold text-xs md:text-sm uppercase tracking-wider">
                系列文章
              </span>
            </div>
            <Link href={`/series/${seriesInfo.id}`} className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hidden sm:block">
               查看全部 →
            </Link>
          </div>
          
          {/* Title and Progress */}
          <div>
            <h3 className="text-base md:text-lg font-bold mb-1 line-clamp-1">
              <Link href={`/series/${seriesInfo.id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {seriesInfo.name}
              </Link>
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              第 {seriesInfo.currentOrder} 篇，共 {seriesInfo.totalCount} 篇
            </p>
          </div>

          {/* Navigation Buttons - Stack on mobile, side-by-side on desktop */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 md:pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
            {seriesInfo.prev ? (
              <Button variant="ghost" size="sm" asChild className="h-auto py-2 flex-1 justify-start -ml-2 sm:-ml-3">
                <Link href={`/posts/${seriesInfo.prev.id}`} className="group flex flex-row sm:flex-col items-center sm:items-start gap-2 sm:gap-1">
                  <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-xs text-muted-foreground group-hover:text-indigo-600 transition-colors hidden sm:block">上一篇</span>
                    <span className="text-xs sm:text-sm font-medium line-clamp-1 text-left">
                      {seriesInfo.prev.title}
                    </span>
                  </div>
                </Link>
              </Button>
            ) : (
                <div className="flex-1 hidden sm:block" />
            )}

            {seriesInfo.next ? (
              <Button variant="ghost" size="sm" asChild className="h-auto py-2 flex-1 justify-end text-right -mr-2 sm:-mr-3">
                <Link href={`/posts/${seriesInfo.next.id}`} className="group flex flex-row-reverse sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                   <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                   <div className="flex flex-col items-end overflow-hidden">
                      <span className="text-xs text-muted-foreground group-hover:text-indigo-600 transition-colors hidden sm:block">下一篇</span>
                      <span className="text-xs sm:text-sm font-medium line-clamp-1 text-right">
                        {seriesInfo.next.title}
                      </span>
                   </div>
                </Link>
              </Button>
             ) : (
                 <div className="flex-1 hidden sm:block" />
             )}
          </div>

          {/* Mobile: View All link */}
          <Link href={`/series/${seriesInfo.id}`} className="text-center text-xs text-indigo-500 hover:text-indigo-600 pt-2 border-t border-indigo-100 dark:border-indigo-900/50 sm:hidden">
             查看系列全部文章 →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
