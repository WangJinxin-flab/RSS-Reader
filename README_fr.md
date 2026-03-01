<div align="right">
  <a href="README.md">English</a> |
  <a href="README_zh.md">简体中文</a> |
  <a href="README_ru.md">Русский</a> |
  <a href="README_es.md">Español</a> |
  <strong>Français</strong> |
  <a href="README_ar.md">العربية</a>
</div>

<p align="center">
  <img src="icon.svg" width="128" height="128" alt="RSS Reader Logo">
</p>

<h1 align="center">RSS Reader</h1>

<p align="center">
  <strong>Un lecteur RSS de bureau propulsé par l'IA, axé sur le local. Pas de cloud. Pas de suivi. Juste vos flux.</strong>
</p>

<p align="center">
  <a href="https://github.com/WangJinxin-flab/RSS-Reader/releases"><img src="https://img.shields.io/github/v/release/WangJinxin-flab/RSS-Reader?color=blue&label=T%C3%A9l%C3%A9charger" alt="Releases"></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built_with-Tauri_2.0-24C8DB?logo=tauri&logoColor=white" alt="Tauri"></a>
</p>

<p align="center">
  <a href="#pourquoi-rss-reader">Pourquoi RSS Reader ?</a> •
  <a href="#fonctionnalités">Fonctionnalités</a> •
  <a href="#télécharger">Télécharger</a> •
  <a href="#technologies">Technologies</a> •
  <a href="#développement">Développement</a>
</p>

---

**Capture d'écran**
<img src="imgs/screenshot.png" alt="App Preview" width="800">

## Pourquoi RSS Reader ?

Dans un monde où les services par abonnement et la synchronisation sur le cloud sont omniprésents, **RSS Reader** adopte une approche différente. C'est une application de bureau moderne qui conserve toutes vos données strictement sur votre machine locale. Propulsé par Tauri et Rust, il est extrêmement rapide, économe en mémoire et profondément intégré à l'IA pour améliorer votre expérience de lecture.

## Fonctionnalités

### Lecture et Gestion de Flux
- **Support Universel :** Abonnez-vous facilement aux flux RSS, Atom et JSON.
- **Synchronisation Intelligente :** Synchronisation incrémentielle utilisant les en-têtes `ETag` et `Last-Modified` pour économiser la bande passante.
- **Support OPML :** Importez et exportez facilement vos listes de flux.
- **Lecture Immersive :** Mode de lecture épuré, barre de progression et table des matières dynamique.
- **Priorité aux Médias :** Les vidéos YouTube et Bilibili intégrées fonctionnent de manière native.

### Intégration de l'IA
- **Résumés Intelligents :** Générez automatiquement des résumés d'articles à l'aide des API d'OpenAI ou d'Anthropic.
- **Traduction en un clic :** Traduisez des articles entiers nativement sans quitter l'application.
- **Règles d'Automatisation :** Créez de puissantes règles basées sur l'IA (ex. "Mettre automatiquement en favori les articles avec un score de pertinence IA > 80").

### Expérience de Bureau Native
- **Mise en cache locale :** Le protocole personnalisé `rss-media://` met en cache de manière sécurisée les images et les vidéos en streaming pour une consultation hors ligne.
- **Hautes Performances :** Les listes virtualisées (`react-virtuoso`) gèrent des milliers d'articles sans effort.
- **Conçu pour les Utilisateurs Avancés :** Raccourcis clavier globaux complets pour une navigation sans souris.
- **Thèmes :** Thèmes Sombre et Clair adaptés au système.
- **Multilingue :** Disponible en arabe, chinois, anglais, français, russe et espagnol.

## Télécharger

Des binaires prêts à l'emploi sont disponibles via GitHub Releases.
> Uniquement pour MacOS pour le moment

| Plateforme | Architecture | Télécharger |
|----------|--------------|----------|
| **macOS** | Universel (Intel / Apple Silicon) | [Télécharger .dmg](https://github.com/WangJinxin-flab/RSS-Reader/releases) |

> [!TIP]
> **Mise à jour**
> L'application prend en charge les mises à jour automatiques nativement via Tauri. Une fois installé, vous serez automatiquement averti des nouvelles versions.

## Technologies

Ce projet exploite les langages Web et système modernes pour offrir une application native légère :

- **Cœur :** [Tauri 2.0](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **Frontend :** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Style :** [Tailwind CSS](https://tailwindcss.com/)
- **Gestion d'État :** [Zustand](https://docs.pmnd.rs/zustand/)
- **Base de Données :** SQLite (via `rusqlite` intégré)

## Développement

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (v1.70+)

### Démarrage Rapide

```bash
# 1. Cloner le dépôt
git clone https://github.com/your-username/rss-reader.git
cd rss-reader

# 2. Installer les dépendances frontend
npm install

# 3. Démarrer le serveur de développement (Frontend + Backend Rust)
npm run tauri:dev
```

### Commandes Utiles

| Commande | Description |
|---------|-------------|
| `npm run tauri:build` | Compiler l'application pour la version finale |
| `npm run dev`         | Exécuter uniquement le frontend Vite (sans le backend Rust) |
| `npm test`            | Exécuter les tests du frontend (Vitest) |
| `cargo test`          | Exécuter les tests du backend (Rust) |
| `npm run lint`        | Exécuter ESLint |

### Aperçu de l'Architecture
L'application utilise une séparation claire des responsabilités via l'IPC de Tauri (`invoke`) :
- `src-tauri/src/db/`: Opérations SQLite modulaires (flux, étiquettes, groupes, règles).
- `src-tauri/src/feed/`: Analyse des flux utilisant `feed-rs`.
- `src/stores/`: Stores Zustand persistés dans LocalStorage pour l'état global.
- `src/components/`: Composants React modulaires pour l'interface utilisateur.