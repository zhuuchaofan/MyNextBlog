'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User as UserIcon, Eye, EyeOff, ArrowRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterSchema, RegisterFormData } from '@/lib/schemas';
import { motion } from "framer-motion";

export default function RegisterPage() {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (formData: RegisterFormData) => {
    setServerError('');
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username, 
          email: formData.email,
          password: formData.password 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // 注册成功后自动登录
        login({ 
          username: data.user.username, 
          role: data.user.role, 
          avatarUrl: data.user.avatarUrl 
        });
      } else {
        setServerError(data.message || '注册失败，请稍后重试');
      }
    } catch {
      setServerError('连接服务器失败，请稍后再试');
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-white dark:bg-zinc-900">
      
      {/* Left Side: Artistic/Brand Section */}
      <div className="hidden lg:flex flex-col justify-between bg-black text-white p-10 relative overflow-hidden">
        {/* Abstract Background - Different gradient for register */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/40 via-zinc-900 to-zinc-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0 mix-blend-overlay"></div>
        
        {/* Animated Decor */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }} 
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] z-1"
        />

        {/* Brand Content */}
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black">B</div>
          MyNextBlog
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
           <blockquote className="text-2xl font-medium leading-relaxed">
            &ldquo;加入 MyNextBlog，开启你的创作之旅。这里不仅仅是代码，更是思想的火花碰撞之处。&rdquo;
           </blockquote>
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500"></div>
             <div>
               <p className="text-sm font-semibold">Sarah Lee</p>
               <p className="text-xs text-zinc-400">Content Creator</p>
             </div>
           </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
           © 2025 MyNextBlog Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="flex items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900/50">
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5 }}
           className="w-full max-w-[400px] space-y-8"
        >
           <div className="flex flex-col space-y-2 text-center">
             <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">创建账号</h1>
             <p className="text-sm text-zinc-500 dark:text-zinc-400">
               填写以下信息以开始您的旅程
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
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                   <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                   <Input 
                     id="username"
                     className="pl-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium" 
                     placeholder="yourname"
                     {...register('username')}
                   />
                </div>
                {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative">
                   <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                   <Input 
                     id="email"
                     type="email"
                     className="pl-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium" 
                     placeholder="name@example.com"
                     {...register('email')}
                   />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                 <Label htmlFor="password">密码</Label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input 
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="pl-10 pr-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium" 
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
                 <Label htmlFor="confirmPassword">确认密码</Label>
                 <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all font-medium" 
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
                     注册中...
                   </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                     立即注册 <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
           </form>

           <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-50 dark:bg-zinc-900 px-2 text-zinc-500">
                  或者
                </span>
              </div>
           </div>

           <div className="text-center text-sm">
             <span className="text-zinc-500">已有账号? </span>
             <Link href="/login" className="font-semibold text-pink-600 hover:text-pink-500 hover:underline">
               去登录
             </Link>
           </div>
        </motion.div>
      </div>
    </div>
  );
}
