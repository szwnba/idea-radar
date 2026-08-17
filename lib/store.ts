'use client';

import { useSyncExternalStore } from 'react';
import type { Signal } from './types';

/** 收藏快照：信号滚出滚动窗口后依然可渲染 */
export interface FavItem {
  id: string;
  title: string;
  url: string;
  channel: Signal['channel'];
  summary?: string;
  points: number;
  comments: number;
  publishedAt: string;
  heat: number;
  tags: string[];
  /** 收藏时间 */
  savedAt: string;
}

export interface HiddenItem {
  id: string;
  title: string;
}

export interface RadarStore {
  favs: FavItem[];
  hidden: HiddenItem[];
  /** 刚隐藏的信号（撤销提示用） */
  toast: { id: string; title: string } | null;
}

const KEY = 'idea-radar:v1';
const MAX_HIDDEN = 500;
const EVENT = 'idea-radar-store';

const EMPTY: RadarStore = { favs: [], hidden: [], toast: null };
const SERVER_CACHE: RadarStore = EMPTY;

let cache: RadarStore | null = null;

function load(): RadarStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<RadarStore>;
    return {
      favs: Array.isArray(parsed.favs) ? parsed.favs : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      toast: null,
    };
  } catch {
    return { ...EMPTY };
  }
}

function persist(next: RadarStore) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify({ favs: next.favs, hidden: next.hidden }));
  } catch {
    // 存储满或被禁用：静默降级，界面仍可用
  }
  window.dispatchEvent(new Event(EVENT));
}

/** 读取当前状态（订阅请用 useRadarStore） */
export function getState(): RadarStore {
  if (!cache) cache = typeof window === 'undefined' ? SERVER_CACHE : load();
  return cache;
}

export function subscribe(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler); // 多标签页同步
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function useRadarStore(): RadarStore {
  return useSyncExternalStore(subscribe, getState, () => SERVER_CACHE);
}

function toFav(s: Signal): FavItem {
  return {
    id: s.id,
    title: s.title,
    url: s.url,
    channel: s.channel,
    summary: s.summary,
    points: s.points,
    comments: s.comments,
    publishedAt: s.publishedAt,
    heat: s.heat,
    tags: s.tags,
    savedAt: new Date().toISOString(),
  };
}

export function toggleFavorite(s: Signal) {
  const cur = getState();
  const exists = cur.favs.some((f) => f.id === s.id);
  persist({
    ...cur,
    favs: exists ? cur.favs.filter((f) => f.id !== s.id) : [toFav(s), ...cur.favs],
  });
}

export function removeFavorite(id: string) {
  const cur = getState();
  persist({ ...cur, favs: cur.favs.filter((f) => f.id !== id) });
}

export function hideSignal(s: Signal) {
  const cur = getState();
  if (cur.hidden.some((h) => h.id === s.id)) return;
  persist({
    ...cur,
    favs: cur.favs.filter((f) => f.id !== s.id),
    hidden: [{ id: s.id, title: s.title }, ...cur.hidden].slice(0, MAX_HIDDEN),
    toast: { id: s.id, title: s.title },
  });
}

export function unhideSignal(id: string) {
  const cur = getState();
  persist({
    ...cur,
    hidden: cur.hidden.filter((h) => h.id !== id),
    toast: cur.toast?.id === id ? null : cur.toast,
  });
}

export function clearHidden() {
  persist({ ...getState(), hidden: [], toast: null });
}

export function clearToast() {
  if (!getState().toast) return;
  persist({ ...getState(), toast: null });
}
