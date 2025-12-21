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
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BookOpen className="h-5 w-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">
              系列文章
            </span>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-1">
              {seriesInfo.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              第 {seriesInfo.currentOrder} 篇，共 {seriesInfo.totalCount} 篇
            </p>
          </div>

          <div className="flex items-center justify-between mt-2 pt-4 border-t border-indigo-100 dark:border-indigo-900/50">
            {seriesInfo.prev ? (
              <Button variant="ghost" size="sm" asChild className="-ml-3 h-auto py-2 flex-1 justify-start">
                <Link href={`/posts/${seriesInfo.prev.id}`} className="group flex flex-col items-start gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                    <ChevronLeft className="h-3 w-3" /> 上一篇
                  </span>
                  <span className="text-sm font-medium line-clamp-1 text-left">
                    {seriesInfo.prev.title}
                  </span>
                </Link>
              </Button>
            ) : (
                <div className="flex-1" />
            )}

            {seriesInfo.next ? (
              <Button variant="ghost" size="sm" asChild className="-mr-3 h-auto py-2 flex-1 justify-end text-right">
                <Link href={`/posts/${seriesInfo.next.id}`} className="group flex flex-col items-end gap-1">
                   <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                    下一篇 <ChevronRight className="h-3 w-3" />
                  </span>
                  <span className="text-sm font-medium line-clamp-1 text-right">
                    {seriesInfo.next.title}
                  </span>
                </Link>
              </Button>
             ) : (
                 <div className="flex-1" />
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
