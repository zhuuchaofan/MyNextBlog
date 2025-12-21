'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, ChevronLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from "framer-motion";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordFormData } from '@/lib/schemas';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (formData: ForgotPasswordFormData) => {
    setServerError('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
      } else {
        setServerError(data.message || '发送失败，请稍后重试');
      }
    } catch {
      setServerError('连接服务器失败，请稍后再试');
    }
  };

  return (
    <div className="w-full min-h-screen lg:h-screen lg:grid lg:grid-cols-2 lg:overflow-hidden bg-white dark:bg-zinc-900">
      
      {/* Left Side: Artistic/Brand Section (Tech Theme) */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-10 relative overflow-hidden">
        {/* Tech Background: Dot Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
        
        {/* Subtle Ambient Light - Forgot Password Variant (Blue) */}
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

        {/* Brand Content */}
        <div className="relative z-10 flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg flex items-center justify-center text-white">B</div>
          MyNextBlog
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
             <h2 className="text-3xl font-bold tracking-tight mb-2">恢复访问权限</h2>
             <p className="text-zinc-300">
               安全第一。我们通过验证您的注册邮箱来确保账户安全。
             </p>
           </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-500">
           © 2025 MyNextBlog Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="min-h-screen lg:h-full flex flex-col p-8 bg-zinc-50 dark:bg-zinc-900/50">
        {/* Mobile Brand Header - Static Position */}
        <div className="lg:hidden flex-none w-full flex items-center gap-2 font-bold text-xl tracking-tighter text-zinc-900 dark:text-white mb-8">
             <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">B</div>
             MyNextBlog
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center w-full">
            <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-[400px] space-y-8"
            >
                {!submitted ? (
                    <>
                        <div className="flex flex-col space-y-2 text-center lg:text-left">
                            <Link href="/login" className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-4 transition-colors justify-center lg:justify-start">
                                <ChevronLeft className="w-4 h-4 mr-1" /> 返回登录
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">忘记密码?</h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            别担心，输入您的注册邮箱，我们将发送重置链接给您。
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                <Label htmlFor="email">邮箱地址</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                                    <Input 
                                        id="email" 
                                        type="email" 
                                        placeholder="name@example.com" 
                                        className="pl-10 h-11 bg-white border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full h-11 bg-black hover:bg-zinc-800 text-white shadow-lg transition-all dark:bg-white dark:text-black"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    发送中...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                    发送重置链接 <ArrowRight className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </>
                ) : (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 mb-2">邮件已发送!</h2>
                        <p className="text-zinc-500 mb-8 max-w-xs mx-auto">
                            如果该邮箱存在于我们的系统中，您将收到一封包含重置密码说明的邮件。
                        </p>
                        <Link href="/login">
                            <Button variant="outline" className="w-full h-11 border-zinc-300 hover:bg-zinc-50 text-zinc-700">
                                返回登录页面
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
      </div>
    </div>
  );
}
