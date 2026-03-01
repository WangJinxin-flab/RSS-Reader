<div align="right">
  <a href="README.md">English</a> |
  <strong>简体中文</strong> |
  <a href="README_ru.md">Русский</a> |
  <a href="README_es.md">Español</a> |
  <a href="README_fr.md">Français</a> |
  <a href="README_ar.md">العربية</a>
</div>

<p align="center">
  <img src="icon.svg" width="128" height="128" alt="RSS Reader Logo">
</p>

<h1 align="center">RSS Reader</h1>

<p align="center">
  <strong>一款本地优先、AI 驱动的桌面 RSS 阅读器。无云端，无追踪，只有你的订阅。</strong>
</p>

<p align="center">
  <a href="https://github.com/WangJinxin-flab/RSS-Reader/releases"><img src="https://img.shields.io/github/v/release/WangJinxin-flab/RSS-Reader?color=blue&label=%E4%B8%8B%E8%BD%BD" alt="Releases"></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built_with-Tauri_2.0-24C8DB?logo=tauri&logoColor=white" alt="Tauri"></a>
</p>

<p align="center">
  <a href="#%E4%B8%BA%E4%BB%80%E4%B9%88%E9%80%89%E6%8B%A9-rss-reader">为什么选择 RSS Reader？</a> •
  <a href="#%E5%8A%9F%E8%83%BD%E7%89%B9%E6%80%A7">功能特性</a> •
  <a href="#%E4%B8%8B%E8%BD%BD">下载</a> •
  <a href="#%E6%8A%80%E6%9C%AF%E6%A0%88">技术栈</a> •
  <a href="#%E5%BC%80%E5%8F%91">开发</a>
</p>

---

**界面截图**
<img src="imgs/screenshot.png" alt="App Preview" width="800">

## 为什么选择 RSS Reader？

在一个充斥着订阅服务和云端同步的世界里，**RSS Reader** 采取了不同的方式。它是一款现代桌面应用程序，将您的所有数据严格保留在本地机器上。由 Tauri 和 Rust 提供支持，它速度极快，内存效率高，并深度集成了 AI 以增强您的阅读体验。

## 功能特性

### 阅读 & 订阅管理
- **通用支持：** 无缝订阅 RSS、Atom 和 JSON 源。
- **智能同步：** 使用 `ETag` 和 `Last-Modified` 头进行增量同步以节省带宽。
- **OPML 支持：** 轻松导入和导出您的订阅列表。
- **沉浸式阅读：** 干净的阅读模式、进度条和动态目录。
- **媒体优先：** 开箱即用的 YouTube 和 Bilibili 嵌入视频支持。

### AI 集成
- **智能摘要：** 使用 OpenAI 或 Anthropic API 自动生成文章摘要。
- **一键翻译：** 无需离开应用即可原生翻译整篇文章。
- **自动化规则：** 构建强大的 AI 驱动规则（例如：“自动星标 AI 相关性得分 > 80 的文章”）。

### 桌面原生体验
- **本地缓存：** 自定义 `rss-media://` 协议可离线安全缓存图像和流媒体视频。
- **高性能：** 虚拟化列表 (`react-virtuoso`) 轻松处理数千篇文章。
- **适合高级用户：** 全面的全局键盘快捷键，实现全键盘导航。
- **主题：** 支持跟随系统模式的深色和浅色主题。
- **多语言：** 支持阿拉伯语、中文、英语、法语、俄语和西班牙语。

## 下载

可以通过 GitHub Releases 获取即用型二进制文件。
> 目前仅支持 MacOS

| 平台 | 架构 | 下载 |
|----------|--------------|----------|
| **macOS** | 通用 (Intel / Apple Silicon) | [下载 .dmg](https://github.com/WangJinxin-flab/RSS-Reader/releases) |

> [!TIP]
> **更新**
> 应用程序通过 Tauri 原生支持自动更新。安装后，您将自动收到新版本通知。

## 技术栈

本项目利用现代 Web 和系统语言来提供轻量级的原生应用程序：

- **核心：** [Tauri 2.0](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **前端：** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **样式：** [Tailwind CSS](https://tailwindcss.com/)
- **状态管理：** [Zustand](https://docs.pmnd.rs/zustand/)
- **数据库：** SQLite（通过捆绑的 `rusqlite`）

## 开发

### 前置要求
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (v1.70+)

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/rss-reader.git
cd rss-reader

# 2. 安装前端依赖
npm install

# 3. 启动开发服务器（前端 + Rust 后端）
npm run tauri:dev
```

### 常用命令

| 命令 | 描述 |
|---------|-------------|
| `npm run tauri:build` | 构建发布版本应用 |
| `npm run dev`         | 仅运行 Vite 前端（无 Rust 后端） |
| `npm test`            | 运行前端测试 (Vitest) |
| `cargo test`          | 运行后端测试 (Rust) |
| `npm run lint`        | 运行 ESLint |

### 架构概述
应用程序通过 Tauri 的 IPC (`invoke`) 实现了清晰的关注点分离：
- `src-tauri/src/db/`: 模块化的 SQLite 操作（订阅、标签、分组、规则）。
- `src-tauri/src/feed/`: 使用 `feed-rs` 解析订阅源。
- `src/stores/`: 供全局状态持久化存储的 Zustand store。
- `src/components/`: 用于 UI 的模块化 React 组件。