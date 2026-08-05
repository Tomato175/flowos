# 心流OS (FlowOS)

> 🌀 开源个人生活中枢 — 让每一天都沉浸在专注中

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

## 这是什么

心流OS 是一个**开源的个人生活管理平台**，将任务、日历、习惯、目标、笔记、心情、照片等 9 大模块汇聚在一个精心设计的界面中。

不是又一个 Todo App，也不是又一个笔记软件——它是一个**聚合层**，让分散的工具变成一个统一的系统。

### 9 大核心模块

| 模块 | 说明 |
|------|------|
| 🎯 专注计时 | 番茄钟 + 自由计时 + 白噪音 + 全屏心流模式 |
| ✅ 任务管理 | GTD 收件箱 + 项目 + 标签 + 优先级 + 看板 |
| 📅 日历 | 日/周/月视图 + 时间块 + 专注标注 + iCal |
| 🔥 习惯追踪 | 每日打卡 + 连续天数 + 热力图 |
| 🎯 目标 OKR | 目标层级 + 关键结果 + 进度 + 复盘 |
| 📝 笔记日记 | Markdown + 日记 + 双向链接 + 知识库 |
| 😊 心情记录 | Emoji 心情 + 趋势分析 |
| 🎵 音乐栏 | 底部播放器 + 白噪音 + 专注歌单 |
| 📷 照片 | 时间线 + 相册 + 笔记关联 |

### 核心魔法：关联引擎

所有模块互相感知——
- 番茄钟关联任务 → 日历自动标注专注时段
- 任务完成 → 目标进度自动更新
- 专注数据 + 心情数据 → 交叉分析洞察

## 技术栈

```
Monorepo (npm workspaces)
├── apps/mobile     React Native + Expo
├── apps/web        Next.js 14 (App Router)
├── apps/desktop    Tauri v2 (计划中)
├── packages/
│   ├── shared-types   共享类型定义
│   ├── shared-db      Drizzle ORM + Schema
│   ├── shared-api     Supabase 客户端
│   ├── shared-ui      跨平台组件库
│   ├── shared-hooks   React Hooks
│   ├── shared-utils   工具函数
│   ├── design-system  设计 Token
│   └── editor         Markdown 编辑器
└── supabase/      数据库迁移 + Edge Functions
```

## 快速开始

### 前置要求

- Node.js >= 22
- npm >= 10

### 安装

```bash
git clone https://github.com/your-org/flowos.git
cd flowos
npm install
```

### 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建一个项目
2. 复制 `.env.example` 为 `.env`，填入你的 Supabase URL 和 Key

```bash
cp .env.example .env
```

### 启动开发服务器

```bash
# Web 端
npm run dev:web

# 移动端（需要 Expo Go）
npm run dev:mobile
```

## 开发路线图

- [x] **Phase 0** — Monorepo + 基础设施
- [ ] **Phase 1** — 专注计时器 + 任务管理（第一个 MVP）
- [ ] **Phase 2** — 习惯 + 心情 + 笔记日记
- [ ] **Phase 3** — 日历 + 目标 OKR
- [ ] **Phase 4** — 音乐 + 照片 + 仪表盘
- [ ] **Phase 5** — 打磨 + 开源发布

## 贡献

欢迎参与！查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何开始。

## 许可证

MIT © FlowOS Contributors
