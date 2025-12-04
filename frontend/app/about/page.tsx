import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Mail, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
      <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
        {/* 左侧：自我介绍 */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-gray-900">
            关于 <span className="text-orange-500">我</span> & <span className="text-orange-500">猫</span>
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            你好！我是 朱超凡，一名热爱折腾技术的开发者。
          </p>
          <p className="text-lg text-gray-600 leading-relaxed">
            这个博客项目是我用来探索 .NET 10 和 Next.js 15 最新特性的实验田。
            正如你所见，它不仅是一个技术博客，更是我记录生活点滴、分享撸猫日常的“后花园”。
          </p>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" size="icon" className="rounded-full">
              <Github className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Twitter className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
              <Mail className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 右侧：形象照 (暂时用 Placehold) */}
        <div className="relative aspect-square bg-orange-100 rounded-3xl overflow-hidden shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
           <div className="absolute inset-0 flex items-center justify-center text-9xl opacity-20 select-none">
             👨‍💻
           </div>
           {/* 如果有真实头像，可以使用 <Image src="..." /> */}
        </div>
      </div>

      {/* 底部：猫咪介绍卡片 */}
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Meet The Bosses (猫主子们)</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="hover:shadow-lg transition-shadow border-orange-100 bg-gradient-to-br from-white to-orange-50">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm flex-shrink-0">
              🐱
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">球球 (QiuQiu)</h3>
              <p className="text-sm text-orange-600 mb-2">职位：首席监工 / CTO</p>
              <p className="text-gray-600 text-sm">
                一只高冷优雅的狸花猫。喜欢在键盘上睡觉，擅长在代码里插入随机字符。
                负责监督我写代码，如果不给罐头就罢工。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow border-orange-100 bg-gradient-to-br from-white to-orange-50">
          <CardContent className="p-6 flex items-start gap-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm flex-shrink-0">
              🍮
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">布丁 (Pudding)</h3>
              <p className="text-sm text-orange-600 mb-2">职位：气氛组组长 / HR</p>
              <p className="text-gray-600 text-sm">
                活泼乖巧的黑猫。负责在深夜写 Bug 时提供呼噜声治愈服务。
                最大的爱好是追着光标跑。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
