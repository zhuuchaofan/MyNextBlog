'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Ghost, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="relative mb-8">
         <div className="absolute inset-0 bg-orange-200 dark:bg-orange-900/30 rounded-full blur-3xl opacity-50 animate-pulse"></div>
         <Ghost className="w-32 h-32 text-orange-500 relative z-10 animate-bounce" strokeWidth={1.5} />
      </div>
      
      <h1 className="text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">页面离家出走了...</h2>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
        哎呀，你似乎来到了知识的荒原。这里只有风滚草和赛博猫咪留下的爪印。
      </p>

      <Link href="/">
        <Button size="lg" className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg transition-all hover:scale-105">
           <Home className="w-4 h-4 mr-2" /> 返回后花园
        </Button>
      </Link>
    </div>
  );
}
