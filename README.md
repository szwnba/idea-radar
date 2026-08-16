# 灵感雷达 · Idea Radar

一个无人值守的灵感信号站：自动扫描 10 个优质灵感频道，打分排序，在雷达仪表盘上清晰展示今天有什么新想法、新趋势。

## 工作原理

```
GitHub Actions（每 2 小时）
  → pnpm collect 抓取 10 个频道
  → 打分 · 打标签 · 去重 → data/*.json
  → radar-bot 自动 commit & push
  → Vercel 检测到 push → 自动重新部署
  → 网站内容自动更新 ♻️ 无需任何人工维护
```

数据以 JSON 形式存在仓库里（git 即数据库），滚动保留最近 2000 条信号，完整历史可回溯。

## 监控频道

| 频道 | 来源 | 方式 |
|------|------|------|
| HN | Hacker News（Show HN / 高分帖） | Firebase API |
| GH | GitHub Trending 周榜 + 本周新星 | HTML + Search API |
| PH | Product Hunt | Atom feed |
| TLDR | TLDR AI 日报 | RSS |
| SW | Simon Willison 博客 | Atom |
| RYF | 阮一峰科技爱好者周刊 | GitHub API |
| HF | HuggingFace 趋势模型 | API |
| SSPAI | 少数派 | RSS |
| RDT | Reddit r/SideProject | RSS（尽力） |
| V2EX | V2EX 分享创造 | API（尽力） |

单个频道失败不影响整体 — 界面「频道状态」会如实显示中断。

## 热度模型

`热度(0-100) = 频道内互动量 60% + 新近度 30% + 关键词加成 10%`

每次同步全量重算，信号随时间自然冷却。标签（#AI #工具 #变现 #开源 #教程 #出海 #趣味）由关键词规则自动归类。

## 雷达图读法

- **角度** = 频道方位（外环刻度）
- **半径** = 新近度（中心 = 刚刚，48H 环 = 两天前）
- **亮度与大小** = 热度；红色脉冲 = 今日 Top 3
- 点击光点直达原始内容

## 本地开发

```bash
pnpm install
pnpm collect   # 手动巡扫一轮（产出 data/*.json）
pnpm dev       # http://localhost:3000
pnpm build     # 生产构建（纯静态）
```

## 新增一个频道

1. `collectors/sources/` 新建 `xxx.ts`，导出 `collect(): Promise<Signal[]>`
2. `lib/channels.ts` 注册频道（分配雷达角度）
3. `collectors/run.ts` 的 collectors 数组加一行
4. 本地 `pnpm collect` 验证后提交即可，之后全自动

## 部署

1. 推送到 GitHub（仓库 Settings → Actions → Allow all actions）
2. Vercel 导入该仓库，框架自动识别 Next.js，零配置部署
3. 部署完成后每 2 小时自动巡扫，数据 push 触发 Vercel 重建

> Vercel Hobby 的 cron 限每天一次，因此巡扫由 GitHub Actions 驱动（免费且粒度细），Vercel 只负责静态托管。
