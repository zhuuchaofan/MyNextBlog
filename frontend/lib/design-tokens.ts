// =============================================================================
// Design Tokens - 统一设计令牌配置
// =============================================================================
// 定义全局可复用的样式变量，确保 UI 一致性

/**
 * 容器样式配置
 * - admin: 后台管理页面，紧凑布局
 * - public: 前台公开页面，舒适阅读间距
 * - publicHero: 前台营销性页面，更大的视觉冲击
 */
export const CONTAINER_STYLES = {
  admin: {
    padding: 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
    maxWidth: 'max-w-6xl',
  },
  public: {
    padding: 'px-4 sm:px-6 lg:px-8 py-8 sm:py-12',
    maxWidth: 'max-w-5xl',
  },
  publicHero: {
    padding: 'px-4 sm:px-6 lg:px-8 py-12 sm:py-16',
    maxWidth: 'max-w-6xl',
  },
} as const;

/**
 * 最大宽度映射
 */
export const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
} as const;

/**
 * 间距规范
 */
export const SPACING = {
  /** 卡片列表间距 (文章、商品) */
  cardList: 'gap-4 sm:gap-6',
  /** 表格行间距 */
  tableRows: 'gap-2 sm:gap-3',
  /** Section 区块间距 */
  sections: 'space-y-12 sm:space-y-16',
  /** Grid 多列卡片 */
  gridCards: 'gap-4 lg:gap-6',
  /** 卡片内部 Padding */
  cardPadding: 'p-4 sm:p-6',
} as const;

/**
 * 空状态预设文案
 */
export const EMPTY_STATE_MESSAGES = {
  orders: {
    title: '暂无订单',
    description: '您还没有任何订单记录',
  },
  posts: {
    title: '暂无文章',
    description: '还没有发布任何文章',
  },
  comments: {
    title: '暂无评论',
    description: '成为第一个评论的人吧',
  },
  series: {
    title: '暂无系列',
    description: '还没有创建任何系列',
  },
  categories: {
    title: '暂无分类',
    description: '开始创建您的第一个分类',
  },
  tags: {
    title: '暂无标签',
    description: '开始创建您的第一个标签',
  },
  friends: {
    title: '暂无友链',
    description: '还没有添加任何友链',
  },
  memos: {
    title: '暂无动态',
    description: '还没有发布任何动态',
  },
  products: {
    title: '暂无商品',
    description: '还没有上架任何商品',
  },
  plans: {
    title: '暂无计划',
    description: '开始创建您的第一个计划',
  },
  gallery: {
    title: '暂无照片',
    description: '还没有上传任何照片',
  },
  data: {
    title: '暂无数据',
    description: '没有找到相关数据',
  },
} as const;

export type EmptyStateKey = keyof typeof EMPTY_STATE_MESSAGES;
export type ContainerVariant = keyof typeof CONTAINER_STYLES;
export type MaxWidthKey = keyof typeof MAX_WIDTH_MAP;
