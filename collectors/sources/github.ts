import * as cheerio from 'cheerio';
import { daysAgoISO, fetchJson, fetchText, signalId } from '../util/http';
import type { Signal } from '../../lib/types';

interface SearchRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  created_at: string;
}

function parseCount(text: string): number {
  return Number(text.replace(/,/g, '')) || 0;
}

/** GitHub Trending（周榜 HTML）+ Search API 本周新星 AI 仓库 */
export async function collect(): Promise<Signal[]> {
  const now = new Date().toISOString();
  const signals: Signal[] = [];

  // 1) 周榜抓取
  try {
    const html = await fetchText('https://github.com/trending?since=weekly');
    const $ = cheerio.load(html);
    $('article.Box-row').each((_i, el) => {
      const row = $(el);
      const href = row.find('h2 a').attr('href');
      if (!href) return;
      const url = `https://github.com${href}`;
      const title = href.replace(/^\//, '');
      const description = row.find('p.col-9').text().trim();
      const starsText = row.find('a[href$="/stargazers"]').text().trim();
      const m = row.text().match(/([\d,]+)\s+stars\s+this\s+(day|week|month)/);
      const weeklyStars = m ? parseCount(m[1]) : 0;
      const language = row.find('[itemprop="programmingLanguage"]').text().trim();
      signals.push({
        id: signalId(url),
        channel: 'github',
        title,
        url,
        summary: description || undefined,
        points: weeklyStars || parseCount(starsText),
        comments: 0,
        publishedAt: now, // trending 无时间，按采集时间近似
        collectedAt: now,
        heat: 0,
        tags: [],
        author: language || undefined,
      });
    });
  } catch {
    // trending 页偶尔反爬，还有 Search API 兜底
  }

  // 2) 本周新建且星数上涨的仓库
  const repos = await fetchJson<{ items: SearchRepo[] }>(
    `https://api.github.com/search/repositories?q=created:>${daysAgoISO(7)}+stars:>40&sort=stars&order=desc&per_page=20`,
  );
  for (const r of repos.items ?? []) {
    signals.push({
      id: signalId(r.html_url),
      channel: 'github',
      title: r.full_name,
      url: r.html_url,
      summary: r.description ?? undefined,
      points: r.stargazers_count,
      comments: 0,
      publishedAt: r.created_at,
      collectedAt: now,
      heat: 0,
      tags: [],
      author: r.language ?? undefined,
    });
  }

  return signals;
}
