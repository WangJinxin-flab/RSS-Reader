<p align="center">
  <img src="icon.svg" width="128" height="128" alt="RSS Reader Logo">
</p>

<h1 align="center">RSS Reader</h1>

<p align="center">
  <strong>A local-first, AI-powered desktop RSS reader. No cloud. No tracking. Just your feeds.</strong>
</p>

<p align="center">
  <a href="https://github.com/your-username/rss-reader/releases"><img src="https://img.shields.io/github/v/release/your-username/rss-reader?color=blue&label=Download" alt="Releases"></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built_with-Tauri_2.0-24C8DB?logo=tauri&logoColor=white" alt="Tauri"></a>
</p>

<p align="center">
  <a href="#why-rss-reader">Why RSS Reader?</a> •
  <a href="#features">Features</a> •
  <a href="#download">Download</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#development">Development</a>
</p>

---

> [!NOTE]
> **Screenshot Placeholder**
> 
> Replace this section with an actual screenshot or GIF of your application to give users a quick visual preview.
> 
> `<img src="docs/screenshot.png" alt="App Preview" width="800">`

## Why RSS Reader?

In a world of subscription services and cloud syncing, **RSS Reader** takes a different approach. It is a modern desktop application that keeps all your data strictly on your local machine. Powered by Tauri and Rust, it is blazing fast, memory-efficient, and deeply integrates with AI to supercharge your reading experience.

## Features

### Reading & Feed Management
- **Universal Support:** Seamlessly subscribe to RSS, Atom, and JSON feeds.
- **Smart Sync:** Incremental syncing using `ETag` and `Last-Modified` headers to save bandwidth.
- **OPML Support:** Easily import and export your feed lists.
- **Immersive Reading:** Clean reading mode, progress bar, and dynamic Table of Contents.
- **Media First:** YouTube and Bilibili embedded videos work out of the box.

### AI Integration
- **Smart Summaries:** Automatically generate article summaries using OpenAI or Anthropic APIs.
- **One-click Translation:** Translate entire articles natively without leaving the app.
- **Automation Rules:** Build powerful AI-driven rules (e.g., "Auto-star articles with an AI relevance score > 80").

### Desktop Native Experience
- **Local Caching:** Custom `rss-media://` protocol securely caches images and streaming videos offline.
- **High Performance:** Virtualized lists (`react-virtuoso`) handle thousands of articles effortlessly.
- **Power User Ready:** Comprehensive global keyboard shortcuts for mouse-free navigation.
- **Themes:** System-aware Dark and Light themes.
- **Multilingual:** Available in Arabic, Chinese, English, French, Russian, and Spanish.

## Download

Ready-to-use binaries are available via GitHub Releases.
> only for MacOS for now

| Platform | Architecture | Download |
|----------|--------------|----------|
| **macOS** | Universal (Intel / Apple Silicon) | [Download .dmg](https://github.com/WangJinxin-flab/RSS-Reader/releases) |

> [!TIP]
> **Updating**
> The app supports auto-updating natively through Tauri. Once installed, you will be notified of new releases automatically.

## Tech Stack

This project leverages modern web and systems languages to deliver a lightweight native app:

- **Core:** [Tauri 2.0](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand/)
- **Database:** SQLite (via `rusqlite` bundled)

## Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (v1.70+)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-username/rss-reader.git
cd rss-reader

# 2. Install frontend dependencies
npm install

# 3. Start development server (Frontend + Rust Backend)
npm run tauri:dev
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npm run tauri:build` | Build the release app bundle |
| `npm run dev`         | Run only the Vite frontend (no Rust backend) |
| `npm test`            | Run frontend tests (Vitest) |
| `cargo test`          | Run backend tests (Rust) |
| `npm run lint`        | Run ESLint |

### Architecture Overview
The app uses a clear separation of concerns via Tauri's IPC (`invoke`):
- `src-tauri/src/db/`: Modular SQLite operations (feeds, tags, groups, rules).
- `src-tauri/src/feed/`: Feed parsing using `feed-rs`.
- `src/stores/`: LocalStorage-persisted Zustand stores for global state.
- `src/components/`: Modular React components for UI.
