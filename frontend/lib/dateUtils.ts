// lib/dateUtils.ts
// 日期相关工具函数

/**
 * 将天数格式化为时长显示格式（用于恋爱纪念日等）
 * - < 30 天: "15 天"
 * - 30-365 天: "1 个月 5 天"
 * - ≥ 365 天: "4 年 7 个月"
 */
export function formatDaysDuration(days: number): string {
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
 * 将天数格式化为年龄显示格式（用于生日等）
 * - < 365 天: "X 个月"
 * - ≥ 365 天: "X 岁"
 */
export function formatDaysAge(days: number): string {
  if (days < 0) return "0 岁";
  
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 0 ? "未满月" : `${months} 个月`;
  }
  
  const years = Math.floor(days / 365);
  return `${years} 岁`;
}

/**
 * 根据显示类型格式化天数
 * @param days 天数
 * @param displayType "duration" | "age"
 */
export function formatDaysSmart(days: number, displayType: string = "duration"): string {
  return displayType === "age" ? formatDaysAge(days) : formatDaysDuration(days);
}

/**
 * 格式化为简短显示（用于收起态按钮）
 * @param days 天数
 * @param displayType "duration" | "age"
 */
export function formatDaysShort(days: number, displayType: string = "duration"): string {
  if (days < 0) return displayType === "age" ? "0岁" : "0天";
  
  if (displayType === "age") {
    const years = Math.floor(days / 365);
    return years === 0 ? `${Math.floor(days / 30)}月` : `${years}岁`;
  }
  
  // duration
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

