'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, BookOpen, Camera, Info, Search, LogOut, LayoutDashboard, Menu, LogIn, User as UserIcon, Rss, Library, ShoppingBag, Package, ShoppingCart, Users, MessageCircle } from 'lucide-react';
import SearchDialog from '@/components/SearchDialog';
import { ModeToggle } from '@/components/mode-toggle';
import { useMounted } from '@/hooks/useMounted';
import { useCartCount } from '@/hooks/useCartCount';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // 使用自定义 Hook 避免 ESLint set-state-in-effect 警告
  const mounted = useMounted();
  
  // 购物车商品数量 (使用自定义 Hook 监听 localStorage 变化)
  const cartCount = useCartCount();

  const navLinks = [
    { href: '/', icon: <Home className="w-4 h-4" />, label: '首页' },
    { href: '/archive', icon: <BookOpen className="w-4 h-4" />, label: '归档' },
    { href: '/series', icon: <Library className="w-4 h-4" />, label: '系列' },
    { href: '/memos', icon: <MessageCircle className="w-4 h-4" />, label: '碎碎念' },
    { href: '/gallery', icon: <Camera className="w-4 h-4" />, label: '相册' },
    { href: '/friends', icon: <Users className="w-4 h-4" />, label: '友链' },
    { href: '/shop', icon: <ShoppingBag className="w-4 h-4" />, label: '小卖部' },
    { href: '/about', icon: <Info className="w-4 h-4" />, label: '关于' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-lg transition-all shadow-sm">
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 mr-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 dark:text-gray-100 hover:text-orange-500 transition-colors">
              <span className="text-2xl">🐱</span>
              <span className="hidden sm:inline">球球布丁的后花园</span>
              <span className="sm:hidden">球球&布丁</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navLinks.map(link => (
              <NavLink key={link.href} href={link.href} icon={link.icon} label={link.label} active={pathname === link.href} />
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             {/* 购物车按钮 */}
             <Link href="/cart" aria-label="购物车">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="relative rounded-full hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
               >
                 <ShoppingCart className="w-5 h-5" />
                 {cartCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                     {cartCount > 99 ? '99+' : cartCount}
                   </span>
                 )}
               </Button>
             </Link>

             <ModeToggle />
             
             <Link href="/feed.xml" target="_blank" aria-label="RSS 订阅">
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="rounded-full hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hidden sm:flex"
               >
                 <Rss className="w-5 h-5" />
               </Button>
             </Link>

             <Button 
               variant="ghost" 
               size="icon" 
               className="rounded-full hover:bg-orange-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 hidden sm:flex"
               onClick={() => setIsSearchOpen(true)}
               aria-label="搜索"
             >
                <Search className="w-5 h-5" />
             </Button>
             
             {/* Mobile Menu Trigger */}
             <div className="md:hidden">
               {!mounted ? (
                 <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300" aria-label="打开导航菜单">
                   <Menu className="w-6 h-6" />
                 </Button>
               ) : (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300" aria-label="打开导航菜单">
                       <Menu className="w-6 h-6" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
                      <DropdownMenuLabel>导航</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {navLinks.map(link => (
                        <Link key={link.href} href={link.href}>
                          <DropdownMenuItem className={`cursor-pointer gap-2 ${pathname === link.href ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400' : ''}`}>
                            {link.icon}
                            <span>{link.label}</span>
                          </DropdownMenuItem>
                        </Link>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => {setIsSearchOpen(true);}}>
                        <Search className="w-4 h-4" />
                        <span>搜索</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user ? (
                          <>
                             <DropdownMenuLabel className="font-normal">
                               <div className="flex flex-col space-y-1">
                                 <p className="text-sm font-medium leading-none">{user.nickname || user.username}</p>
                                 <p className="text-xs leading-none text-muted-foreground">
                                   {user.role === 'Admin' ? '管理员' : '普通用户'}
                                 </p>
                               </div>
                             </DropdownMenuLabel>
                             {user.role === 'Admin' && (
                               <Link href="/admin">
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <LayoutDashboard className="w-4 h-4" />
                                    <span>管理后台</span>
                                  </DropdownMenuItem>
                               </Link>
                             )}
                             <Link href="/orders">
                               <DropdownMenuItem className="cursor-pointer gap-2">
                                 <Package className="w-4 h-4" />
                                 <span>我的订单</span>
                               </DropdownMenuItem>
                             </Link>
                             <Link href="/settings">
                               <DropdownMenuItem className="cursor-pointer gap-2">
                                 <UserIcon className="w-4 h-4" />
                                 <span>个人设置</span>
                               </DropdownMenuItem>
                             </Link>
                             <DropdownMenuItem onClick={logout} className="cursor-pointer gap-2 text-red-600">
                               <LogOut className="w-4 h-4" />
                               <span>退出登录</span>
                             </DropdownMenuItem>
                          </>
                      ) : (
                          <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                              <DropdownMenuItem className="cursor-pointer gap-2">
                                  <LogIn className="w-4 h-4" />
                                  <span>登录</span>
                              </DropdownMenuItem>
                          </Link>
                      )}
                   </DropdownMenuContent>
                 </DropdownMenu>
               )}
             </div>

             {user ? (
               !mounted ? (
                 <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                   <Avatar className="h-8 w-8 border border-orange-100 dark:border-orange-900">
                     <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="object-cover" />
                     <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                   </Avatar>
                 </Button>
               ) : (
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                       <Avatar className="h-8 w-8 border border-orange-100 dark:border-orange-900">
                         <AvatarImage src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} className="object-cover" />
                         <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                       </Avatar>
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent className="w-56" align="end" forceMount>
                     <DropdownMenuLabel className="font-normal">
                       <div className="flex flex-col space-y-1">
                         <p className="text-sm font-medium leading-none">{user.nickname || user.username}</p>
                         <p className="text-xs leading-none text-muted-foreground">
                           {user.role === 'Admin' ? '管理员' : '普通用户'}
                         </p>
                       </div>
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {user.role === 'Admin' && (
                       <Link href="/admin">
                          <DropdownMenuItem className="cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>管理后台</span>
                          </DropdownMenuItem>
                       </Link>
                     )}
                     <Link href="/orders">
                        <DropdownMenuItem className="cursor-pointer">
                          <Package className="mr-2 h-4 w-4" />
                          <span>我的订单</span>
                        </DropdownMenuItem>
                     </Link>
                     <Link href="/settings">
                        <DropdownMenuItem className="cursor-pointer">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>个人设置</span>
                        </DropdownMenuItem>
                     </Link>
                     <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                       <LogOut className="mr-2 h-4 w-4" />
                       <span>退出登录</span>
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               )
             ) : (
               <Link href={`/login?redirect=${encodeURIComponent(pathname)}`} aria-label="登录账号">
                 <Button variant="outline" size="sm" className="hidden md:flex rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950 ml-2 whitespace-nowrap">
                   登录
                 </Button>
               </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link href={href}>
      <Button 
        variant={active ? "secondary" : "ghost"} 
        className={`rounded-full gap-2 ${active ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-400 dark:hover:bg-orange-900/50' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800'}`}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}
