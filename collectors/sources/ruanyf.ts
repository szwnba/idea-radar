import { fetchJson, signalId } from '../util/http';
import type { Signal } from '../../lib/types';

interface Commit {
  sha: string;
  commit: { message: string; author: { date: string; name?: string } };
}

/** 阮一峰科技爱好者周刊：跟踪仓库 docs/ 目录的最新提交，每条提交即一期 */
export async function collect(): Promise<Signal[]> {
  const commits = await fetchJson<Commit[]>(
    'https://api.github.com/repos/ruanyf/weekly/commits?path=docs&per_page=6',
  );
  const now = new Date().toISOString();

  return commits
    .filter((c) => c.commit.message.trim().length > 4)
    .map((c) => {
      const url = `https://github.com/ruanyf/weekly/commit/${c.sha}`;
      return {
        id: signalId(url),
        channel: 'ruanyf' as const,
        title: c.commit.message.split('\n')[0].trim(),
        url,
        summary: '科技爱好者周刊：工具、文章与开源项目精选',
        author: c.commit.author?.name ?? 'ruanyf',
        points: 0,
        comments: 0,
        publishedAt: c.commit.author?.date ?? now,
        collectedAt: now,
        heat: 0,
        tags: [],
      };
    });
}
