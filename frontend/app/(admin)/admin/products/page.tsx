// 管理员商品管理页面
// --------------------------------------------------------------------------------
"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Package, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  fetchProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductAdmin,
} from "@/lib/api";

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    downloadUrl: "",
    redeemCode: "",
    stock: -1,
    isActive: true,
  });

  // 加载商品列表
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProductsAdmin();
        setProducts(data);
      } catch {
        toast.error("加载失败");
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // 打开新增对话框
  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      downloadUrl: "",
      redeemCode: "",
      stock: -1,
      isActive: true,
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (product: ProductAdmin) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl || "",
      downloadUrl: product.downloadUrl || "",
      redeemCode: product.redeemCode || "",
      stock: product.stock,
      isActive: product.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("请输入商品名称");
      return;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        // 更新
        await updateProduct(editingProduct.id, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          imageUrl: formData.imageUrl || undefined,
          downloadUrl: formData.downloadUrl || undefined,
          redeemCode: formData.redeemCode || undefined,
          stock: formData.stock,
          isActive: formData.isActive,
        });
        toast.success("商品已更新");
      } else {
        // 新增
        await createProduct({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          imageUrl: formData.imageUrl || undefined,
          downloadUrl: formData.downloadUrl || undefined,
          redeemCode: formData.redeemCode || undefined,
          stock: formData.stock,
        });
        toast.success("商品已创建");
      }
      setDialogOpen(false);
      // 重新加载
      const data = await fetchProductsAdmin();
      setProducts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除商品
  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个商品吗？")) return;

    setDeleting(id);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("商品已删除");
        // 重新加载
        const data = await fetchProductsAdmin();
        setProducts(data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，可能有订单关联");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              商品管理
            </CardTitle>
            <CardDescription>管理商店中的虚拟商品</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            添加商品
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无商品，点击上方按钮添加
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品名称</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead className="text-center">库存</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      ¥{product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.stock === -1 ? "∞" : product.stock}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isActive ? (
                        <Badge variant="default">
                          <Eye className="w-3 h-3 mr-1" />
                          上架
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="w-3 h-3 mr-1" />
                          下架
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(product.id)}
                          disabled={deleting === product.id}
                        >
                          {deleting === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "编辑商品" : "添加商品"}
            </DialogTitle>
            <DialogDescription>
              填写商品信息，带 * 的为必填项
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">商品名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：《C# 高级编程》电子版"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">商品描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="商品详细描述..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">价格 (元)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">库存 (-1 为无限)</Label>
                <Input
                  id="stock"
                  type="number"
                  min="-1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || -1 })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="imageUrl">封面图 URL</Label>
              <Input
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="downloadUrl">下载链接 (付款后可见)</Label>
              <Input
                id="downloadUrl"
                value={formData.downloadUrl}
                onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="redeemCode">兑换码 (付款后可见)</Label>
              <Input
                id="redeemCode"
                value={formData.redeemCode}
                onChange={(e) => setFormData({ ...formData, redeemCode: e.target.value })}
                placeholder="例如：VIP2026-XXXX"
              />
            </div>

            {editingProduct && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">上架状态</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
