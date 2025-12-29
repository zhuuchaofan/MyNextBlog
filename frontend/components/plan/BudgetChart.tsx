'use client';

import { cn } from '@/lib/utils';

interface BudgetChartProps {
  budget: number;
  estimated: number;
  actual: number;
  currency: string;
  className?: string;
}

/**
 * 预算对比图表组件
 * 显示计划预算、预估花费、实际花费的对比进度条
 */
export default function BudgetChart({ budget, estimated, actual, currency, className }: BudgetChartProps) {
  // 计算最大值用于缩放
  const maxValue = Math.max(budget, estimated, actual, 1);
  
  // 计算百分比
  const budgetPercent = (budget / maxValue) * 100;
  const estimatedPercent = (estimated / maxValue) * 100;
  const actualPercent = (actual / maxValue) * 100;
  
  // 判断是否超预算
  const isOverBudget = actual > budget;
  const isEstimatedOverBudget = estimated > budget;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 计划预算 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">计划预算</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {currency} {budget.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-400 dark:bg-gray-500 rounded-full transition-all duration-500"
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      {/* 预估花费 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">预估花费</span>
          <span className={cn(
            "font-medium",
            isEstimatedOverBudget 
              ? "text-orange-600 dark:text-orange-400" 
              : "text-blue-600 dark:text-blue-400"
          )}>
            {currency} {estimated.toLocaleString()}
            {isEstimatedOverBudget && (
              <span className="text-xs ml-1">⚠️ 超预算</span>
            )}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isEstimatedOverBudget 
                ? "bg-orange-500" 
                : "bg-blue-500"
            )}
            style={{ width: `${estimatedPercent}%` }}
          />
        </div>
      </div>

      {/* 实际花费 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">实际花费</span>
          <span className={cn(
            "font-medium",
            isOverBudget 
              ? "text-red-600 dark:text-red-400" 
              : "text-green-600 dark:text-green-400"
          )}>
            {currency} {actual.toLocaleString()}
            {isOverBudget && (
              <span className="text-xs ml-1">❌ 超支</span>
            )}
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOverBudget 
                ? "bg-red-500" 
                : "bg-green-500"
            )}
            style={{ width: `${actualPercent}%` }}
          />
        </div>
      </div>

      {/* 预算利用率 */}
      {budget > 0 && actual > 0 && (
        <div className="pt-2 border-t dark:border-zinc-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">预算利用率</span>
            <span className={cn(
              "font-bold",
              actual / budget > 1 
                ? "text-red-600 dark:text-red-400" 
                : actual / budget > 0.8 
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-green-600 dark:text-green-400"
            )}>
              {((actual / budget) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
