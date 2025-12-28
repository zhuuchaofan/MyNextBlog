// lib/dateUtils.ts
// 日期相关工具函数

/**
 * 将天数格式化为智能显示格式
 * - < 30 天: "15 天"
 * - 30-365 天: "1 个月 5 天"
 * - ≥ 365 天: "4 年 7 个月"
 */
export function formatDaysSmart(days: number): string {
  if (days < 0) return "0 天";
  
  if (days < 30) {
    return `${days} 天`;
  }
  
  if (days < 365) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    if (remainingDays === 0) {
      return `${months} 个月`;
    }
    return `${months} 个月 ${remainingDays} 天`;
  }
  
  // >= 365 天
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  
  if (months === 0) {
    return `${years} 年`;
  }
  return `${years} 年 ${months} 个月`;
}

/**
 * 格式化为简短显示（用于收起态按钮）
 * - < 30 天: "15天"
 * - 30-365 天: "3月"
 * - ≥ 365 天: "4年"
 */
export function formatDaysShort(days: number): string {
  if (days < 0) return "0天";
  
  if (days < 30) {
    return `${days}天`;
  }
  
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months}月`;
  }
  
  const years = Math.floor(days / 365);
  return `${years}年`;
}
