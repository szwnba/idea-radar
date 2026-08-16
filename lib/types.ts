export type ChannelId =
  | 'hn'
  | 'github'
  | 'producthunt'
  | 'tldr'
  | 'simonwillison'
  | 'ruanyf'
  | 'huggingface'
  | 'sspai'
  | 'reddit'
  | 'v2ex';

export interface Channel {
  id: ChannelId;
  /** 中文名，如「黑客新闻」 */
  name: string;
  /** 仪表盘显示的短码，如 HN */
  code: string;
  /** 频道主页 */
  site: string;
  /** 雷达图上的方位角（度，0 = 正北，顺时针） */
  angle: number;
}

/** 一条被捕获的灵感信号 */
export interface Signal {
  /** url 的 sha1，作为唯一键 */
  id: string;
  channel: ChannelId;
  title: string;
  url: string;
  summary?: string;
  author?: string;
  /** 互动量：赞/星/分数，缺省 0 */
  points: number;
  comments: number;
  /** ISO 时间 */
  publishedAt: string;
  collectedAt: string;
  /** 热度 0-100，每次同步全量重算（信号会随时间冷却） */
  heat: number;
  tags: string[];
}

export interface ChannelStatus {
  channel: ChannelId;
  ok: boolean;
  count: number;
  error?: string;
}

export interface SyncMeta {
  lastSync: string;
  durationMs: number;
  sources: ChannelStatus[];
}

export interface DayStat {
  date: string; // YYYY-MM-DD
  count: number;
}
