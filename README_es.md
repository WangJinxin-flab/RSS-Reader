<div align="right">
  <a href="README.md">English</a> |
  <a href="README_zh.md">简体中文</a> |
  <a href="README_ru.md">Русский</a> |
  <strong>Español</strong> |
  <a href="README_fr.md">Français</a> |
  <a href="README_ar.md">العربية</a>
</div>

<p align="center">
  <img src="icon.svg" width="128" height="128" alt="RSS Reader Logo">
</p>

<h1 align="center">RSS Reader</h1>

<p align="center">
  <strong>Un lector RSS de escritorio impulsado por IA, que prioriza lo local. Sin nube. Sin rastreo. Solo tus feeds.</strong>
</p>

<p align="center">
  <a href="https://github.com/WangJinxin-flab/RSS-Reader/releases"><img src="https://img.shields.io/github/v/release/WangJinxin-flab/RSS-Reader?color=blue&label=Descargar" alt="Releases"></a>
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey" alt="Platforms">
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Built_with-Tauri_2.0-24C8DB?logo=tauri&logoColor=white" alt="Tauri"></a>
</p>

<p align="center">
  <a href="#por-qué-rss-reader">¿Por qué RSS Reader?</a> •
  <a href="#características">Características</a> •
  <a href="#descargar">Descargar</a> •
  <a href="#stack-tecnológico">Stack Tecnológico</a> •
  <a href="#desarrollo">Desarrollo</a>
</p>

---

**Captura de pantalla**
<img src="imgs/screenshot.png" alt="App Preview" width="800">

## ¿Por qué RSS Reader?

En un mundo de servicios de suscripción y sincronización en la nube, **RSS Reader** toma un enfoque diferente. Es una aplicación de escritorio moderna que guarda todos tus datos estrictamente en tu máquina local. Desarrollada con Tauri y Rust, es increíblemente rápida, eficiente en el uso de memoria y se integra profundamente con la IA para potenciar tu experiencia de lectura.

## Características

### Lectura y Gestión de Feeds
- **Soporte Universal:** Suscríbete a feeds RSS, Atom y JSON sin problemas.
- **Sincronización Inteligente:** Sincronización incremental utilizando las cabeceras `ETag` y `Last-Modified` para ahorrar ancho de banda.
- **Soporte OPML:** Importa y exporta fácilmente tus listas de feeds.
- **Lectura Inmersiva:** Modo de lectura limpio, barra de progreso y tabla de contenidos dinámica.
- **Prioridad Multimedia:** Los vídeos incrustados de YouTube y Bilibili funcionan de forma nativa.

### Integración con IA
- **Resúmenes Inteligentes:** Genera automáticamente resúmenes de artículos utilizando las APIs de OpenAI o Anthropic.
- **Traducción con Un Clic:** Traduce artículos enteros de forma nativa sin salir de la aplicación.
- **Reglas de Automatización:** Construye reglas potentes impulsadas por IA (ej. "Destacar automáticamente los artículos con una puntuación de relevancia de IA > 80").

### Experiencia Nativa de Escritorio
- **Caché Local:** El protocolo personalizado `rss-media://` almacena de forma segura imágenes y vídeos en streaming para su visualización sin conexión.
- **Alto Rendimiento:** Las listas virtualizadas (`react-virtuoso`) manejan miles de artículos sin esfuerzo.
- **Para Usuarios Avanzados:** Completos atajos de teclado globales para la navegación sin ratón.
- **Temas:** Temas Claro y Oscuro que se adaptan al sistema.
- **Multilingüe:** Disponible en árabe, chino, inglés, francés, ruso y español.

## Descargar

Los binarios listos para usar están disponibles a través de GitHub Releases.
> Solo para MacOS por ahora

| Plataforma | Arquitectura | Descargar |
|----------|--------------|----------|
| **macOS** | Universal (Intel / Apple Silicon) | [Descargar .dmg](https://github.com/WangJinxin-flab/RSS-Reader/releases) |

> [!TIP]
> **Actualización**
> La aplicación admite actualizaciones automáticas de forma nativa a través de Tauri. Una vez instalada, recibirás notificaciones de nuevas versiones automáticamente.

## Stack Tecnológico

Este proyecto aprovecha las tecnologías web y sistemas de lenguajes modernos para ofrecer una aplicación nativa ligera:

- **Núcleo:** [Tauri 2.0](https://v2.tauri.app/) + [Rust](https://www.rust-lang.org/)
- **Frontend:** [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Gestión de Estado:** [Zustand](https://docs.pmnd.rs/zustand/)
- **Base de Datos:** SQLite (a través de `rusqlite` integrado)

## Desarrollo

### Requisitos previos
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (v1.70+)

### Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-username/rss-reader.git
cd rss-reader

# 2. Instalar dependencias del frontend
npm install

# 3. Iniciar el servidor de desarrollo (Frontend + Rust Backend)
npm run tauri:dev
```

### Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run tauri:build` | Construir el paquete de la aplicación para su lanzamiento |
| `npm run dev`         | Ejecutar solo el frontend de Vite (sin el backend de Rust) |
| `npm test`            | Ejecutar pruebas del frontend (Vitest) |
| `cargo test`          | Ejecutar pruebas del backend (Rust) |
| `npm run lint`        | Ejecutar ESLint |

### Resumen de Arquitectura
La aplicación utiliza una clara separación de responsabilidades a través del IPC de Tauri (`invoke`):
- `src-tauri/src/db/`: Operaciones modulares de SQLite (feeds, etiquetas, grupos, reglas).
- `src-tauri/src/feed/`: Análisis de feeds utilizando `feed-rs`.
- `src/stores/`: Almacenes Zustand persistidos en LocalStorage para el estado global.
- `src/components/`: Componentes modulares de React para la interfaz de usuario.