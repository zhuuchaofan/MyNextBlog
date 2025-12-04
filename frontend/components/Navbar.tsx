'use client';

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
import { Home, BookOpen, Camera, Info, Search, LogOut, LayoutDashboard, Menu } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { href: '/', icon: <Home className="w-4 h-4" />, label: '首页' },
    { href: '/archive', icon: <BookOpen className="w-4 h-4" />, label: '归档' },
    { href: '/gallery', icon: <Camera className="w-4 h-4" />, label: '猫咪相册' },
    { href: '/about', icon: <Info className="w-4 h-4" />, label: '关于铲屎官' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg transition-all shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 mr-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 hover:text-orange-500 transition-colors">
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
             <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 text-gray-500 hidden sm:flex">
                <Search className="w-5 h-5" />
             </Button>
             
             {/* Mobile Menu Trigger */}
             <div className="md:hidden">
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-gray-600">
                     <Menu className="w-6 h-6" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-md">
                    <DropdownMenuLabel>导航</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {navLinks.map(link => (
                      <Link key={link.href} href={link.href}>
                        <DropdownMenuItem className={`cursor-pointer gap-2 ${pathname === link.href ? 'text-orange-600 bg-orange-50' : ''}`}>
                          {link.icon}
                          <span>{link.label}</span>
                        </DropdownMenuItem>
                      </Link>
                    ))}
                 </DropdownMenuContent>
               </DropdownMenu>
             </div>

             {user ? (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="ghost" className="relative h-8 w-8 rounded-full ml-1">
                     <Avatar className="h-8 w-8 border border-orange-100">
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt={user.username} />
                       <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                     </Avatar>
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent className="w-56" align="end" forceMount>
                   <DropdownMenuLabel className="font-normal">
                     <div className="flex flex-col space-y-1">
                       <p className="text-sm font-medium leading-none">{user.username}</p>
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
                   <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                     <LogOut className="mr-2 h-4 w-4" />
                     <span>退出登录</span>
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             ) : (
               <Link href="/login">
                 <Button variant="outline" size="sm" className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 ml-2">
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
        className={`rounded-full gap-2 ${active ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        {icon}
        {label}
      </Button>
    </Link>
  );
}
