// 管理员商品管理页面
// --------------------------------------------------------------------------------
// 布局重构：移动端使用 Drawer，桌面端使用 Dialog
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2, 
  Package, 
  Eye, 
  EyeOff, 
  ChevronLeft,
  ExternalLink,
  Upload,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  fetchProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductAdmin,
} from "@/lib/api";

// 类型定义
interface FormDataType {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  downloadUrl: string;
  redeemCode: string;
  stock: number;
  isActive: boolean;
}

// 商品表单组件：在 Dialog 和 Drawer 中共享
function ProductForm({
  formData,
  setFormData,
  editingProduct,
}: {
  formData: FormDataType;
  setFormData: (data: FormDataType) => void;
  editingProduct: ProductAdmin | null;
}) {
  const [uploading, setUploading] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // 检查文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("图片大小不能超过 10MB");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      const res = await fetch("/api/backend/upload", {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("上传失败");
      }

      const data = await res.json();
      if (data.url) {
        setFormData({ ...formData, imageUrl: data.url });
      }
    } catch (error) {
      console.error("上传失败:", error);
      alert("图片上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="grid gap-4 py-2">
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
          rows={3}
        />
      </div>

      {/* 价格和库存：移动端堆叠，桌面端并排 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="price">价格 (元)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="1"
            value={formData.price}
            onInput={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              setFormData({ ...formData, price: isNaN(val) ? 0 : val });
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">库存 (-1 为无限)</Label>
          <Input
            id="stock"
            type="number"
            min="-1"
            step="1"
            value={formData.stock}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              // 只允许 -1 或 >= 0 的值
              if (isNaN(val)) {
                setFormData({ ...formData, stock: -1 });
              } else if (val < -1) {
                setFormData({ ...formData, stock: -1 }); // 小于 -1 自动修正为 -1
              } else {
                setFormData({ ...formData, stock: val });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">输入 -1 表示无限库存</p>
        </div>
      </div>

      {/* 封面图 */}
      <div className="grid gap-2">
        <Label>封面图</Label>
        <div className="flex gap-3">
          {/* 预览区域 */}
          <div className="relative w-20 h-20 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-800 flex-shrink-0">
            {formData.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={formData.imageUrl} 
                alt="封面预览" 
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            {/* 上传按钮 */}
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors text-sm">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "上传中..." : "上传图片"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {/* URL 输入 */}
            <Input
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="或直接输入图片 URL"
              className="text-xs"
            />
          </div>
        </div>
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
  );
}

export default function ProductsAdminPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductAdmin | null>(null);
  const [saving, setSaving] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductAdmin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 统计数据
  const [statsActive, setStatsActive] = useState<number | null>(null);
  const [statsInactive, setStatsInactive] = useState<number | null>(null);

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
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProductsAdmin();
      setProducts(data);
      // 计算统计
      const active = data.filter(p => p.isActive).length;
      setStatsActive(active);
      setStatsInactive(data.length - active);
    } catch {
      toast.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

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
      await loadProducts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 删除商品
  const executeDelete = async () => {
    if (!productToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(productToDelete.id);
      if (result.success) {
        toast.success("商品已删除");
        await loadProducts();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败，可能有订单关联");
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  // 切换上架状态
  const handleToggleActive = async (product: ProductAdmin) => {
    try {
      await updateProduct(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl || undefined,
        downloadUrl: product.downloadUrl || undefined,
        redeemCode: product.redeemCode || undefined,
        stock: product.stock,
        isActive: !product.isActive,
      });
      toast.success(product.isActive ? "商品已下架" : "商品已上架");
      // 乐观更新
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isActive: !p.isActive } : p
      ));
      // 更新统计
      if (product.isActive) {
        setStatsActive(prev => (prev ?? 0) - 1);
        setStatsInactive(prev => (prev ?? 0) + 1);
      } else {
        setStatsActive(prev => (prev ?? 0) + 1);
        setStatsInactive(prev => (prev ?? 0) - 1);
      }
    } catch {
      toast.error("操作失败");
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* 返回按钮 */}
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 dark:text-gray-400">
            <ChevronLeft className="w-4 h-4 mr-1" /> 返回
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            商品管理
          </h1>
        </div>
        {/* 第二行：统计徽章 + 按钮 */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          {statsActive !== null && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Eye className="w-3.5 h-3.5" />
                上架 {statsActive}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <EyeOff className="w-3.5 h-3.5" />
                下架 {statsInactive}
              </span>
            </div>
          )}
          <Button 
            onClick={openCreateDialog}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加商品
          </Button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
          暂无商品，点击上方按钮添加
        </div>
      ) : (
        <>
          {/* 桌面端表格 */}
          <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden transition-colors">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 dark:bg-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
                  <TableHead className="text-gray-500 dark:text-gray-400 text-center">商品名称</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400 text-center">价格</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400 text-center">库存</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400 text-center">状态</TableHead>
                  <TableHead className="text-gray-500 dark:text-gray-400 text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow 
                    key={product.id} 
                    className={`${!product.isActive ? 'bg-gray-50/30 dark:bg-zinc-800/30 text-gray-400 dark:text-gray-500' : 'dark:text-gray-300'} border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50`}
                  >
                    <TableCell className="text-center">
                      <Link 
                        href={`/shop/${product.id}`} 
                        target="_blank" 
                        className="hover:text-orange-600 dark:hover:text-orange-400 inline-flex items-center gap-2 group transition-colors font-medium"
                      >
                        {product.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-center font-medium text-orange-600 dark:text-orange-400">
                      ¥{product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-normal bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
                        {product.stock === -1 ? "∞ 无限" : product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={product.isActive ? "default" : "outline"} 
                        className={product.isActive 
                          ? "bg-green-500 hover:bg-green-600 text-white border-transparent" 
                          : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-zinc-700"
                        }
                      >
                        {product.isActive ? "上架" : "下架"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        {/* 切换上架状态 */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => handleToggleActive(product)}
                        >
                          {product.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                        {/* 编辑按钮 */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                          onClick={() => openEditDialog(product)}
                        >
                          <Pencil className="w-3 h-3 mr-1" /> 编辑
                        </Button>
                        {/* 删除按钮 */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-700 dark:hover:text-red-300"
                          onClick={() => setProductToDelete(product)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 移动端卡片视图 */}
          <div className="grid gap-3 md:hidden">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800 space-y-3 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight flex-1">
                    <Link 
                      href={`/shop/${product.id}`} 
                      className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </h3>
                  <Badge 
                    variant={product.isActive ? "default" : "outline"} 
                    className={product.isActive 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400"
                    }
                  >
                    {product.isActive ? "上架" : "下架"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-between border-b border-gray-50 dark:border-zinc-800 pb-3">
                  <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    ¥{product.price.toFixed(2)}
                  </span>
                  <span>库存: {product.stock === -1 ? "∞ 无限" : product.stock}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    onClick={() => handleToggleActive(product)}
                  >
                    {product.isActive ? <EyeOff className="w-3 h-3 mr-2" /> : <Eye className="w-3 h-3 mr-2" />}
                    {product.isActive ? "下架" : "上架"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
                    onClick={() => openEditDialog(product)}
                  >
                    <Pencil className="w-3 h-3 mr-2" /> 编辑
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-9 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                    onClick={() => setProductToDelete(product)}
                  >
                    <Trash2 className="w-3 h-3 mr-2" /> 删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 新增/编辑：桌面端 Dialog，移动端 Drawer */}
      {isDesktop ? (
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

            {/* 共享表单内容 */}
            <ProductForm
              formData={formData}
              setFormData={setFormData}
              editingProduct={editingProduct}
            />

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>
                {editingProduct ? "编辑商品" : "添加商品"}
              </DrawerTitle>
              <DrawerDescription>
                填写商品信息，带 * 的为必填项
              </DrawerDescription>
            </DrawerHeader>

            {/* 滚动区域 */}
            <div className="overflow-y-auto px-4 pb-4">
              <ProductForm
                formData={formData}
                setFormData={setFormData}
                editingProduct={editingProduct}
              />
            </div>

            <DrawerFooter className="pt-4">
              <Button onClick={handleSave} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                保存
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要删除这个商品吗？</AlertDialogTitle>
            <AlertDialogDescription>
              商品 <span className="font-bold text-gray-900 dark:text-gray-100">&ldquo;{productToDelete?.name}&rdquo;</span> 将被永久删除，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
