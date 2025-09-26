# InSpace Desktop

A modern desktop application built with:

- **Electron.js** - Cross-platform desktop app framework
- **React** - UI library with TypeScript support
- **TypeScript** - Type safety and better development experience
- **SCSS** - Enhanced CSS with variables and mixins
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
├── preload/       # Electron preload scripts
└── styles/        # SCSS stylesheets
```