import type { Channel, ChannelId } from './types';

/** 11 个频道，按雷达方位角均匀分布（每 360/11 ≈ 32.7°） */
export const CHANNELS: Channel[] = [
  { id: 'hn',            name: '黑客新闻',        code: 'HN',    site: 'https://news.ycombinator.com',       angle: 0 },
  { id: 'github',        name: 'GitHub 趋势',     code: 'GH',    site: 'https://github.com/trending',        angle: 33 },
  { id: 'producthunt',   name: 'Product Hunt',    code: 'PH',    site: 'https://www.producthunt.com',        angle: 65 },
  { id: 'tldr',          name: 'TLDR AI',         code: 'TLDR',  site: 'https://tldr.tech/ai',               angle: 98 },
  { id: 'simonwillison', name: 'Simon 博客',       code: 'SW',   site: 'https://simonwillison.net',          angle: 131 },
  { id: 'ruanyf',        name: '阮一峰周刊',       code: 'RYF',  site: 'https://github.com/ruanyf/weekly',   angle: 164 },
  { id: 'indie1000',     name: '千人独立开发库',   code: '1K',    site: 'https://github.com/XiaomingX/1000-chinese-independent-developer-plus', angle: 196 },
  { id: 'huggingface',   name: 'HuggingFace',      code: 'HF',   site: 'https://huggingface.co',             angle: 229 },
  { id: 'sspai',         name: '少数派',           code: 'SSPAI', site: 'https://sspai.com',                 angle: 262 },
  { id: 'reddit',        name: 'Reddit',          code: 'RDT',   site: 'https://www.reddit.com/r/SideProject/', angle: 294 },
  { id: 'v2ex',          name: 'V2EX',            code: 'V2EX',  site: 'https://www.v2ex.com/go/create',     angle: 327 },
];

export const CHANNEL_MAP: Record<ChannelId, Channel> = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c]),
) as Record<ChannelId, Channel>;
