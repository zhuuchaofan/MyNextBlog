'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, ArrowRight, PawPrint, ChevronLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-orange-50/50">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <Card className="w-full max-w-[500px] overflow-hidden shadow-2xl border-0 rounded-3xl z-10 bg-white/80 backdrop-blur-sm m-4">
        <div className="p-8 md:p-12">
            {!submitted ? (
                <>
                    <div className="mb-8">
                        <Link href="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-500 mb-6 transition-colors">
                            <ChevronLeft className="w-4 h-4 mr-1" /> 返回登录
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">忘记密码?</h1>
                        <p className="text-sm text-gray-500 mt-2">别担心，输入您的注册邮箱，我们将发送重置链接给您。</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">邮箱地址</Label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-orange-500" />
                                <Input 
                                    id="email" 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-11 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                发送中...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                发送重置链接 <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </form>
                </>
            ) : (
                <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">邮件已发送!</h2>
                    <p className="text-gray-500 mb-8">
                        如果 {email} 存在于我们的系统中，您将收到一封包含重置密码说明的邮件。
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full h-11">
                            返回登录页面
                        </Button>
                    </Link>
                </div>
            )}
        </div>
      </Card>
      
      {/* 装饰图标 */}
      <div className="absolute top-10 right-10 opacity-20 hidden md:block animate-float">
          <PawPrint className="w-24 h-24 text-orange-300 rotate-12" />
      </div>
    </div>
  );
}
