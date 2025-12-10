import Navbar from "@/components/Navbar"; // 导入导航栏组件

// 管理后台布局 (Admin Layout)
// --------------------------------------------------------------------------------
// 这个布局文件包裹了 `app/(admin)` 路由组下的所有页面。
//
// **作用**:
// 1. **统一导航**: 确保所有后台页面都显示顶部的 `Navbar`。
// 2. **统一间距**: 通过 `main` 标签的 `pt-20` (padding-top) 为固定定位的导航栏留出空间，
//    并通过 `min-h-screen` 确保页面内容至少占满一屏高度。
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-20 pb-10 min-h-screen">
        {children}
      </main>
    </>
  );
}
