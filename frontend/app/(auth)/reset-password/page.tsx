'use client';

import { useState, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from "framer-motion";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ResetPasswordSchema, ResetPasswordFormData } from '@/lib/schemas';
import { useSearchParams, useRouter } from 'next/navigation';

function ResetPasswordContent() {
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (formData: ResetPasswordFormData) => {
    setServerError('');
    
    if (!token || !email) {
      setServerError('无效的重置链接');
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
          email,
          newPassword: formData.password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
           router.push('/login');
        }, 3000);
      } else {
        setServerError(data.message || '重置失败，链接可能已过期');
      }
    } catch {
      setServerError('连接服务器失败，请稍后再试');
    }
  };

  if (!token || !email) {
      return (
         <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">链接无效</h1>
            <p className="text-zinc-500">重置链接缺少必要参数，请检查您的邮件链接是否完整。</p>
            <Link href="/login">
               <Button variant="outline">返回登录</Button>
            </Link>
         </div>
      );
  }

  if (success) {
      return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
        >
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">密码重置成功!</h2>
            <p className="text-zinc-500 mb-8 max-w-xs mx-auto">
                您的密码已更新，3秒后将自动跳转到登录页面...
            </p>
            <Link href="/login">
                <Button className="w-full h-11 bg-black text-white hover:bg-zinc-800">
                    立即登录
                </Button>
            </Link>
        </motion.div>
      );
  }

  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] space-y-8"
    >
        <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">设置新密码</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                请为您的账号设置一个新的安全密码。
            </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-md bg-red-50 text-red-500 text-sm border border-red-200"
            >
                {serverError}
            </motion.div>
            )}

            <div className="space-y-2">
                <Label htmlFor="password">新密码</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                    placeholder="至少6位"
                    {...register('password')}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pl-10 pr-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium" 
                    placeholder="再次输入"
                    {...register('confirmPassword')}
                />
                <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button disabled={isSubmitting} className="w-full h-11 bg-black hover:bg-zinc-800 text-white shadow-lg transition-all dark:bg-white dark:text-black dark:hover:bg-zinc-200 mt-4">
            {isSubmitting ? (
                <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    重置中...
                </span>
            ) : (
                <span className="flex items-center justify-center gap-2">
                    重置密码 <ArrowRight className="w-4 h-4" />
                </span>
            )}
            </Button>
        </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full min-h-screen lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden bg-white dark:bg-zinc-900">
      
      {/* Left Side: Artistic (Tech Theme) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-10 relative overflow-hidden">
        {/* Tech Background: Dot Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        {/* Subtle Ambient Light - Reset Variant (Green) */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none"></div>

        {/* Brand Content */}
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center text-white">B</div>
          MyNextBlog
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
             <h2 className="text-3xl font-bold tracking-tight mb-2">重新掌控账户</h2>
             <p className="text-zinc-300">
               请设置一个强密码来保护您的数据安全。
             </p>
           </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
           © 2025 MyNextBlog Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="min-h-screen lg:h-full flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  );
}
