'use client';

import { Suspense } from 'react';
import LoginForm from './LoginForm';

// 使用 Suspense 包装包含 useSearchParams 的组件
// 这是 Next.js 推荐的方式，避免静态构建时报错
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
