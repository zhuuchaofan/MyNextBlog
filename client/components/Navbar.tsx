import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Home, BookOpen, Camera, Info, Search } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-lg transition-all shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 hover:text-orange-500 transition-colors">
              <span className="text-2xl">🐱</span>
              <span>球球布丁的后花园</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" icon={<Home className="w-4 h-4" />} label="首页" active />
            <NavLink href="/archive" icon={<BookOpen className="w-4 h-4" />} label="归档" />
            <NavLink href="/gallery" icon={<Camera className="w-4 h-4" />} label="猫咪相册" />
            <NavLink href="/about" icon={<Info className="w-4 h-4" />} label="关于铲屎官" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
             <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 text-gray-500">
                <Search className="w-5 h-5" />
             </Button>
             <Button variant="outline" className="hidden sm:flex rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
               登录
             </Button>
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
