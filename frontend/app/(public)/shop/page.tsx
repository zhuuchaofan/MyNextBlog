// 商品列表页 - 公开访问
// --------------------------------------------------------------------------------
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Package } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";

export const metadata: Metadata = {
  title: "商店 | MyNextBlog",
  description: "购买电子书、课程和其他数字商品",
};

// 强制动态渲染（商品可能频繁更新）
export const dynamic = "force-dynamic";

// 获取商品列表
async function getProducts(): Promise<Product[]> {
  const backendUrl = process.env.BACKEND_URL || "http://backend:5095";
  
  try {
    const res = await fetch(`${backendUrl}/api/products`, {
      next: { revalidate: 60 }, // ISR: 60秒缓存
    });
    
    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }
    
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function ShopPage() {
  const products = await getProducts();
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-6xl">
      {/* 页面标题 */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ShoppingBag className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">商店</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          精选电子书、教程和实用工具，助力你的技术成长之路
        </p>
      </div>

      {/* 商品网格 */}
      {products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground text-lg">暂无商品</p>
          <p className="text-muted-foreground text-sm mt-2">敬请期待...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/shop/${product.id}`} className="group">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/30 overflow-hidden">
                {/* 商品图片 */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* 库存标签 */}
                  {product.stock !== -1 && product.stock <= 5 && product.stock > 0 && (
                    <Badge variant="destructive" className="absolute top-2 right-2">
                      仅剩 {product.stock} 件
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <Badge variant="secondary" className="absolute top-2 right-2">
                      已售罄
                    </Badge>
                  )}
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {product.description.replace(/<[^>]*>/g, "").substring(0, 100)}...
                  </p>
                </CardContent>
                
                <CardFooter className="flex items-center justify-between pt-2">
                  <span className="text-2xl font-bold text-primary">
                    ¥{product.price.toFixed(2)}
                  </span>
                  <Button size="sm" variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                    查看详情
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
