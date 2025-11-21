# GeniusApps

An Nx monorepo workspace containing the GNSVRS audio visualizer application.

## Projects

### gnsvrs

A React/TypeScript audio visualizer application with playlist management and a beat store.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

To run the gnsvrs app in development mode:

```bash
npm start
# or
nx serve gnsvrs
```

The app will be available at `http://localhost:4200`

### Build

To build the gnsvrs app:

```bash
npm run build
# or
nx build gnsvrs
```

### Features

- **Audio Visualizer**: Real-time audio visualization with Web Audio API
- **Playlist Management**: Upload and manage audio files in a playlist
- **Beat Store**: Browse and purchase beats (demo store)
- **Background Customization**: Upload custom background images
- **Vibration Effects**: Toggle background vibration synchronized with audio
- **Loop Controls**: Loop individual tracks or entire playlists

## Project Structure

```
geniusapps/
├── apps/
│   └── gnsvrs/          # React/TypeScript audio visualizer app
│       └── src/
│           ├── app/
│           │   ├── app.tsx              # Main app with routing
│           │   └── components/
│           │       ├── AudioVisualizer.tsx
│           │       ├── AudioVisualizer.css
│           │       ├── BeatStore.tsx
│           │       └── BeatStore.css
│           ├── main.tsx                 # App entry point
│           └── styles.css               # Global styles
├── nx.json
├── package.json
└── tsconfig.base.json
```

## Technologies

- **React 18**: UI library
- **TypeScript**: Type safety
- **React Router**: Client-side routing
- **Web Audio API**: Audio analysis and visualization
- **Nx**: Monorepo tooling

## Migration Notes

This project was migrated from a vanilla JavaScript application in the TEST1 directory. Key changes:

- Converted to React functional components with hooks
- Added TypeScript for type safety
- Implemented React Router for navigation
- Maintained all original functionality (audio visualization, playlist, beat store)
- Preserved original styling and UI/UX



