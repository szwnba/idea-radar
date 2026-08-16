import { fetchJson, signalId } from '../util/http';
import type { Signal } from '../../lib/types';

interface HFModel {
  id: string;
  likes: number;
  downloads: number;
  pipeline_tag?: string;
  createdAt?: string;
  lastModified?: string;
}

/** HuggingFace 趋势模型 */
export async function collect(): Promise<Signal[]> {
  const models = await fetchJson<HFModel[]>(
    'https://huggingface.co/api/models?sort=trendingScore&direction=-1&limit=15',
  );
  const now = new Date().toISOString();

  return models.map((m) => {
    const url = `https://huggingface.co/${m.id}`;
    const tag = m.pipeline_tag ? ` · ${m.pipeline_tag}` : '';
    return {
      id: signalId(url),
      channel: 'huggingface' as const,
      title: m.id,
      url,
      summary: `${m.downloads.toLocaleString()} 下载 · ${m.likes.toLocaleString()} 喜欢${tag}`,
      points: m.likes,
      comments: 0,
      publishedAt: m.lastModified ?? m.createdAt ?? now,
      collectedAt: now,
      heat: 0,
      tags: [],
    };
  });
}
