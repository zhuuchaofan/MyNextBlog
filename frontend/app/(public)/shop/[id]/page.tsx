// 商品详情页 - 公开访问
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Package, ShoppingCart, Minus, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchProductById, type ProductDetail, type CartItem } from "@/lib/api";

// 购物车本地存储 Key
const CART_STORAGE_KEY = "shopping_cart";

// 获取购物车
function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// 保存购物车
function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);

  // 解析动态路由参数
  useEffect(() => {
    params.then((p) => {
      setProductId(parseInt(p.id, 10));
    });
  }, [params]);

  // 加载商品详情
  useEffect(() => {
    if (productId === null) return;

    async function loadProduct() {
      setLoading(true);
      const data = await fetchProductById(productId!);
      setProduct(data);
      setLoading(false);
    }
    loadProduct();
  }, [productId]);

  // 加入购物车（返回 Promise 以支持立即购买等待）
  const addToCart = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!product) {
        resolve(false);
        return;
      }

      setAdding(true);

      // 模拟网络延迟
      setTimeout(() => {
        const cart = getCart();
        const existingItem = cart.find((item) => item.productId === product.id);

        // 计算添加后的总数量
        const currentQty = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQty + quantity;
        
        // 检查库存限制 (stock === -1 表示无限库存)
        if (product.stock !== -1 && newTotalQty > product.stock) {
          toast.error(`库存不足！当前库存 ${product.stock} 件，购物车已有 ${currentQty} 件`);
          setAdding(false);
          resolve(false);
          return;
        }

        if (existingItem) {
          existingItem.quantity = newTotalQty;
          existingItem.stock = product.stock; // 更新库存信息
        } else {
          cart.push({
            productId: product.id,
            productName: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity,
            stock: product.stock, // 保存库存信息
          });
        }

        saveCart(cart);
        // 触发自定义事件通知 Navbar 和 Cart 页面更新
        window.dispatchEvent(new Event("cart-updated"));
        setAdding(false);

        toast.success(`已加入购物车：${product.name} x ${quantity}`);
        resolve(true);
      }, 300);
    });
  };

  // 立即购买（等待加入购物车完成后跳转）
  const buyNow = async () => {
    if (!product) return;
    const success = await addToCart();
    if (success) {
      router.push("/cart");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h1 className="text-2xl font-bold mb-2">商品不存在</h1>
        <p className="text-muted-foreground mb-6">该商品可能已下架或不存在</p>
        <Button asChild>
          <Link href="/shop">返回商店</Link>
        </Button>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock !== -1 && product.stock <= 5 && product.stock > 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" asChild className="mb-6">
        <Link href="/shop">
          <ChevronLeft className="w-4 h-4 mr-1" />
          返回商店
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 商品图片 */}
        <div className="relative aspect-video lg:aspect-square bg-muted rounded-lg overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Package className="w-20 h-20 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* 商品信息 */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              {isLowStock && (
                <Badge variant="destructive">仅剩 {product.stock} 件</Badge>
              )}
              {isOutOfStock && <Badge variant="secondary">已售罄</Badge>}
            </div>
            <CardDescription className="text-3xl font-bold text-primary mt-2">
              ¥{product.price.toFixed(2)}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 商品描述 */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {product.description.replace(/<[^>]*>/g, "")}
              </p>
            </div>

            {/* 数量选择 */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">数量</span>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setQuantity(
                      product.stock === -1
                        ? quantity + 1
                        : Math.min(product.stock, quantity + 1)
                    )
                  }
                  disabled={product.stock !== -1 && quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {product.stock !== -1 && (
                <span className="text-sm text-muted-foreground">
                  库存 {product.stock} 件
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={addToCart}
                disabled={isOutOfStock || adding}
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                加入购物车
              </Button>
              <Button
                className="flex-1"
                onClick={buyNow}
                disabled={isOutOfStock}
              >
                立即购买
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
