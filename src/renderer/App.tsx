import React from 'react';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>InSpace Desktop</h1>
        <p>Welcome to your Electron + React + TypeScript + SCSS application!</p>
      </header>
      <main className="app-main">
        <div className="feature-card">
          <h2>🚀 Features</h2>
          <ul>
            <li>✅ Electron.js for desktop app</li>
            <li>✅ React with TypeScript</li>
            <li>✅ SCSS for styling</li>
            <li>✅ ESLint for code quality</li>
            <li>✅ Husky for git hooks</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default App;