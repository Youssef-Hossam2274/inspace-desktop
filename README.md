# InSpace Desktop

A modern desktop application built with:

- **Electron.js** - Cross-platform desktop app framework
- **React** - UI library with TypeScript support
- **TypeScript** - Type safety and better development experience
- **SCSS** - Enhanced CSS with variables and mixins
- **Vite** - Fast build tool and development server
- **CSS Modules** - Scoped styling with SCSS modules
- **ESLint** - Code quality and consistency (ESLint v9)
- **Husky** - Git hooks for automated quality checks

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

### Linting

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Project Structure

```
src/
├── main/          # Electron main process
├── renderer/      # React application
│   ├── components/    # React components with CSS modules
│   ├── styles/        # Global SCSS stylesheets
│   └── types/         # TypeScript type definitions
└── preload/       # Electron preload scripts
```

## Build System

This project uses **Vite** for fast development and optimized production builds:

- **Development**: Hot module replacement with instant updates
- **Production**: Optimized bundles with CSS modules and tree shaking
- **SCSS Modules**: Component-scoped styling with camelCase class names
- **TypeScript**: Full type safety across the entire application
